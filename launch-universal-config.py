#!/usr/bin/env python3
"""
Launch Beacon Universal Configuration System
Automatically installs dependencies and starts the configuration server
"""

import os
import sys
import subprocess
import time
from pathlib import Path

def check_python_version():
    """Check if Python version is sufficient"""
    if sys.version_info < (3, 7):
        print("Error: Python 3.7 or higher is required")
        sys.exit(1)

def install_package(package_name, import_name=None):
    """Install a single package if not already available"""
    if import_name is None:
        import_name = package_name.replace('-', '_')
    
    try:
        __import__(import_name)
        return True
    except ImportError:
        print(f"Installing {package_name}...")
        try:
            subprocess.check_call([
                sys.executable, '-m', 'pip', 'install', package_name
            ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            print(f"✓ Installed {package_name}")
            return True
        except subprocess.CalledProcessError:
            print(f"✗ Failed to install {package_name}")
            return False

def setup_dependencies():
    """Install required dependencies"""
    print("Setting up dependencies...")
    
    required_packages = [
        ('flask', 'flask'),
        ('flask-cors', 'flask_cors'),
        ('watchdog', 'watchdog'),
        ('jinja2', 'jinja2')
    ]
    
    all_installed = True
    for package_name, import_name in required_packages:
        if not install_package(package_name, import_name):
            all_installed = False
    
    return all_installed

def main():
    """Main entry point"""
    print("Beacon Universal Configuration System")
    print("=" * 50)
    
    # Check Python version
    check_python_version()
    
    # Get paths
    script_dir = Path(__file__).parent
    server_script = script_dir / "scripts" / "universal_config_server.py"
    
    if not server_script.exists():
        print(f"Error: Server script not found at {server_script}")
        sys.exit(1)
    
    # Setup dependencies
    if not setup_dependencies():
        print("Failed to install required dependencies")
        sys.exit(1)
    
    print("\n" + "=" * 50)
    print("Starting Beacon Universal Configuration Server...")
    print("Dashboard: http://localhost:5001")
    print("Universal Config: http://localhost:5001/universal-config.html")
    print("API Documentation: http://localhost:5001/api")
    print()
    print("Features:")
    print("• Auto-discovery of all JSON configuration files")
    print("• Real-time synchronization with C++ applications")
    print("• Component-aware configuration management")
    print("• JSON validation and formatting")
    print("• File change monitoring and notifications")
    print()
    print("Press Ctrl+C to stop the server")
    print("=" * 50)
    
    try:
        # Start the server
        subprocess.run([sys.executable, str(server_script)])
    except KeyboardInterrupt:
        print("\nShutting down configuration server...")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()