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
        local_dir.rstrip('/') + '/', f'{remote}:{remote_dir.rstrip('/')}/'
    ]
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    changed = []
    for line in result.stdout.splitlines():
        if line.startswith('sending') or line.startswith('sent '):
            continue
        if line and not line.endswith('/') and not line.startswith('total size is') and not line.startswith('receiving'):
            changed.append(line.strip())
    return changed, result.stdout

def sync_files(local_dir, remote, remote_dir, files=None, dry_run=False):
    base_flags = '-avz' + ('n' if dry_run else '')
    if files is None:
        cmd = [
            'rsync', base_flags, '--progress', '--exclude=web-latest.tar.gz',
            local_dir.rstrip('/') + '/', f'{remote}:{remote_dir.rstrip('/')}/'
        ]
    else:
        cmd = [
            'rsync', base_flags, '--progress', '--exclude=web-latest.tar.gz'
        ] + files + [f'{remote}:{remote_dir.rstrip('/')}/']
    subprocess.run(cmd)

def main():
    parser = argparse.ArgumentParser(description='Push local web directory to server with dry-run and selective sync.')
    parser.add_argument('--all', action='store_true', help='Push all changed files without prompt')
    parser.add_argument('--select', action='store_true', help='Select individual files to push')
    parser.add_argument('--dry-run', action='store_true', help='Show what would change, but do not copy')
    parser.add_argument('--local-dir', default='/Users/bryancamp/SoftwareDevelopment/cpp/commercial/beacon/web', help='Local web directory')
    parser.add_argument('--remote', default='root@159.65.185.62', help='Remote server user@host')
    parser.add_argument('--remote-dir', default='/var/www/html/web', help='Remote web directory')
    args = parser.parse_args()

    print('Checking for files to push (dry run)...')
    changed, dryrun_output = get_changed_files(args.local_dir, args.remote, args.remote_dir, dry_run=True)
    print(f'\n{len(changed)} file(s) will be updated on the server.')
    if not changed:
        print('No changes to push.')
        return
    print('\nChanged files:')
    for i, f in enumerate(changed, 1):
        print(f'{i}. {f}')

    if args.dry_run:
        print('\nDry run only. No files will be pushed.')
        return

    if args.all:
        print('\nPushing all changed files...')
        sync_files(args.local_dir, args.remote, args.remote_dir, dry_run=False)
        return
    if args.select:
        print('Enter file numbers to push (comma separated):')
        nums = input('> ').strip().split(',')
        files = []
        for n in nums:
            try:
                idx = int(n.strip()) - 1
                if 0 <= idx < len(changed):
                    files.append(os.path.join(args.local_dir, changed[idx]))
            except Exception:
                continue
        if files:
            print(f'\nPushing {len(files)} file(s)...')
            sync_files(args.local_dir, args.remote, args.remote_dir, files, dry_run=False)
        else:
            print('No valid files selected. Nothing pushed.')
        return

    print('\nOptions:')
    print('  [a] Replace ALL changed files on the server')
    print('  [s] Select individual files to push')
    print('  [q] Quit (do nothing)')
    choice = input('Choose an option [a/s/q]: ').strip().lower()
    if choice == 'a':
        print('\nPushing all changed files...')
        sync_files(args.local_dir, args.remote, args.remote_dir, dry_run=False)
    elif choice == 's':
        print('Enter file numbers to push (comma separated):')
        nums = input('> ').strip().split(',')
        files = []
        for n in nums:
            try:
                idx = int(n.strip()) - 1
                if 0 <= idx < len(changed):
                    files.append(os.path.join(args.local_dir, changed[idx]))
            except Exception:
                continue
        if files:
            print(f'\nPushing {len(files)} file(s)...')
            sync_files(args.local_dir, args.remote, args.remote_dir, files, dry_run=False)
        else:
            print('No valid files selected. Nothing pushed.')
    else:
        print('Aborted. No changes pushed.')

if __name__ == '__main__':
    main()
