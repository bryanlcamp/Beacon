#!/usr/bin/env python3
# ---------------------------------------------------------------------------
# @file      deploy_prod.py
# @project   Beacon
# @component Production Deployment
# @brief     Deploys web assets to production server via SFTP with venv
# @author    Bryan Camp
# ---------------------------------------------------------------------------

import os
import sys
from pathlib import Path
import subprocess

# ------------------ Paths & Config ------------------
SCRIPT_DIR = Path(__file__).parent
REPO_DIR = SCRIPT_DIR.parent.parent.parent
WEB_DIR = REPO_DIR / "web"
VENV_DIR = SCRIPT_DIR / ".venv"  # same venv as dev
REMOTE_HOST = "your.prod.server.com"
REMOTE_PORT = 22
REMOTE_USER = "username"
REMOTE_DIR = "/var/www/html"   # production web root
SSH_KEY_PATH = Path.home() / ".ssh/id_rsa"  # optional
# ---------------------------------------------------

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
    subprocess.run([str(pip), "install", "paramiko"], check=True)

def deploy():
    python_exec = VENV_DIR / "bin" / "python"
    print(f"{GREEN}Starting deployment using virtual environment...{NC}")
    subprocess.run([str(python_exec), "-c",
        f"import paramiko; print('paramiko imported successfully')"], check=True)

    import paramiko
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(
        REMOTE_HOST,
        port=REMOTE_PORT,
        username=REMOTE_USER,
        key_filename=str(SSH_KEY_PATH) if SSH_KEY_PATH.exists() else None,
        # will prompt for password if key not present
    )

    sftp = ssh.open_sftp()
    def upload_dir(local_path, remote_path):
        for item in local_path.iterdir():
            remote_item = os.path.join(remote_path, item.name)
            if item.is_dir():
                try:
                    sftp.mkdir(remote_item)
                    print(f"{GREEN}Created directory {remote_item}{NC}")
                except IOError:
                    pass  # Already exists
                upload_dir(item, remote_item)
            else:
                sftp.put(str(item), remote_item)
                print(f"{GREEN}Uploaded {item} → {remote_item}{NC}")
    upload_dir(WEB_DIR, REMOTE_DIR)
    sftp.close()
    ssh.close()
    print(f"{GREEN}Deployment complete ✅{NC}")

def main():
    print(f"{GREEN}=== Starting Beacon Production Deployment ==={NC}")
    create_venv()
    install_packages()
    deploy()

if __name__ == "__main__":
    main()