#!/usr/bin/env python3
"""
Beacon Web Server Launcher
Simple startup script for independent traders
"""

import sys
import subprocess
import os
from pathlib import Path

def check_python_version():
    """Ensure Python 3.7+ is available"""
    if sys.version_info < (3, 7):
        print("❌ Python 3.7 or higher is required")
        print(f"   Current version: {sys.version}")
        return False
    return True

def install_requirements():
    """Install required Python packages"""
    requirements = ["flask"]
    
    print("📦 Installing Python dependencies...")
    for package in requirements:
        try:
            __import__(package)
            print(f"   ✅ {package} already installed")
        except ImportError:
            print(f"   📥 Installing {package}...")
            result = subprocess.run([
                sys.executable, "-m", "pip", "install", package
            ], capture_output=True, text=True)
            
            if result.returncode == 0:
                print(f"   ✅ {package} installed successfully")
            else:
                print(f"   ❌ Failed to install {package}")
                print(f"   Error: {result.stderr}")
                return False
    return True

def check_beacon_build():
    """Check if Beacon generator is built"""
    beacon_root = Path(__file__).parent.parent  # Go up from web/ to beacon/
    generator_exe = beacon_root / "build" / "bin" / "generator"
    
    if generator_exe.exists():
        print(f"✅ Beacon generator found: {generator_exe}")
        return True
    else:
        print(f"⚠️  Beacon generator not found: {generator_exe}")
        print("   You may need to build Beacon first with:")
        print("   cmake --build build --target generator")
        return False

def main():
    """Main launcher"""
    print("🚀 Beacon Market Data Configuration Launcher")
    print("=" * 50)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}")
    
    # Install requirements
    if not install_requirements():
        print("❌ Failed to install dependencies")
        sys.exit(1)
    
    # Check Beacon build
    beacon_built = check_beacon_build()
    
    print("=" * 50)
    print("🌐 Starting Beacon Web Server...")
    
    if not beacon_built:
        print("⚠️  Warning: Generator not found, but web server will still start")
        print("   You can build the generator later with: cmake --build build --target generator")
    
    # Start the web server
    web_dir = Path(__file__).parent
    server_script = web_dir / "beacon_web_server.py"
    
    try:
        subprocess.run([sys.executable, str(server_script)])
    except KeyboardInterrupt:
        print("\n🛑 Launcher stopped")
    except Exception as e:
        print(f"❌ Error starting web server: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()