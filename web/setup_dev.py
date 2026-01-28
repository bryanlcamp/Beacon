#!/usr/bin/env python3
# ---------------------------------------------------------------------------
# @file      setup_dev.py
# @project   Beacon
# @component Dev Environment
# @brief     Sets up and starts the local Flask dev environment with venv
# @author    Bryan Camp
# ---------------------------------------------------------------------------

import os
import sys
import subprocess
import time
import socket
from pathlib import Path

# ------------------ Paths ------------------
SCRIPT_DIR = Path(__file__).parent
REPO_DIR = SCRIPT_DIR.parent.parent.parent
WEB_DIR = REPO_DIR / "web"
VENV_DIR = SCRIPT_DIR / ".venv"  # local venv for dev scripts
FLASK_APP = WEB_DIR / "app.py"
PRIMARY_PORT = 8080
SECONDARY_PORT = 8081
FLASK_HOST = "127.0.0.1"
# ------------------------------------------

GREEN = "\033[0;32m"
RED = "\033[0;31m"
YELLOW = "\033[0;33m"
NC = "\033[0m"

def create_venv():
    if not VENV_DIR.exists():
        print(f"{YELLOW}Creating virtual environment...{NC}")
        subprocess.run([sys.executable, "-m", "venv", str(VENV_DIR)], check=True)
        print(f"{GREEN}Virtual environment created at {VENV_DIR}{NC}")
    else:
        print(f"{GREEN}Using existing virtual environment at {VENV_DIR}{NC}")

def install_packages():
    pip = VENV_DIR / "bin" / "pip"
    subprocess.run([str(pip), "install", "--upgrade", "pip"], check=True)
    subprocess.run([str(pip), "install", "Flask"], check=True)

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex((FLASK_HOST, port)) == 0

def kill_stale_flask(port):
    try:
        result = subprocess.run(
            ["lsof", "-iTCP:{}-sTCP:LISTEN".format(port), "-t"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        pids = result.stdout.strip().splitlines()
        for pid in pids:
            print(f"{YELLOW}Killing stale Flask process PID {pid}{NC}")
            subprocess.run(["kill", "-9", pid])
        time.sleep(0.5)
    except Exception as e:
        print(f"{RED}Error checking/killing stale Flask: {e}{NC}")

def start_flask():
    python_exec = VENV_DIR / "bin" / "python"
    port = PRIMARY_PORT
    if is_port_in_use(port):
        print(f"{YELLOW}Port {port} in use, trying {SECONDARY_PORT}...{NC}")
        port = SECONDARY_PORT
        if is_port_in_use(port):
            print(f"{RED}Both ports {PRIMARY_PORT} and {SECONDARY_PORT} are in use. Exiting.{NC}")
            sys.exit(1)

    print(f"{GREEN}Starting Flask on port {port}...{NC}")
    env = os.environ.copy()
    env["FLASK_APP"] = str(FLASK_APP)
    env["FLASK_ENV"] = "development"
    process = subprocess.Popen(
        [str(python_exec), "-m", "flask", "run", "--host", FLASK_HOST, "--port", str(port)],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=env,
    )
    time.sleep(1)
    if not is_port_in_use(port):
        print(f"{RED}Flask failed to start on port {port}{NC}")
        sys.exit(1)

    print(f"{GREEN}Flask running successfully on port {port} (PID: {process.pid}){NC}")
    return process, port

def main():
    print(f"{GREEN}=== Starting Beacon Dev Environment ==={NC}")
    create_venv()
    install_packages()
    kill_stale_flask(PRIMARY_PORT)
    flask_proc, port = start_flask()
    print(f"{GREEN}=== All systems nominal ✅ ==={NC}")
    print(f"{GREEN}Landing page: http://{FLASK_HOST}:{port}/{NC}")
    print(f"{GREEN}Command Center: http://{FLASK_HOST}:{port}/command-center/{NC}")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print(f"{YELLOW}\nStopping Flask...{NC}")
        flask_proc.terminate()
        flask_proc.wait()
        print(f"{GREEN}Flask stopped. Dev environment shutdown complete.{NC}")

if __name__ == "__main__":
    main()
