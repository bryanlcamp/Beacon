#!/usr/bin/env python3
"""
Beacon Universal Configuration Server
Manages all Beacon component configurations with auto-discovery and real-time synchronization
"""

import json
import os
import sys
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory, render_template_string
from flask_cors import CORS
import threading
import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

app = Flask(__name__)
CORS(app)

# Configuration paths
CONFIG_DIR = Path(__file__).parent.parent / "src" / "apps" / "common" / "configuration"
WEB_DIR = Path(__file__).parent.parent / "docs"

class BeaconComponentRegistry:
    """Registry of all Beacon components and their metadata"""
    
    COMPONENTS = {
        "generator": {
            "name": "Market Data Generator",
            "description": "Multi-protocol market data generation",
            "config_file": "Generator.json",
            "icon": "📊",
            "category": "Data Generation",
            "dependencies": [],
            "startup_order": 4
        },
        "playbook": {
            "name": "Playback Engine", 
            "description": "Market data playback with UDP transmission",
            "config_file": "Playbook.json",
            "icon": "▶️",
            "category": "Data Transmission",
            "dependencies": ["generator"],
            "startup_order": 2
        },
        "matching_engine": {
            "name": "Matching Engine",
            "description": "Electronic order matching and execution",
            "config_file": "MatchingEngine.json", 
            "icon": "⚡",
            "category": "Execution",
            "dependencies": [],
            "startup_order": 1
        },
        "client_algorithm": {
            "name": "Client Algorithm",
            "description": "HFT algorithm with market data reception",
            "config_file": "ClientAlgorithm.json",
            "icon": "🤖",
            "category": "Trading",
            "dependencies": ["playbook", "matching_engine"],
            "startup_order": 3
        },
        "market_data_receiver": {
            "name": "Market Data Receiver",
            "description": "Protocol-agnostic market data reception",
            "config_file": "MarketDataReceiver.json",
            "icon": "📡",
            "category": "Data Reception", 
            "dependencies": ["playbook"],
            "startup_order": 3
        }
    }
    
    @classmethod
    def get_component(cls, component_id):
        return cls.COMPONENTS.get(component_id)
    
    @classmethod
    def list_components(cls):
        return cls.COMPONENTS
    
    @classmethod
    def get_startup_order(cls):
        """Get components sorted by startup order"""
        return sorted(cls.COMPONENTS.items(), key=lambda x: x[1]['startup_order'])

class ConfigFileHandler(FileSystemEventHandler):
    """Handles file system events for configuration files"""
    
    def __init__(self, config_server):
        self.config_server = config_server
        
    def on_modified(self, event):
        if not event.is_directory and event.src_path.endswith('.json'):
            print(f"Configuration file changed: {event.src_path}")
            self.config_server.broadcast_config_change(event.src_path)

class UniversalConfigServer:
    def __init__(self):
        self.connected_clients = set()
        self.file_observer = None
        self.component_registry = BeaconComponentRegistry()
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
        print(f"Broadcasting change: {file_path}")
    
    def discover_config_files(self):
        """Auto-discover all configuration files"""
        if not CONFIG_DIR.exists():
            return {}
        
        discovered = {}
        for json_file in CONFIG_DIR.glob('*.json'):
            config_name = json_file.stem
            try:
                with open(json_file, 'r') as f:
                    config_data = json.load(f)
                    
                discovered[config_name] = {
                    "file_path": str(json_file),
                    "file_name": json_file.name,
                    "has_application_info": "application" in config_data,
                    "application_name": config_data.get("application", {}).get("name", config_name),
                    "description": config_data.get("application", {}).get("description", ""),
                    "size": json_file.stat().st_size,
                    "modified": json_file.stat().st_mtime
                }
            except Exception as e:
                discovered[config_name] = {
                    "file_path": str(json_file),
                    "file_name": json_file.name,
                    "error": str(e),
                    "size": json_file.stat().st_size,
                    "modified": json_file.stat().st_mtime
                }
        
        return discovered
    
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
            config_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(config_path, 'w') as f:
                json.dump(config_data, f, indent=2)
            
            print(f"Configuration saved: {config_path}")
            return {"success": True, "message": f"Configuration saved to {config_name}.json"}
        except Exception as e:
            error_msg = f"Failed to save {config_name}.json: {str(e)}"
            print(error_msg)
            return {"error": error_msg}
    
    def generate_json_schema(self, config_data, path=""):
        """Generate a simple schema from existing JSON data"""
        if isinstance(config_data, dict):
            schema = {"type": "object", "properties": {}}
            for key, value in config_data.items():
                schema["properties"][key] = self.generate_json_schema(value, f"{path}.{key}")
            return schema
        elif isinstance(config_data, list):
            if config_data:
                return {"type": "array", "items": self.generate_json_schema(config_data[0], path)}
            else:
                return {"type": "array", "items": {"type": "string"}}
        elif isinstance(config_data, bool):
            return {"type": "boolean"}
        elif isinstance(config_data, int):
            return {"type": "integer"}
        elif isinstance(config_data, float):
            return {"type": "number"}
        else:
            return {"type": "string"}

