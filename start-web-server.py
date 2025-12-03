#!/usr/bin/env python3
"""
Beacon Web Server - Professional and Robust
Handles port conflicts automatically and gracefully
"""

import http.server
import socketserver
import socket
import subprocess
import sys
import os
import signal
import time
from pathlib import Path

class RobustHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP handler that prevents caching issues and handles connection errors gracefully"""
    
    def end_headers(self):
        # Add cache-busting headers to prevent Safari caching issues
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()
    
    def log_error(self, format, *args):
        # Suppress common connection errors that are just network noise
        if args and isinstance(args[0], str):
            error_msg = str(args[0])
            suppress_errors = [
                'Connection reset by peer',
                'Broken pipe',
                'An existing connection was forcibly closed',
                '[Errno 54]',
                '[Errno 32]'
            ]
            
            if any(error in error_msg for error in suppress_errors):
                return  # Don't log these common connection errors
        
        super().log_error(format, *args)
    
    def handle_one_request(self):
        """Handle a single HTTP request with connection error handling"""
        try:
            super().handle_one_request()
        except (ConnectionResetError, BrokenPipeError, OSError):
            # These are common client-side disconnections, not server errors
            pass

def is_port_available(port):
    """Check if a port is available"""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            s.bind(('localhost', port))
            return True
    except OSError:
        return False

def kill_process_on_port(port):
    """Kill any process using the specified port - robust version"""
    killed = False
    
    try:
        if sys.platform == "darwin":  # macOS
            # Find processes using the port
            result = subprocess.run(['lsof', '-ti', f':{port}'], 
                                  capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0 and result.stdout.strip():
                pids = result.stdout.strip().split('\n')
                print(f"🔨 Found {len(pids)} process(es) using port {port}")
                
                for pid in pids:
                    try:
                        pid = int(pid.strip())
                        print(f"   Terminating process {pid}...")
                        
                        # Try SIGTERM first
                        os.kill(pid, signal.SIGTERM)
                        time.sleep(1)
                        
                        # Check if still running, use SIGKILL if needed
                        try:
                            os.kill(pid, 0)  # Check if process exists
                            print(f"   Process {pid} still running, using SIGKILL...")
                            os.kill(pid, signal.SIGKILL)
                            time.sleep(1)
                        except OSError:
                            pass  # Process is gone
                        
                        killed = True
                        print(f"   ✅ Process {pid} terminated")
                        
                    except (ValueError, OSError, ProcessLookupError) as e:
                        print(f"   ⚠️  Could not kill process {pid}: {e}")
                        continue
                        
        elif sys.platform == "linux":
            # Linux version
            result = subprocess.run(['fuser', '-k', f'{port}/tcp'], 
                                  capture_output=True, timeout=10)
            killed = (result.returncode == 0)
            
    except (subprocess.SubprocessError, FileNotFoundError, subprocess.TimeoutExpired) as e:
        print(f"⚠️  Error managing processes on port {port}: {e}")
    
    # Wait for processes to actually die
    if killed:
        print(f"   Waiting for port {port} to be freed...")
        time.sleep(2)
    
    return killed

def find_available_port(start_port=8080, max_attempts=20):
    """Find an available port starting from start_port"""
    for port in range(start_port, start_port + max_attempts):
        if is_port_available(port):
            return port
    return None

def start_server(port=8080, force_kill=True):
    """Start the web server from ROOT directory - supports web/ subdirectory structure"""
    
    # Serve from ROOT directory where index.html is
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    print(f"🚀 BEACON WEB SERVER - ROOT WITH WEB SUBDIRECTORY")
    print(f"Root Directory: {os.getcwd()}")
    print(f"Target Port: {port}")
    
    # Handle port conflicts aggressively
    available_port = None
    
    if not is_port_available(port):
        print(f"⚠️  Port {port} is in use")
        
        if force_kill:
            print(f"🔨 Attempting to free port {port}...")
            if kill_process_on_port(port):
                # Wait and verify port is now free
                for i in range(10):  # Try for 10 seconds
                    if is_port_available(port):
                        print(f"✅ Port {port} is now available")
                        available_port = port
                        break
                    print(f"   Waiting for port {port} to be free... ({i+1}/10)")
                    time.sleep(1)
        
        # If port is still not available, find alternative
        if available_port is None:
            print(f"🔍 Finding alternative port...")
            available_port = find_available_port(port + 1)
            
            if available_port:
                print(f"📍 Using alternative port: {available_port}")
            else:
                print("❌ No available ports found!")
                return False
    else:
        available_port = port
        print(f"✅ Port {port} is available")

    try:
        print(f"\n🌐 BEACON URLS:")
        print(f"🏠 Landing Page: http://localhost:{available_port}/")
        print(f"🎯 Command Center: http://localhost:{available_port}/web/command-center/")
        print(f"🚀 Dataset Generator: http://localhost:{available_port}/web/apps/dataset-generator/")
        print(f"\n💡 GitHub Pages: Same URLs work at bryanlcamp.github.io/Beacon/")
        
        with socketserver.TCPServer(("localhost", available_port), RobustHTTPRequestHandler) as httpd:
            # Set socket options for better connection handling
            httpd.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print(f"\n🛑 BEACON SERVER STOPPED")
        print(f"   Server gracefully shut down")
        return True
    except OSError as e:
        print(f"❌ Failed to start server: {e}")
        
        # Try one more time with a different port
        if "Address already in use" in str(e):
            print("🔍 Trying alternative port...")
            alt_port = find_available_port(available_port + 1)
            if alt_port:
                print(f"📍 Retrying with port {alt_port}")
                return start_server(alt_port, False)  # Don't force kill on retry
        
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Start Beacon professional web server")
    parser.add_argument('--port', '-p', type=int, default=8080, 
                       help='Preferred port (default: 8080)')
    parser.add_argument('--no-kill', action='store_true',
                       help='Don\'t kill existing processes on port')
    
    args = parser.parse_args()
    
    print("=" * 70)
    print("🌟 BEACON WEB SERVER LAUNCHER")
    print(f"Target Port: {args.port}")
    print(f"Force Kill: {'OFF' if args.no_kill else 'ON'}")
    print("=" * 70)
    
    success = start_server(port=args.port, force_kill=not args.no_kill)
    sys.exit(0 if success else 1)
