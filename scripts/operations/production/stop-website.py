#!/usr/bin/env python3
import subprocess
import argparse
import sys

def run_ssh(cmd, server, dry_run=False):
    print(f"\n--- Running on server: {cmd} ---")
    if dry_run:
        print("[DRY RUN] Command not executed.")
        return 0
    try:
        ssh_cmd = ["ssh", server, cmd]
        result = subprocess.run(ssh_cmd, capture_output=True, text=True, timeout=30)
        print(result.stdout)
        if result.returncode != 0:
            print(f"ERROR: Command failed with code {result.returncode}")
            if result.stderr:
                print("STDERR:", result.stderr)
        return result.returncode
    except Exception as e:
        print(f"ERROR: Failed to execute command: {e}")
        return 1

def stop_service(service, server, dry_run=False):
    print(f"Stopping {service}...")
    rc = run_ssh(f"sudo systemctl stop {service}", server, dry_run)
    run_ssh(f"sudo systemctl status {service}", server, dry_run)
    return rc

def main():
    parser = argparse.ArgumentParser(description='Remotely stop website services and dependencies with dry-run support.')
    parser.add_argument('--server', default='root@159.65.185.62', help='Remote server user@host')
    parser.add_argument('--webserver', default='nginx', help='Main webserver service name')
    parser.add_argument('--extra', nargs='*', default=[], help='Extra service names to stop')
    parser.add_argument('--kill-cmd', nargs='*', default=[], help='Custom kill/cleanup commands')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be done, but do not execute')
    args = parser.parse_args()

    print("Stopping all website-related services...")
    rc = stop_service(args.webserver, args.server, args.dry_run)
    for svc in args.extra:
        rc |= stop_service(svc, args.server, args.dry_run)

    print("Cleaning up with custom kill/cleanup commands (if any)...")
    for cmd in args.kill_cmd:
        rc |= run_ssh(cmd, args.server, args.dry_run)

    if rc == 0:
        print("\nAll services stopped successfully.")
    else:
        print("\nSome errors occurred while stopping services. Check output above.")

if __name__ == "__main__":
    main()
