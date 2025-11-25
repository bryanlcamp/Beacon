#!/usr/bin/env python3
"""
Start Beacon Configuration Server
Launches the synchronized configuration server for Beacon C++ applications
"""

import os
import sys
import subprocess
import time
from pathlib import Path

def check_dependencies():
    """Check if required Python packages are installed"""
    required_packages = ['flask', 'flask-cors', 'watchdog']
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
        except ImportError:
            missing_packages.append(package)
    
    return missing_packages

def install_dependencies(packages):
    """Install missing Python packages"""
    print("Installing required packages...")
    for package in packages:
        try:
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', package])
            print(f"✓ Installed {package}")
        except subprocess.CalledProcessError as e:
            print(f"✗ Failed to install {package}: {e}")
            return False
    return True

def main():
    """Main entry point"""
    print("Beacon Configuration Server Launcher")
    print("=" * 50)
    
    # Get script directory
    script_dir = Path(__file__).parent
    config_server_path = script_dir / "config_server.py"
    
    if not config_server_path.exists():
        print(f"Error: Configuration server not found at {config_server_path}")
        sys.exit(1)
    
    # Check dependencies
    print("Checking dependencies...")
    missing_packages = check_dependencies()
    
    if missing_packages:
        print(f"Missing packages: {', '.join(missing_packages)}")
        
        # Ask user if they want to install
        response = input("Install missing packages? (y/n): ").lower().strip()
        if response == 'y' or response == 'yes':
            if not install_dependencies(missing_packages):
                print("Failed to install required packages. Exiting.")
                sys.exit(1)
        else:
            print("Cannot start without required packages. Exiting.")
            sys.exit(1)
    else:
        print("✓ All dependencies available")
    
    print()
    print("Starting configuration server...")
    print("Server will be available at: http://localhost:5001")
    print("Synchronized playback config: http://localhost:5001/docs/core-apps/playback-config-sync.html")
    print()
    print("Press Ctrl+C to stop the server")
    print("-" * 50)
    
    try:
        # Launch the configuration server
        subprocess.run([sys.executable, str(config_server_path)])
    except KeyboardInterrupt:
        print("\nShutting down configuration server...")
    except Exception as e:
        print(f"Error starting server: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()