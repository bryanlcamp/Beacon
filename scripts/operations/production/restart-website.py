#!/usr/bin/env python3
import subprocess
import argparse

def run_ssh(cmd, server, dry_run=False):
    print(f"\n--- Running on server: {cmd} ---")
    if dry_run:
        print("[DRY RUN] Command not executed.")
        return None
    ssh_cmd = ["ssh", server, cmd]
    result = subprocess.run(ssh_cmd, capture_output=True, text=True)
    print(result.stdout)
    if result.stderr:
        print("ERROR:", result.stderr)
    return result

def ensure_service(service, server, dry_run=False):
    # Check if running
    status = run_ssh(f"systemctl is-active {service}", server, dry_run)
    if not dry_run and status and ("inactive" in status.stdout or "failed" in status.stdout):
        print(f"{service} is not running. Starting...")
        run_ssh(f"sudo systemctl start {service}", server, dry_run)
    else:
        print(f"{service} is running. Restarting...")
        run_ssh(f"sudo systemctl restart {service}", server, dry_run)
    run_ssh(f"sudo systemctl status {service}", server, dry_run)

def main():
    parser = argparse.ArgumentParser(description='Remotely restart website services and dependencies with dry-run support.')
    parser.add_argument('--server', default='root@159.65.185.62', help='Remote server user@host')
    parser.add_argument('--webserver', default='nginx', help='Main webserver service name')
    parser.add_argument('--extra', nargs='*', default=[], help='Extra service names to manage')
    parser.add_argument('--kill-cmd', nargs='*', default=[], help='Custom kill/cleanup commands')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be done, but do not execute')
    args = parser.parse_args()

    print("Cleaning up stale webserver processes (if any)...")
    for cmd in args.kill_cmd:
        run_ssh(cmd, args.server, args.dry_run)

    print(f"\nChecking and managing main webserver: {args.webserver}")
    ensure_service(args.webserver, args.server, args.dry_run)

    for svc in args.extra:
        print(f"\nChecking and managing extra service: {svc}")
        ensure_service(svc, args.server, args.dry_run)

    print("\nAll done.")

if __name__ == "__main__":
    main()
