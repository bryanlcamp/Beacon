#!/usr/bin/env python3
"""
Beacon Market Data Generator - Session Starter
Usage: python3 beacon-start-session.py [config-file.json]
"""

import sys
import json
import subprocess
import time
import urllib.request
import signal
import psutil
from pathlib import Path

def cleanup_web_server():
    """Kill any lingering web server processes"""
    killed_any = False
    
    try:
        # Check if port 8080 is occupied
        for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
            try:
                # Check if process is using port 8080 or running our web server
                if proc.info['cmdline']:
                    cmdline = ' '.join(proc.info['cmdline'])
                    if ('beacon_web_server.py' in cmdline or 
                        'start_beacon_web.py' in cmdline or
                        ':8080' in cmdline):
                        print(f"🧹 Stopping lingering web server (PID: {proc.info['pid']})")
                        proc.kill()
                        killed_any = True
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
    except ImportError:
        # Fallback if psutil not available
        try:
            subprocess.run(['pkill', '-f', 'beacon_web_server.py'], 
                          capture_output=True, check=False)
            subprocess.run(['pkill', '-f', 'start_beacon_web.py'], 
                          capture_output=True, check=False)
        except:
            pass
    
    if killed_any:
        time.sleep(2)  # Wait for cleanup
        print("✅ Web server cleanup complete")
    
    return killed_any

def check_port_free():
    """Check if port 8080 is free"""
    try:
        urllib.request.urlopen('http://localhost:8080/api/status', timeout=2)
        return False  # Server responded, port not free
    except:
        return True  # No response, port is free

def main():
    print("🚀 Beacon Market Data Generator Session Starter")
    print("=" * 50)
    
    # Auto-cleanup any lingering web servers
    if not check_port_free():
        print("⚠️  Detected running web server on port 8080")
        cleanup_web_server()
        
        # Verify cleanup worked
        if not check_port_free():
            print("❌ Could not clean up port 8080 - another service may be using it")
            print("   Please manually stop any web servers or change ports")
            sys.exit(1)
        else:
            print("✅ Port 8080 is now free")
    
    # Get beacon root directory
    beacon_root = Path(__file__).parent
    print(f"📁 Beacon Root: {beacon_root}")
    
    # Handle config file argument
    if len(sys.argv) > 1:
        config_file = Path(sys.argv[1])
        if not config_file.exists():
            print(f"❌ Config file not found: {config_file}")
            sys.exit(1)
        print(f"📋 Using config: {config_file}")
    else:
        # Use default config or prompt user
        config_file = beacon_root / "config" / "system" / "startBeacon.json"
        if not config_file.exists():
            print("❌ No config specified and default not found")
            print("Usage: python3 beacon-start-session.py [config-file.json]")
            sys.exit(1)
        print(f"📋 Using default config: {config_file}")
    
    # Check if beacon-run.py exists
    beacon_runner = beacon_root / "beacon-run.py"
    if not beacon_runner.exists():
        print(f"❌ Beacon runner not found: {beacon_runner}")
        sys.exit(1)
    
    print("🔧 Starting Beacon trading pipeline...")
    print("📋 Sequence: Matching Engine → Playback → Client Algo → Generator")
    
    try:
        # Use the existing beacon-run.py which handles proper sequencing
        result = subprocess.run([
            sys.executable, 
            str(beacon_runner), 
            "-i", str(config_file)
        ], cwd=str(beacon_root))
        
        if result.returncode == 0:
            print("✅ Beacon trading session completed successfully")
            print("📁 Check outputs/ directory for generated market data")
        else:
            print(f"❌ Beacon session failed with exit code: {result.returncode}")
            print("💡 Check component logs for details")
            sys.exit(result.returncode)
            
    except KeyboardInterrupt:
        print("\n🛑 Trading session interrupted by user")
        print("🧹 Components may need manual cleanup")
    except Exception as e:
        print(f"❌ Error running Beacon trading session: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()