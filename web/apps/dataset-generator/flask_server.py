from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
from pathlib import Path

app = Flask(__name__)

# FIXED: Enable CORS for localhost:8080 specifically
CORS(app, origins=[
    "http://localhost:8080",  # Your web interface
    "http://127.0.0.1:8080",  # Alternative localhost
    "http://localhost:3000",  # Common dev server port
    "http://127.0.0.1:3000"   # Alternative localhost
])

# Locked config directory path - UPDATED to use correct path structure
CONFIG_DIR = Path(__file__).parent.parent.parent.parent.parent / "config" / "apps" / "generator"
CONFIG_DIR.mkdir(parents=True, exist_ok=True)

@app.route('/api/configs', methods=['GET'])
def list_configs():
    """List all available config files"""
    try:
        configs = []
        for file_path in CONFIG_DIR.glob("*.json"):
            configs.append({
                "name": file_path.name,
                "modified": file_path.stat().st_mtime
            })
        
        # Sort by modification time (newest first)
        configs.sort(key=lambda x: x["modified"], reverse=True)
        
        print(f"📁 Found {len(configs)} config files in {CONFIG_DIR}")
        return jsonify(configs)
        
    except Exception as e:
        print(f"❌ Error listing configs: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/configs/<config_name>', methods=['GET'])
def load_config(config_name):
    """Load a specific config file"""
    try:
        # Ensure .json extension
        if not config_name.endswith('.json'):
            config_name += '.json'
            
        config_path = CONFIG_DIR / config_name
        
        if not config_path.exists():
            print(f"❌ Config not found: {config_path}")
            return jsonify({"error": "Config not found"}), 404
            
        with open(config_path, 'r') as f:
            config = json.load(f)
            
        print(f"✅ Loaded config: {config_name}")
        return jsonify(config)
        
    except Exception as e:
        print(f"❌ Error loading config {config_name}: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/configs/<config_name>', methods=['POST'])
def save_config(config_name):
    """Save a config file"""
    try:
        # Ensure .json extension
        if not config_name.endswith('.json'):
            config_name += '.json'
            
        config_data = request.get_json()
        config_path = CONFIG_DIR / config_name
        
        with open(config_path, 'w') as f:
            json.dump(config_data, f, indent=2)
            
        print(f"✅ Saved config: {config_name} to {config_path}")
        return jsonify({
            "message": f"Config saved: {config_name}",
            "filePath": str(config_path)
        })
        
    except Exception as e:
        print(f"❌ Error saving config {config_name}: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/generate-config', methods=['POST'])
def generate_config():
    """Save config for C++ dataset generation"""
    try:
        data = request.get_json()
        file_name = data['fileName']
        config = data['config']
        
        # Ensure .json extension
        if not file_name.endswith('.json'):
            file_name += '.json'
            
        config_path = CONFIG_DIR / file_name
        
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)
            
        print(f"🚀 Generated config for C++: {file_name} at {config_path}")
        return jsonify({
            "message": f"Configuration ready for dataset generation",
            "filePath": str(config_path),
            "fileName": file_name,
            "command": f"./dataset_generator {config_path}"
        })
        
    except Exception as e:
        print(f"❌ Error generating config: {e}")
        return jsonify({"error": str(e)}), 500

# Add a health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    """Simple health check"""
    return jsonify({
        "status": "ok",
        "message": "Flask server is running",
        "config_dir": str(CONFIG_DIR),
        "config_dir_exists": CONFIG_DIR.exists()
    })

if __name__ == '__main__':
    print(f"📁 Config directory: {CONFIG_DIR}")
    print(f"📂 Directory exists: {CONFIG_DIR.exists()}")
    print(f"🌐 Starting Flask server on http://localhost:5000")
    print(f"🔗 Allowing CORS from http://localhost:8080")
    
    # Create config directory if it doesn't exist
    if not CONFIG_DIR.exists():
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)
        print(f"✅ Created config directory: {CONFIG_DIR}")
    
    app.run(debug=True, host='localhost', port=5000)
