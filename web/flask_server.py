import os
import json
import subprocess
import time
from datetime import datetime
from pathlib import Path
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for web UI

# Configuration
CONFIG_DIR = Path("configs")
OUTPUT_DIR = Path("output")
CPP_EXECUTABLE = "../bin/dataset_generator"  # Adjust path to your C++ executable

# Ensure directories exist
CONFIG_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

@app.route('/api/configs', methods=['GET'])
def list_configs():
    """List available configuration files"""
    try:
        configs = []
        for config_file in CONFIG_DIR.glob("*.json"):
            stat = config_file.stat()
            configs.append({
                "name": config_file.name,
                "modified": stat.st_mtime
            })
        
        # Sort by modification time (newest first)
        configs.sort(key=lambda x: x['modified'], reverse=True)
        
        return jsonify(configs)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/configs/<config_name>', methods=['GET'])
def load_config(config_name):
    """Load a specific configuration file"""
    try:
        config_path = CONFIG_DIR / config_name
        if not config_path.exists():
            return jsonify({"error": "Config not found"}), 404
        
        with open(config_path, 'r') as f:
            config = json.load(f)
        
        return jsonify(config)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/configs/<config_name>', methods=['POST'])
def save_config(config_name):
    """Save a configuration file"""
    try:
        config_data = request.get_json()
        config_path = CONFIG_DIR / config_name
        
        with open(config_path, 'w') as f:
            json.dump(config_data, f, indent=2)
        
        return jsonify({
            "success": True,
            "message": f"Config saved as {config_name}",
            "path": str(config_path)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/generate-dataset', methods=['POST'])
def generate_dataset():
    """Save config and launch C++ dataset generator"""
    try:
        data = request.get_json()
        config_name = data.get('configName')
        config_data = data.get('config')
        
        if not config_name or not config_data:
            return jsonify({"error": "Missing config name or data"}), 400
        
        # Save config file
        config_path = CONFIG_DIR / config_name
        with open(config_path, 'w') as f:
            json.dump(config_data, f, indent=2)
        
        print(f"🔧 Saved config: {config_path}")
        
        # Check if C++ executable exists
        cpp_path = Path(CPP_EXECUTABLE)
        if not cpp_path.exists():
            return jsonify({
                "error": f"C++ executable not found at {cpp_path}. Please build the project first."
            }), 500
        
        # Launch C++ process
        print(f"🚀 Launching C++ generator: {cpp_path} {config_path}")
        
        start_time = time.time()
        
        # Run C++ executable with config file as parameter
        result = subprocess.run(
            [str(cpp_path), str(config_path)],
            cwd=OUTPUT_DIR,  # Run in output directory
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )
        
        end_time = time.time()
        generation_time = round(end_time - start_time, 2)
        
        if result.returncode == 0:
            # Success - find generated files
            output_files = []
            base_name = config_data.get('metadata', {}).get('fileName', 'dataset')
            
            # Look for common output file extensions
            for ext in ['.bin', '.csv', '.json']:
                output_file = OUTPUT_DIR / f"{base_name}{ext}"
                if output_file.exists():
                    output_files.append(str(output_file))
            
            print(f"✅ Generation complete in {generation_time}s")
            print(f"📁 Output files: {output_files}")
            
            return jsonify({
                "success": True,
                "message": "Dataset generated successfully",
                "config_path": str(config_path),
                "output_files": output_files,
                "generation_time": generation_time,
                "stdout": result.stdout,
                "stderr": result.stderr
            })
        else:
            # C++ process failed
            error_msg = f"C++ generator failed (exit code {result.returncode})"
            if result.stderr:
                error_msg += f"\nError: {result.stderr}"
            
            print(f"❌ {error_msg}")
            
            return jsonify({
                "success": False,
                "error": error_msg,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "exit_code": result.returncode
            }), 500
            
    except subprocess.TimeoutExpired:
        return jsonify({
            "success": False,
            "error": "Dataset generation timed out (5 minutes)"
        }), 500
    except Exception as e:
        print(f"❌ Exception during generation: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/status', methods=['GET'])
def status():
    """Health check endpoint"""
    cpp_path = Path(CPP_EXECUTABLE)
    return jsonify({
        "status": "running",
        "cpp_executable_exists": cpp_path.exists(),
        "cpp_path": str(cpp_path),
        "config_dir": str(CONFIG_DIR),
        "output_dir": str(OUTPUT_DIR)
    })

# Static file serving routes
@app.route('/')
def root():
    """Redirect to main web interface"""
    return send_from_directory('web', 'index.html')

@app.route('/apps/dataset-generator/')
def dataset_generator():
    """Serve dataset generator application"""
    return send_from_directory('apps/dataset-generator', 'index.html')

@app.route('/apps/dataset-generator/<path:filename>')
def dataset_generator_assets(filename):
    """Serve dataset generator assets (CSS, JS, images)"""
    return send_from_directory('apps/dataset-generator', filename)

@app.route('/web/<path:filename>')
def web_assets(filename):
    """Serve general web assets"""
    return send_from_directory('web', filename)

@app.route('/apps/<path:filename>')
def apps_assets(filename):
    """Serve application assets"""
    return send_from_directory('apps', filename)

if __name__ == '__main__':
    print("🔥 Starting Beacon Dataset Generator Flask Server")
    print(f"📁 Config directory: {CONFIG_DIR.absolute()}")
    print(f"📁 Output directory: {OUTPUT_DIR.absolute()}")
    print(f"🔧 C++ executable: {Path(CPP_EXECUTABLE).absolute()}")
    print(f"🌐 Web UI: http://localhost:8080/apps/dataset-generator/")
    
    app.run(host='localhost', port=8080, debug=True)
