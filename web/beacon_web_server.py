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

# Ensure directories exist
CONFIG_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

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
            # Path to the generator executable
            generator_exe = BUILD_DIR / "bin" / "generator"
            if not generator_exe.exists():
                return {"error": f"Generator executable not found at {generator_exe}"}
            
            config_path = CONFIG_DIR / f"{config_name}.json"
            if not config_path.exists():
                return {"error": f"Configuration file not found: {config_name}"}
            
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
    """Serve the main configuration page"""
    return send_from_directory('.', 'market-data-config.html')

@app.route('/api/configs')
def get_configs():
    """Get list of configuration files"""
    return jsonify(beacon_server.get_config_files())

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
    """Serve static files from web directory"""
    return send_from_directory('.', filename)

def main():
    """Main entry point"""
    print("=" * 60)
    print("🚀 Beacon Market Data Configuration Server")
    print("=" * 60)
    print(f"📁 Beacon Root: {BEACON_ROOT}")
    print(f"📁 Config Directory: {CONFIG_DIR}")
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