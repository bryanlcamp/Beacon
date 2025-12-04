#!/usr/bin/env python3
"""
Beacon Flask Web Server
Serves ALL existing pages + API endpoints for dataset generator
Maintains single-page architecture with auto-detection for GitHub Pages vs Production
"""

from flask import Flask, send_from_directory, jsonify, request, abort
from flask_cors import CORS
import json
import os
from pathlib import Path

# Create Flask app
app = Flask(__name__)

# Enable CORS for all routes
CORS(app)

# Get paths
WEB_ROOT = Path(__file__).parent
BEACON_ROOT = WEB_ROOT.parent
CONFIG_DIR = BEACON_ROOT / "config" / "apps" / "generator"

# Create config directory if it doesn't exist
CONFIG_DIR.mkdir(parents=True, exist_ok=True)

# ===============================
# STATIC FILE SERVING - ALL PAGES
# ===============================

@app.route('/')
def root_index():
    """Serve the main beacon index"""
    return send_from_directory(WEB_ROOT, 'index.html')

# Command Center routes
@app.route('/command-center/')
@app.route('/command-center/index.html')
def command_center_index():
    return send_from_directory(WEB_ROOT / 'command-center', 'index.html')

@app.route('/command-center/setup/<path:filename>')
def command_center_setup(filename):
    return send_from_directory(WEB_ROOT / 'command-center' / 'setup', filename)

@app.route('/command-center/protocols/<path:filename>')
def command_center_protocols(filename):
    return send_from_directory(WEB_ROOT / 'command-center' / 'protocols', filename)

# Dataset Generator routes
@app.route('/apps/dataset-generator/')
@app.route('/apps/dataset-generator/index.html')
def dataset_generator():
    return send_from_directory(WEB_ROOT / 'apps' / 'dataset-generator', 'index.html')

@app.route('/apps/dataset-generator/<path:filename>')
def dataset_generator_files(filename):
    return send_from_directory(WEB_ROOT / 'apps' / 'dataset-generator', filename)

# Shared resources
@app.route('/shared/<path:filename>')
def shared_resources(filename):
    return send_from_directory(WEB_ROOT / 'shared', filename)

# Any other static file
@app.route('/<path:filename>')
def serve_static_file(filename):
    """Serve any other static file from web root"""
    file_path = WEB_ROOT / filename
    if file_path.exists() and file_path.is_file():
        return send_from_directory(WEB_ROOT, filename)
    else:
        abort(404)

# ===============================
# API ENDPOINTS - PRODUCTION ONLY
# ===============================

@app.route('/api/configs', methods=['GET'])
def list_configs():
    """List all available config files - PRODUCTION ONLY"""
    try:
        configs = []
        for file_path in CONFIG_DIR.glob("*.json"):
            configs.append({
                "name": file_path.name,
                "modified": file_path.stat().st_mtime
            })
        configs.sort(key=lambda x: x["modified"], reverse=True)
        print(f"📁 Found {len(configs)} config files")
        return jsonify(configs)
    except Exception as e:
        print(f"❌ Error listing configs: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/configs/<config_name>', methods=['GET'])
def load_config(config_name):
    """Load a specific config file - PRODUCTION ONLY"""
    try:
        if not config_name.endswith('.json'):
            config_name += '.json'
        config_path = CONFIG_DIR / config_name
        if not config_path.exists():
            return jsonify({"error": "Config not found"}), 404
        with open(config_path, 'r') as f:
            config = json.load(f)
        print(f"✅ Loaded config: {config_name}")
        return jsonify(config)
    except Exception as e:
        print(f"❌ Error loading config: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/configs/<config_name>', methods=['POST'])
def save_config(config_name):
    """Save a config file - PRODUCTION ONLY"""
    try:
        if not config_name.endswith('.json'):
            config_name += '.json'
        config_data = request.get_json()
        config_path = CONFIG_DIR / config_name
        with open(config_path, 'w') as f:
            json.dump(config_data, f, indent=2)
        print(f"✅ Saved config: {config_name}")
        return jsonify({
            "message": f"Config saved: {config_name}",
            "filePath": str(config_path)
        })
    except Exception as e:
        print(f"❌ Error saving config: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/generate-config', methods=['POST'])
def generate_config():
    """Save config for C++ dataset generation - PRODUCTION ONLY"""
    try:
        data = request.get_json()
        file_name = data['fileName']
        config = data['config']
        if not file_name.endswith('.json'):
            file_name += '.json'
        config_path = CONFIG_DIR / file_name
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)
        print(f"🚀 Generated config for C++: {config_path}")
        return jsonify({
            "message": f"Configuration ready for dataset generation",
            "filePath": str(config_path),
            "fileName": file_name,
            "command": f"./dataset_generator {config_path}"
        })
    except Exception as e:
        print(f"❌ Error generating config: {e}")
        return jsonify({"error": str(e)}), 500

# Health check
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "message": "Beacon Flask server running",
        "config_dir": str(CONFIG_DIR),
        "config_dir_exists": CONFIG_DIR.exists()
    })

if __name__ == '__main__':
    print("🚀 Starting Beacon Web Server with Flask...")
    print(f"📁 Config directory: {CONFIG_DIR}")
    print(f"🌐 Server: http://localhost:8080")
    print(f"📋 Serving all existing pages with auto-detection")
    print(f"🎯 Dataset Generator: Full functionality in production")
    print(f"🎭 Dataset Generator: Demo mode on GitHub Pages")
    print(f"🛑 Press Ctrl+C to stop")
    
    app.run(
        host='localhost',
        port=8080,
        debug=True,
        use_reloader=False
    )