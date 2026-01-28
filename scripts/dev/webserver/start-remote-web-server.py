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
    app = Flask(__name__)

    @app.route('/')
    def hello():
        return 'Flask server is running!'

    port = 8080
    if is_port_in_use(port):
        print(f"Port {port} in use, trying 8081...")
        port = 8081
    print(f"Starting Flask server on port {port}")
    app.run(host='0.0.0.0', port=port)

if __name__ == "__main__":
    main()
