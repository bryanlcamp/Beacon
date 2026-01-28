#!/usr/bin/env python3
def get_changed_files(local_dir, remote, remote_dir):
def sync_files(local_dir, remote, remote_dir, files=None):
def main():

import subprocess
import os
import argparse

def get_changed_files(local_dir, remote, remote_dir, dry_run=True):
    cmd = [
        'rsync', '-avz' + ('n' if dry_run else ''), '--progress', '--exclude=web-latest.tar.gz',
        f'{remote}:{remote_dir.rstrip('/')}/', local_dir.rstrip('/') + '/'
    ]
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    changed = []
    for line in result.stdout.splitlines():
        if line.startswith('receiving') or line.startswith('sent '):
            continue
        if line and not line.endswith('/') and not line.startswith('total size is') and not line.startswith('sending'):
            changed.append(line.strip())
    return changed, result.stdout

def sync_files(local_dir, remote, remote_dir, files=None, dry_run=False):
    base_flags = '-avz' + ('n' if dry_run else '')
    if files is None:
        cmd = [
            'rsync', base_flags, '--progress', '--exclude=web-latest.tar.gz',
            f'{remote}:{remote_dir.rstrip('/')}/', local_dir.rstrip('/') + '/'
        ]
    else:
        cmd = [
            'rsync', base_flags, '--progress', '--exclude=web-latest.tar.gz'
        ] + [f'{remote}:{remote_dir.rstrip('/')}/' + f for f in files] + [local_dir.rstrip('/') + '/']
    subprocess.run(cmd)

def main():
    parser = argparse.ArgumentParser(description='Pull remote web directory to local with dry-run and selective sync.')
    parser.add_argument('--all', action='store_true', help='Pull all changed files without prompt')
    parser.add_argument('--select', action='store_true', help='Select individual files to pull')
    parser.add_argument('--dry-run', action='store_true', help='Show what would change, but do not copy')
    parser.add_argument('--local-dir', default='/Users/bryancamp/SoftwareDevelopment/cpp/commercial/beacon/web', help='Local web directory')
    parser.add_argument('--remote', default='root@159.65.185.62', help='Remote server user@host')
    parser.add_argument('--remote-dir', default='/var/www/html/web', help='Remote web directory')
    args = parser.parse_args()

    print('Checking for files to pull (dry run)...')
    changed, dryrun_output = get_changed_files(args.local_dir, args.remote, args.remote_dir, dry_run=True)
    print(f'\n{len(changed)} file(s) will be updated locally.')
    if not changed:
        print('No changes to pull.')
        return
    print('\nChanged files:')
    for i, f in enumerate(changed, 1):
        print(f'{i}. {f}')

    if args.dry_run:
        print('\nDry run only. No files will be pulled.')
        return

    if args.all:
        print('\nPulling all changed files...')
        sync_files(args.local_dir, args.remote, args.remote_dir, dry_run=False)
        return
    if args.select:
        print('Enter file numbers to pull (comma separated):')
        nums = input('> ').strip().split(',')
        files = []
        for n in nums:
            try:
                idx = int(n.strip()) - 1
                if 0 <= idx < len(changed):
                    files.append(changed[idx])
            except Exception:
                continue
        if files:
            print(f'\nPulling {len(files)} file(s)...')
            sync_files(args.local_dir, args.remote, args.remote_dir, files, dry_run=False)
        else:
            print('No valid files selected. Nothing pulled.')
        return

    print('\nOptions:')
    print('  [a] Replace ALL changed files locally')
    print('  [s] Select individual files to pull')
    print('  [q] Quit (do nothing)')
    choice = input('Choose an option [a/s/q]: ').strip().lower()
    if choice == 'a':
        print('\nPulling all changed files...')
        sync_files(args.local_dir, args.remote, args.remote_dir, dry_run=False)
    elif choice == 's':
        print('Enter file numbers to pull (comma separated):')
        nums = input('> ').strip().split(',')
        files = []
        for n in nums:
            try:
                idx = int(n.strip()) - 1
                if 0 <= idx < len(changed):
                    files.append(changed[idx])
            except Exception:
                continue
        if files:
            print(f'\nPulling {len(files)} file(s)...')
            sync_files(args.local_dir, args.remote, args.remote_dir, files, dry_run=False)
        else:
            print('No valid files selected. Nothing pulled.')
    else:
        print('Aborted. No changes pulled.')

if __name__ == '__main__':
    main()
