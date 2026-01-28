import subprocess
import socket
import os

def run_cmd(cmd):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.stdout:
        print(result.stdout.strip())
    if result.stderr:
        print(f"\033[33m{result.stderr.strip()}\033[0m")  # Yellow for warnings/errors
    return result

def get_processes(name):
    result = subprocess.run(f"ps aux | grep {name} | grep -v grep", shell=True, capture_output=True, text=True)
    lines = [line for line in result.stdout.strip().split('\n') if line]
    return lines

def stop_service(service):
    print(f"Stopping {service}...")
    run_cmd(f"sudo systemctl stop {service}")
    print(f"Checking if {service} is stopped:")
    status = subprocess.run(f"sudo systemctl is-active {service}", shell=True, capture_output=True, text=True)
    if status.stdout.strip() == 'inactive':
        print(f"{service} successfully stopped.")
    else:
        print(f"{service} is still running or failed to stop.")

def kill_processes(name):
    procs = get_processes(name)
    if not procs:
        print(f"No running processes found for '{name}'.")
        return False
    print(f"Killing the following '{name}' processes:")
    for proc in procs:
        print(proc)
        pid = proc.split()[1]
        run_cmd(f"sudo kill {pid}")
    # Confirm they're gone
    procs = get_processes(name)
    if not procs:
        print(f"All '{name}' processes killed.")
        return True
    else:
        print(f"Some '{name}' processes may still be running:")
        for proc in procs:
            print(proc)
        return False

def start_service(service):
    print(f"Starting {service}...")
    result = run_cmd(f"sudo systemctl start {service}")
    print(f"Checking if {service} is running:")
    status = subprocess.run(f"sudo systemctl is-active {service}", shell=True, capture_output=True, text=True)
    if status.stdout.strip() == 'active':
        print(f"\033[32m{service} successfully started.\033[0m")
        return True
    else:
        print(f"\033[31m{service} failed to start.\033[0m")
        # Show last 10 lines of the service's journal for diagnostics
        print(f"\033[31mRecent logs for {service}:\033[0m")
        run_cmd(f"sudo journalctl -u {service} -n 10 --no-pager")
        return False

def check_port(port, desc):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.settimeout(2)
        s.connect(('127.0.0.1', port))
        print(f"{desc} is listening on port {port}.")
        return True
    except Exception as e:
        print(f"WARNING: {desc} is NOT listening on port {port}. ({e})")
        return False
    finally:
        s.close()

def main():
    # Stop and kill any running Flask/gunicorn processes
    stop_service('flaskapp')  # Change 'flaskapp' to your actual systemd service name if different
    killed_gunicorn = kill_processes('gunicorn')
    killed_python = kill_processes('python')
    if killed_gunicorn or killed_python:
        print("\033[33mWarning: Flask/gunicorn processes were running and have been killed before starting.\033[0m")

    # Kill C++ processes with names containing 'generator', 'dataset', or 'matching'
    for keyword in ['generator', 'dataset', 'matching']:
        print(f"\nChecking for processes containing '{keyword}':")
        killed = kill_processes(keyword)
        if killed:
            print(f"\033[33mWarning: Processes containing '{keyword}' were running and have been killed before starting.\033[0m")

    # Stop and kill any running nginx processes
    stop_service('nginx')
    killed_nginx = kill_processes('nginx')
    if killed_nginx:
        print("\033[33mWarning: nginx processes were running and have been killed before starting.\033[0m")

    # Start nginx first
    nginx_ok = start_service('nginx')

    # Start Flask (gunicorn systemd service)
    flask_ok = start_service('flaskapp')  # Change 'flaskapp' to your actual systemd service name if different

    # Diagnostics: check ports
    print("\nVerifying nginx and Flask (gunicorn) ports:")
    nginx_port = check_port(80, "nginx")
    flask_port = check_port(5000, "Flask/gunicorn")

    # Final summary
    if nginx_ok and flask_ok and nginx_port and flask_port:
        print("\n\033[32mAll services started successfully!\033[0m")
    else:
        print("\n\033[31mOne or more services failed to start or are not listening on the expected ports. See above for diagnostics.\033[0m")

if __name__ == "__main__":
    main()

