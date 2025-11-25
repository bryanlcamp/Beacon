#!/usr/bin/env python3
"""
Beacon Configuration Server
Provides synchronized access to JSON configuration files for both C++ apps and web interface
"""

import json
import os
import sys
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import threading
import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

app = Flask(__name__)
CORS(app)

# Configuration file paths
CONFIG_DIR = Path(__file__).parent.parent / "src" / "apps" / "common" / "configuration"
PLAYBACK_CONFIG = CONFIG_DIR / "Playbook.json"
WEB_DIR = Path(__file__).parent.parent / "docs"

class ConfigFileHandler(FileSystemEventHandler):
    """Handles file system events for configuration files"""
    
    def __init__(self, config_server):
        self.config_server = config_server
        
    def on_modified(self, event):
        if not event.is_directory and event.src_path.endswith('.json'):
            # Notify all connected clients of file changes
            print(f"Configuration file changed: {event.src_path}")
            self.config_server.broadcast_config_change(event.src_path)

class ConfigServer:
    def __init__(self):
        self.connected_clients = set()
        self.file_observer = None
        self.setup_file_watcher()
        
    def setup_file_watcher(self):
        """Setup file system watcher for configuration directory"""
        if CONFIG_DIR.exists():
            self.file_observer = Observer()
            event_handler = ConfigFileHandler(self)
            self.file_observer.schedule(event_handler, str(CONFIG_DIR), recursive=True)
            self.file_observer.start()
            print(f"Watching configuration directory: {CONFIG_DIR}")
    
    def broadcast_config_change(self, file_path):
        """Notify all clients about configuration changes"""
        # In a real implementation, this would use WebSockets
        # For now, we'll use polling from the frontend
        pass
    
    def read_config_file(self, config_name):
        """Read and return configuration file content"""
        config_path = CONFIG_DIR / f"{config_name}.json"
        if config_path.exists():
            try:
                with open(config_path, 'r') as f:
                    return json.load(f)
            except json.JSONDecodeError as e:
                return {"error": f"Invalid JSON in {config_name}.json: {str(e)}"}
            except Exception as e:
                return {"error": f"Failed to read {config_name}.json: {str(e)}"}
        else:
            return {"error": f"Configuration file {config_name}.json not found"}
    
    def write_config_file(self, config_name, config_data):
        """Write configuration data to file"""
        config_path = CONFIG_DIR / f"{config_name}.json"
        try:
            # Ensure directory exists
            config_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Write with proper formatting
            with open(config_path, 'w') as f:
                json.dump(config_data, f, indent=2)
            
            print(f"Configuration saved: {config_path}")
            return {"success": True, "message": f"Configuration saved to {config_name}.json"}
        except Exception as e:
            error_msg = f"Failed to save {config_name}.json: {str(e)}"
            print(error_msg)
            return {"error": error_msg}

# Global config server instance
config_server = ConfigServer()

@app.route('/')
def index():
    """Serve the main documentation hub"""
    return send_from_directory(WEB_DIR, 'index.html')

@app.route('/docs/<path:filename>')
def serve_docs(filename):
    """Serve documentation files"""
    return send_from_directory(WEB_DIR, filename)

@app.route('/api/config/<config_name>', methods=['GET'])
def get_config(config_name):
    """Get configuration file content"""
    config_data = config_server.read_config_file(config_name)
    return jsonify(config_data)

@app.route('/api/config/<config_name>', methods=['POST'])
def save_config(config_name):
    """Save configuration file content"""
    try:
        config_data = request.get_json()
        if not config_data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        result = config_server.write_config_file(config_name, config_data)
        
        if "error" in result:
            return jsonify(result), 500
        else:
            return jsonify(result)
            
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/api/config/<config_name>/timestamp', methods=['GET'])
def get_config_timestamp(config_name):
    """Get configuration file modification timestamp"""
    config_path = CONFIG_DIR / f"{config_name}.json"
    if config_path.exists():
        timestamp = config_path.stat().st_mtime
        return jsonify({"timestamp": timestamp})
    else:
        return jsonify({"error": "File not found"}), 404

@app.route('/api/configs', methods=['GET'])
def list_configs():
    """List all available configuration files"""
    if CONFIG_DIR.exists():
        config_files = [f.stem for f in CONFIG_DIR.glob('*.json')]
        return jsonify({"configs": config_files})
    else:
        return jsonify({"configs": []})

def main():
    """Main entry point"""
    print("Beacon Configuration Server")
    print("=" * 40)
    print(f"Configuration Directory: {CONFIG_DIR}")
    print(f"Web Directory: {WEB_DIR}")
    print()
    
    # Check if configuration directory exists
    if not CONFIG_DIR.exists():
        print(f"Warning: Configuration directory does not exist: {CONFIG_DIR}")
        print("Creating directory...")
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    
    # List available configurations
    config_files = list(CONFIG_DIR.glob('*.json'))
    if config_files:
        print("Available configurations:")
        for config_file in config_files:
            print(f"  - {config_file.name}")
    else:
        print("No configuration files found.")
    
    print()
    print("Starting server on http://localhost:5001")
    print("Press Ctrl+C to stop")
    
    try:
        app.run(host='127.0.0.1', port=5001, debug=True)
    except KeyboardInterrupt:
        print("\nShutting down...")
        if config_server.file_observer:
            config_server.file_observer.stop()
            config_server.file_observer.join()
    except Exception as e:
        print(f"Server error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()