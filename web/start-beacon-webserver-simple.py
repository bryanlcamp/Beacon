#!/usr/bin/env python3
"""
Beacon Market Data Configuration Web Server
Self-contained localhost web server for independent traders
"""

import json
import os
import subprocess
import sys
from pathlib import Path
from flask import Flask, jsonify, request, send_from_directory
import threading
import time

app = Flask(__name__)

# Configuration
BEACON_ROOT = Path(__file__).parent.parent  # Go up one level from web/ to beacon/
CONFIG_DIR = BEACON_ROOT / "config"
OUTPUT_DIR = BEACON_ROOT / "outputs"
BUILD_DIR = BEACON_ROOT / "build"

# Load app directories configuration
def load_app_directories():
    """Load directory configuration from app-directories.json"""
    app_dirs_file = BEACON_ROOT / "config" / "app-directories.json"
    if app_dirs_file.exists():
        try:
            with open(app_dirs_file, 'r') as f:
                config = json.load(f)
                generator_config = config.get("Generator", {}).get("Config", {})
                config_path = generator_config.get("Path", "usr/config/generator/")
                # Ensure path is relative to BEACON_ROOT
                return BEACON_ROOT / config_path
        except Exception as e:
            print(f"Warning: Could not load app-directories.json: {e}")
    
    # Fallback to default
    return BEACON_ROOT / "usr" / "config" / "generator"

def load_generator_binary_path():
    """Load generator binary path from app-directories.json"""
    app_dirs_file = BEACON_ROOT / "config" / "app-directories.json"
    if app_dirs_file.exists():
        try:
            with open(app_dirs_file, 'r') as f:
                config = json.load(f)
                binary_config = config.get("Generator", {}).get("Binary", {})
                binary_path = binary_config.get("Path", "build/bin/generator")
                
                # Handle paths that start with "beacon/" by removing the prefix
                if binary_path.startswith("beacon/"):
                    binary_path = binary_path[7:]  # Remove "beacon/" prefix
                
                # Return the full path with generator executable name
                return BEACON_ROOT / binary_path / "generator"
        except Exception as e:
            print(f"Warning: Could not load binary path from app-directories.json: {e}")
    
    # Fallback to default
    return BEACON_ROOT / "build" / "bin" / "generator"

GENERATOR_CONFIG_DIR = load_app_directories()

# Ensure directories exist
CONFIG_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)
GENERATOR_CONFIG_DIR.mkdir(parents=True, exist_ok=True)

class BeaconWebServer:
    def __init__(self):
        self.generator_process = None
        self.generator_status = "stopped"
        
    def get_config_files(self):
        """Get list of available configuration files"""
        configs = []
        if CONFIG_DIR.exists():
            for file in CONFIG_DIR.glob("*.json"):
                configs.append({
                    "name": file.stem,
                    "path": str(file),
                    "modified": file.stat().st_mtime
                })
        return sorted(configs, key=lambda x: x['modified'], reverse=True)
    
    def load_config(self, config_name):
        """Load a configuration file"""
        config_path = CONFIG_DIR / f"{config_name}.json"
        if config_path.exists():
            try:
                with open(config_path, 'r') as f:
                    return json.load(f)
            except Exception as e:
                return {"error": f"Failed to load config: {str(e)}"}
        return {"error": "Configuration file not found"}
    
    def save_config(self, config_name, config_data):
        """Save a configuration file"""
        try:
            config_path = CONFIG_DIR / f"{config_name}.json"
            with open(config_path, 'w') as f:
                json.dump(config_data, f, indent=2)
            return {"success": True, "message": f"Configuration '{config_name}' saved successfully"}
        except Exception as e:
            return {"error": f"Failed to save config: {str(e)}"}
    
    def start_generator(self, config_name):
        """Start the market data generator"""
        if self.generator_process and self.generator_process.poll() is None:
            return {"error": "Generator is already running"}
        
        try:
            # Path to the generator executable from config
            generator_exe = load_generator_binary_path()
            if not generator_exe.exists():
                return {"error": f"Generator executable not found at {generator_exe}"}
            
            # Handle standalone configs (config_name might be "standalone/configname")
            if config_name.startswith("standalone/"):
                actual_config_name = config_name.replace("standalone/", "")
                config_path = GENERATOR_CONFIG_DIR / f"{actual_config_name}.json"
            else:
                config_path = CONFIG_DIR / f"{config_name}.json"
            
            if not config_path.exists():
                return {"error": f"Configuration file not found: {config_path}"}
            
            # Start the generator process
            cmd = [str(generator_exe), "--config", str(config_path)]
            self.generator_process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                cwd=str(BEACON_ROOT)
            )
            
            self.generator_status = "running"
            return {"success": True, "message": f"Generator started with config '{config_name}'", "pid": self.generator_process.pid}
            
        except Exception as e:
            self.generator_status = "error"
            return {"error": f"Failed to start generator: {str(e)}"}
    
    def stop_generator(self):
        """Stop the market data generator"""
        if self.generator_process and self.generator_process.poll() is None:
            try:
                self.generator_process.terminate()
                # Wait up to 5 seconds for graceful shutdown
                self.generator_process.wait(timeout=5)
                self.generator_status = "stopped"
                return {"success": True, "message": "Generator stopped successfully"}
            except subprocess.TimeoutExpired:
                # Force kill if graceful shutdown failed
                self.generator_process.kill()
                self.generator_status = "stopped"
                return {"success": True, "message": "Generator force stopped"}
            except Exception as e:
                return {"error": f"Failed to stop generator: {str(e)}"}
        else:
            self.generator_status = "stopped"
            return {"message": "Generator is not running"}
    
    def get_generator_status(self):
        """Get current generator status"""
        if self.generator_process:
            if self.generator_process.poll() is None:
                self.generator_status = "running"
            else:
                self.generator_status = "stopped"
        
        return {
            "status": self.generator_status,
            "pid": self.generator_process.pid if self.generator_process and self.generator_process.poll() is None else None
        }

