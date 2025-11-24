#!/usr/bin/env python3
"""
Beacon Market Data Generator UI Launcher
Auto-starts the web server and opens browser
"""

import sys
import subprocess
import webbrowser
import time
import os
from pathlib import Path

def main():
    print("🚀 Starting Beacon Market Data Generator UI...")
    
    # Get the script directory (beacon root)
    beacon_root = Path(__file__).parent
    web_launcher = beacon_root / "web" / "start_beacon_web.py"
    
    if not web_launcher.exists():
        print(f"❌ Web launcher not found: {web_launcher}")
        print("   Make sure you're running this from the Beacon root directory")
        sys.exit(1)
    
    print(f"📁 Beacon Root: {beacon_root}")
    print(f"🌐 Starting web server...")
    
    try:
        # Start the web server in the background
        server_process = subprocess.Popen(
            [sys.executable, str(web_launcher)],
            cwd=str(beacon_root),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        print("⏳ Waiting for web server to start...")
        time.sleep(4)  # Give server time to start
        
        # Check if server is running
        if server_process.poll() is None:
            print("✅ Web server started successfully!")
            print("🌐 Opening browser at http://localhost:8080")
            
            # Open browser
            webbrowser.open('http://localhost:8080')
            
            print("\n" + "="*60)
            print("🎯 BEACON MARKET DATA GENERATOR UI READY")
            print("="*60)
            print("📱 Browser: http://localhost:8080")
            print("🛑 Press Ctrl+C to stop the server")
            print("💡 Keep this terminal open while using the UI")
            print("="*60)
            
            # Wait for user to stop
            try:
                server_process.wait()
            except KeyboardInterrupt:
                print("\n🛑 Shutting down web server...")
                server_process.terminate()
                try:
                    server_process.wait(timeout=5)
                    print("✅ Server stopped gracefully")
                except subprocess.TimeoutExpired:
                    print("⚠️  Force stopping server...")
                    server_process.kill()
                    
        else:
            print("❌ Web server failed to start")
            stdout, stderr = server_process.communicate()
            if stderr:
                print(f"Error: {stderr.decode()}")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Error starting web server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()