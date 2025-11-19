#!/usr/bin/env python3
"""
Beacon Kill All Script
Kills all running Beacon processes (generator, tests, etc.).
"""

import subprocess
import signal
import sys
from pathlib import Path

def main():
    print("🔍 Searching for Beacon processes...")
    
    try:
        # Find all processes containing 'beacon' or 'generator' in the name
        result = subprocess.run(['pgrep', '-f', 'beacon|generator'], 
                              capture_output=True, text=True)
        
        if result.returncode != 0:
            print("✅ No Beacon processes found running")
            return 0
        
        pids = result.stdout.strip().split('\n')
        pids = [pid for pid in pids if pid]  # Remove empty strings
        
        if not pids:
            print("✅ No Beacon processes found running")
            return 0
        
        print(f"🎯 Found {len(pids)} Beacon process(es)")
        
        # Get process details
        for pid in pids:
            try:
                ps_result = subprocess.run(['ps', '-p', pid, '-o', 'pid,comm,args'], 
                                         capture_output=True, text=True)
                if ps_result.returncode == 0:
                    lines = ps_result.stdout.strip().split('\n')
                    if len(lines) > 1:  # Skip header
                        print(f"   📍 {lines[1]}")
            except:
                print(f"   📍 PID: {pid}")
        
        # Ask for confirmation
        response = input("\n⚠️  Kill all these processes? (y/N): ").strip().lower()
        
        if response not in ['y', 'yes']:
            print("❌ Aborted - no processes killed")
            return 0
        
        # Kill processes
        killed = 0
        failed = 0
        
        for pid in pids:
            try:
                # Try graceful termination first
                subprocess.run(['kill', '-TERM', pid], check=True)
                print(f"🔄 Sent SIGTERM to PID {pid}")
                killed += 1
            except subprocess.CalledProcessError:
                try:
                    # Force kill if graceful fails
                    subprocess.run(['kill', '-KILL', pid], check=True)
                    print(f"💀 Force killed PID {pid}")
                    killed += 1
                except subprocess.CalledProcessError:
                    print(f"❌ Failed to kill PID {pid}")
                    failed += 1
        
        if killed > 0:
            print(f"\n✅ Successfully killed {killed} process(es)")
        if failed > 0:
            print(f"❌ Failed to kill {failed} process(es)")
            return 1
        
        return 0
        
    except KeyboardInterrupt:
        print("\n⚠️  Interrupted by user")
        return 130
    except Exception as e:
        print(f"💥 Error: {e}")
        return 1

if __name__ == "__main__":
    exit(main())