# Global server instance
beacon_server = BeaconWebServer()

# API Routes
@app.route('/')
def index():
    """Serve the main landing page (apps/index.html)"""
    return send_from_directory('apps', 'index.html')

@app.route('/api/configs')
def get_configs():
    """Get list of configuration files"""
    return jsonify(beacon_server.get_config_files())

@app.route('/api/app-directories')
def get_app_directories():
    """Get app-directories.json configuration"""
    app_dirs_file = BEACON_ROOT / "config" / "app-directories.json"
    if app_dirs_file.exists():
        try:
            with open(app_dirs_file, 'r') as f:
                return jsonify(json.load(f))
        except Exception as e:
            return jsonify({"error": f"Failed to load app-directories.json: {str(e)}"}), 500
    else:
        return jsonify({"error": "app-directories.json not found"}), 404

@app.route('/api/config/<config_name>')
def get_config(config_name):
    """Load a specific configuration"""
    return jsonify(beacon_server.load_config(config_name))

@app.route('/api/config/<config_name>', methods=['POST'])
def save_config(config_name):
    """Save a configuration"""
    try:
        config_data = request.get_json()
        result = beacon_server.save_config(config_name, config_data)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": f"Invalid JSON data: {str(e)}"}), 400

@app.route('/api/configs/standalone')
def get_standalone_configs():
    """Get list of standalone configuration files"""
    print(f"[DEBUG] Scanning GENERATOR_CONFIG_DIR: {GENERATOR_CONFIG_DIR}")
    configs = []
    if GENERATOR_CONFIG_DIR.exists():
        for file in GENERATOR_CONFIG_DIR.glob("*.json"):
            print(f"[DEBUG] Found config file: {file}")
            configs.append({
                "name": file.stem,
                "path": str(file),
                "modified": file.stat().st_mtime
            })
    else:
        print(f"[DEBUG] GENERATOR_CONFIG_DIR does not exist: {GENERATOR_CONFIG_DIR}")
    return jsonify(sorted(configs, key=lambda x: x['modified'], reverse=True))

@app.route('/api/config/standalone/<config_name>')
def get_standalone_config(config_name):
    """Load a standalone configuration"""
    config_path = GENERATOR_CONFIG_DIR / f"{config_name}.json"
    
    if config_path.exists():
        try:
            with open(config_path, 'r') as f:
                return jsonify(json.load(f))
        except Exception as e:
            return jsonify({"error": f"Failed to load config: {str(e)}"}), 500
    else:
        return jsonify({"error": "Configuration file not found"}), 404

def update_default_config(config_name):
    """Update the Default config in app-directories.json"""
    app_dirs_file = BEACON_ROOT / "config" / "app-directories.json"
    try:
        # Load current app-directories.json
        if app_dirs_file.exists():
            with open(app_dirs_file, 'r') as f:
                app_dirs = json.load(f)
        else:
            app_dirs = {"Generator": {"Config": {"Path": "usr/config/generator/"}}}
        
        # Update the Default field
        if "Generator" not in app_dirs:
            app_dirs["Generator"] = {}
        if "Config" not in app_dirs["Generator"]:
            app_dirs["Generator"]["Config"] = {}
        
        app_dirs["Generator"]["Config"]["Default"] = f"{config_name}.json"
        
        # Save updated app-directories.json
        with open(app_dirs_file, 'w') as f:
            json.dump(app_dirs, f, indent=2)
            
        print(f"Updated default config to: {config_name}.json")
        return True
        
    except Exception as e:
        print(f"Warning: Could not update default config: {e}")
        return False