# Global server instance
config_server = UniversalConfigServer()

@app.route('/')
def index():
    """Serve the universal configuration dashboard"""
    return serve_dashboard()

@app.route('/dashboard')
def serve_dashboard():
    """Serve the main configuration dashboard"""
    components = BeaconComponentRegistry.list_components()
    discovered_configs = config_server.discover_config_files()
    
    dashboard_html = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Beacon Universal Configuration</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            background: linear-gradient(135deg, #0a0a15 0%, #0d1020 25%, #060d28 50%, #0d1020 75%, #0a0a15 100%);
            color: #ffffff;
            line-height: 1.6;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        
        h1 {
            font-size: 3rem;
            font-weight: 800;
            margin-bottom: 10px;
            text-align: center;
            background: linear-gradient(135deg, #ffffff 0%, #a0a0ff 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .subtitle {
            text-align: center;
            font-size: 1.2rem;
            opacity: 0.8;
            margin-bottom: 50px;
            font-weight: 600;
        }
        
        .components-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 25px;
            margin-bottom: 50px;
        }
        
        .component-card {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            padding: 25px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .component-card:hover {
            transform: translateY(-4px);
            border-color: rgba(255, 255, 255, 0.3);
            background: rgba(255, 255, 255, 0.08);
        }
        
        .component-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 15px;
        }
        
        .component-icon {
            font-size: 2rem;
        }
        
        .component-title {
            font-size: 1.3rem;
            font-weight: 700;
            color: #ffffff;
        }
        
        .component-category {
            font-size: 0.8rem;
            opacity: 0.7;
            font-weight: 500;
        }
        
        .component-description {
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 20px;
            font-size: 0.95rem;
        }
        
        .component-status {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 15px;
        }
        
        .status-indicator {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.85rem;
        }
        
        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
        }
        
        .status-available { background: #00ff64; }
        .status-missing { background: #ff6464; }
        
        .config-actions {
            display: flex;
            gap: 10px;
        }
        
        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        
        .btn-primary {
            background: rgba(255, 255, 255, 0.15);
            color: #ffffff;
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .btn-primary:hover {
            background: rgba(255, 255, 255, 0.25);
        }
        
        .discovered-configs {
            margin-top: 40px;
        }
        
        .section-title {
            font-size: 1.8rem;
            font-weight: 700;
            margin-bottom: 25px;
            color: #ffffff;
        }
        
        .config-list {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .config-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .config-item:last-child {
            border-bottom: none;
        }
        
        .config-info {
            flex: 1;
        }
        
        .config-name {
            font-weight: 600;
            color: #ffffff;
        }
        
        .config-desc {
            font-size: 0.85rem;
            opacity: 0.7;
            margin-top: 2px;
        }
    </style>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
</head>
<body>
    <div class="container">
        <h1>Beacon Configuration</h1>
        <p class="subtitle">Universal configuration management for all Beacon components</p>
        
        <div class="components-grid">
            {% for component_id, component in components.items() %}
            <div class="component-card" onclick="openConfig('{{ component_id }}')">
                <div class="component-header">
                    <span class="component-icon">{{ component.icon }}</span>
                    <div>
                        <div class="component-title">{{ component.name }}</div>
                        <div class="component-category">{{ component.category }}</div>
                    </div>
                </div>
                <div class="component-description">{{ component.description }}</div>
                <div class="component-status">
                    <div class="status-indicator">
                        {% set config_key = component.config_file.replace('.json', '') %}
                        {% if config_key in discovered_configs %}
                            <div class="status-dot status-available"></div>
                            <span>Configuration Available</span>
                        {% else %}
                            <div class="status-dot status-missing"></div>
                            <span>No Configuration</span>
                        {% endif %}
                    </div>
                    <div class="config-actions">
                        <button class="btn btn-primary" onclick="event.stopPropagation(); openConfig('{{ component_id }}')">
                            Configure
                        </button>
                    </div>
                </div>
            </div>
            {% endfor %}
        </div>
        
        <div class="discovered-configs">
            <h2 class="section-title">All Configuration Files</h2>
            <div class="config-list">
                {% for config_name, config_info in discovered_configs.items() %}
                <div class="config-item">
                    <div class="config-info">
                        <div class="config-name">{{ config_name }}.json</div>
                        <div class="config-desc">
                            {% if config_info.get('application_name') %}
                                {{ config_info.application_name }}
                                {% if config_info.get('description') %} - {{ config_info.description }}{% endif %}
                            {% else %}
                                {{ config_info.file_name }}
                            {% endif %}
                        </div>
                    </div>
                    <div class="config-actions">
                        <button class="btn btn-primary" onclick="openConfigDirect('{{ config_name }}')">
                            Edit
                        </button>
                    </div>
                </div>
                {% endfor %}
            </div>
        </div>
    </div>
    
    <script>
        function openConfig(componentId) {
            window.open(`/config/${componentId}`, '_blank');
        }
        
        function openConfigDirect(configName) {
            window.open(`/config-direct/${configName}`, '_blank');
        }
    </script>
</body>
</html>
    """
    
    from jinja2 import Template
    template = Template(dashboard_html)
    return template.render(components=components, discovered_configs=discovered_configs)

@app.route('/config/<component_id>')
def serve_component_config(component_id):
    """Serve component-specific configuration interface"""
    component = BeaconComponentRegistry.get_component(component_id)
    if not component:
        return "Component not found", 404
    
    config_name = component['config_file'].replace('.json', '')
    return generate_config_interface(config_name, component)

@app.route('/config-direct/<config_name>')  
def serve_direct_config(config_name):
    """Serve direct configuration interface for any config file"""
    return generate_config_interface(config_name)

def generate_config_interface(config_name, component_info=None):
    """Generate a dynamic configuration interface"""
    # This would be a complex template that generates forms based on JSON schema
    # For now, redirect to a simpler approach
    return f"""
<!DOCTYPE html>
<html>
<head>
    <title>Configure {config_name}</title>
    <script>
        window.location.href = '/universal-config.html?config={config_name}';
    </script>
</head>
<body>
    <p>Redirecting to universal configuration interface...</p>
</body>
</html>
    """

@app.route('/docs/<path:filename>')
def serve_docs(filename):
    """Serve documentation files"""
    return send_from_directory(WEB_DIR, filename)

@app.route('/api/components')
def api_components():
    """Get all registered components"""
    return jsonify(BeaconComponentRegistry.list_components())

@app.route('/api/discover')
def api_discover():
    """Discover all configuration files"""
    return jsonify(config_server.discover_config_files())

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

@app.route('/api/config/<config_name>/schema', methods=['GET'])
def get_config_schema(config_name):
    """Generate schema for configuration file"""
    config_data = config_server.read_config_file(config_name)
    if "error" not in config_data:
        schema = config_server.generate_json_schema(config_data)
        return jsonify(schema)
    else:
        return jsonify(config_data), 404

def main():
    """Main entry point"""
    print("Beacon Universal Configuration Server")
    print("=" * 50)
    print(f"Configuration Directory: {CONFIG_DIR}")
    print(f"Web Directory: {WEB_DIR}")
    print()
    
    # Check configuration directory
    if not CONFIG_DIR.exists():
        print(f"Warning: Configuration directory does not exist: {CONFIG_DIR}")
        print("Creating directory...")
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    
    # Discover configurations
    discovered = config_server.discover_config_files()
    print(f"Discovered {len(discovered)} configuration files:")
    for name, info in discovered.items():
        print(f"  ✓ {name}.json - {info.get('application_name', 'Unknown')}")
    
    print()
    print("Starting universal configuration server...")
    print("Dashboard: http://localhost:5001")
    print("API: http://localhost:5001/api")
    print("Press Ctrl+C to stop")
    
    try:
        app.run(host='127.0.0.1', port=5001, debug=True)
    except KeyboardInterrupt:
        print("\nShutting down...")
        if config_server.file_observer:
            config_server.file_observer.stop()
            config_server.file_observer.join()

if __name__ == '__main__':
    main()