#!/usr/bin/env python3
"""
Beacon Web Server
Simple HTTP server for local development
No external dependencies required
"""

import http.server
import socketserver
import webbrowser
import os
import sys
from pathlib import Path

def start_server(port=8080, directory=None):
    """Start the web server"""
    
    # Default to docs directory
    if directory is None:
        script_dir = Path(__file__).parent.parent
        directory = script_dir / 'docs'
    
    if not directory.exists():
        print(f"Error: Directory {directory} does not exist")
        return False
    
    # Change to the directory
    os.chdir(directory)
    
    # Create server
    handler = http.server.SimpleHTTPRequestHandler
    
    try:
        with socketserver.TCPServer(("", port), handler) as httpd:
            print(f"Beacon web server starting...")
            print(f"Directory: {directory.absolute()}")
            print(f"URL: http://localhost:{port}")
            print(f"Press Ctrl+C to stop")
            
            # Open browser
            webbrowser.open(f'http://localhost:{port}')
            
            # Start server
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\nServer stopped")
        return True
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"Error: Port {port} is already in use")
            print("Try a different port with: python start-web-server.py --port 8081")
        else:
            print(f"Error starting server: {e}")
        return False

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Start Beacon web server')
    parser.add_argument('--port', '-p', type=int, default=8080, 
                       help='Port number (default: 8080)')
    parser.add_argument('--dir', '-d', type=Path, 
                       help='Directory to serve (default: ../docs)')
    
    args = parser.parse_args()
    
    start_server(args.port, args.dir)