def cleanup_old_configs(max_configs=20):
    """Delete oldest config files, keeping only the most recent max_configs files"""
    try:
        if not GENERATOR_CONFIG_DIR.exists():
            return
        
        # Get all config files with their modification times
        config_files = []
        for file in GENERATOR_CONFIG_DIR.glob("*.json"):
            config_files.append({
                'path': file,
                'modified': file.stat().st_mtime
            })
        
        # If we have more than max_configs, delete the oldest ones
        if len(config_files) > max_configs:
            # Sort by modification time (oldest first)
            config_files.sort(key=lambda x: x['modified'])
            
            # Delete the oldest files
            files_to_delete = len(config_files) - max_configs
            for i in range(files_to_delete):
                file_to_delete = config_files[i]['path']
                file_to_delete.unlink()
                print(f"Deleted old config file: {file_to_delete.name}")
                
    except Exception as e:
        print(f"Warning: Could not cleanup old configs: {e}")

@app.route('/api/config/standalone/<config_name>', methods=['POST'])
def save_standalone_config(config_name):
    """Save a standalone configuration"""
    try:
        config_data = request.get_json()
        GENERATOR_CONFIG_DIR.mkdir(parents=True, exist_ok=True)
        
        config_path = GENERATOR_CONFIG_DIR / f"{config_name}.json"
        with open(config_path, 'w') as f:
            json.dump(config_data, f, indent=2)
        
        # Update the default config in app-directories.json
        update_default_config(config_name)
        
        # Clean up old configs (keep only 20 most recent)
        cleanup_old_configs(20)
        
        return jsonify({"success": True, "message": f"Configuration '{config_name}' saved successfully"})
    except Exception as e:
        return jsonify({"error": f"Failed to save config: {str(e)}"}), 500

@app.route('/api/config/standalone/<config_name>', methods=['DELETE'])
def delete_standalone_config(config_name):
    """Delete a standalone configuration"""
    try:
        config_path = GENERATOR_CONFIG_DIR / f"{config_name}.json"
        
        if config_path.exists():
            config_path.unlink()
            print(f"Deleted corrupt config file: {config_name}.json")
            return jsonify({"success": True, "message": f"Configuration '{config_name}' deleted successfully"})
        else:
            return jsonify({"error": "Configuration file not found"}), 404
            
    except Exception as e:
        return jsonify({"error": f"Failed to delete config: {str(e)}"}), 500

@app.route('/api/generate', methods=['POST'])
def start_generator():
    """Start the market data generator"""
    try:
        data = request.get_json()
        config_name = data.get('config_name')
        if not config_name:
            return jsonify({"error": "config_name is required"}), 400
        
        result = beacon_server.start_generator(config_name)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": f"Failed to start generator: {str(e)}"}), 500

@app.route('/api/stop', methods=['POST'])
def stop_generator():
    """Stop the market data generator"""
    result = beacon_server.stop_generator()
    return jsonify(result)

@app.route('/api/status')
def get_status():
    """Get generator status"""
    return jsonify(beacon_server.get_generator_status())

@app.route('/api/validate', methods=['POST'])
def validate_config():
    """Validate a configuration without saving"""
    try:
        config_data = request.get_json()
        
        # Basic validation
        errors = []
        
        # Check required fields
        required_fields = ['exchange', 'symbols']
        for field in required_fields:
            if field not in config_data:
                errors.append(f"Missing required field: {field}")
        
        # Validate symbols and percentages
        if 'symbols' in config_data:
            total_percentage = 0
            for symbol_data in config_data['symbols']:
                if 'percentage' in symbol_data:
                    total_percentage += symbol_data['percentage']
            
            if abs(total_percentage - 100.0) > 0.01:  # Allow small floating point differences
                errors.append(f"Symbol percentages must total 100%, currently: {total_percentage}%")
        
        return jsonify({
            "valid": len(errors) == 0,
            "errors": errors
        })
        
    except Exception as e:
        return jsonify({"valid": False, "errors": [f"Validation error: {str(e)}"]})

# Static file serving for CSS, JS, etc.
@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files from beacon root directory"""
    return send_from_directory('..', filename)

def main():
    """Main entry point"""
    print("=" * 60)
    print("🚀 Beacon Market Data Configuration Server")
    print("=" * 60)
    print(f"📁 Beacon Root: {BEACON_ROOT}")
    print(f"📁 Config Directory: {CONFIG_DIR}")
    print(f"📁 Generator Config Directory: {GENERATOR_CONFIG_DIR}")
    print(f"📁 Output Directory: {OUTPUT_DIR}")
    print("=" * 60)
    print("🌐 Starting web server on http://localhost:8080")
    print("🔗 Open your browser and navigate to: http://localhost:8080")
    print("=" * 60)
    print("💡 Self-contained localhost operation - no network setup required!")
    print("🛑 Press Ctrl+C to stop the server")
    print("=" * 60)
    
    try:
        # Run on localhost only - completely self-contained
        app.run(
            host='127.0.0.1',
            port=8080,
            debug=False,
            threaded=True
        )
    except KeyboardInterrupt:
        print("\n🛑 Shutting down Beacon web server...")
        # Clean up any running generator process
        beacon_server.stop_generator()
        print("✅ Server stopped. Thank you for using Beacon!")

if __name__ == '__main__':
    main()