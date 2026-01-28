import os
import signal
import socket
import subprocess
import sys
import time

from flask import Flask

# Kill any running Flask dev servers (on this user)
def kill_existing_flask_servers():
    try:
        # List all processes and look for flask run or python -m flask
        import psutil
        current_pid = os.getpid()
        for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
            try:
                if proc.info['pid'] == current_pid:
                    continue
                cmd = ' '.join(proc.info['cmdline']) if proc.info['cmdline'] else ''
                if (
                    'flask' in cmd and 'run' in cmd
                ) or (
                    'python' in cmd and '-m flask' in cmd
                ):
                    print(f"Killing Flask server: PID {proc.info['pid']} CMD: {cmd}")
                    proc.kill()
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
    except ImportError:
        print("psutil not installed. Skipping Flask server kill step.")

# Check if a port is available
def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) == 0

# Main logic
def main():
    kill_existing_flask_servers()
    # Serve static files from the web directory
    web_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../web'))
    app = Flask(__name__, static_folder=web_dir, static_url_path='')


    @app.route('/')
    def root():
        return app.send_static_file('index.html')

    # Serve index.html for directory requests (e.g., /command-center/)
    @app.route('/<path:subpath>/')
    def serve_directory_index(subpath):
        index_path = os.path.join(subpath, 'index.html')
        if os.path.exists(os.path.join(web_dir, index_path)):
            return app.send_static_file(index_path)
        else:
            return ("Not Found", 404)

    # Serve static files for direct requests
    @app.route('/<path:filename>')
    def static_files(filename):
        file_path = os.path.join(web_dir, filename)
        if os.path.isfile(file_path):
            return app.send_static_file(filename)
        else:
            return ("Not Found", 404)

    port = 8080
    if is_port_in_use(port):
        print(f"Port {port} in use, trying 8081...")
        port = 8081
    print(f"Serving from {web_dir}")
    print(f"Starting Flask server on port {port}")
    app.run(host='0.0.0.0', port=port)

if __name__ == "__main__":
    main()
