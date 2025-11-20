#!/usr/bin/env python3
"""
Beacon Commit Helper - Safe commit message handling
Prevents shell quoting issues with multi-line commit messages
"""

import sys
import subprocess
import tempfile
import os

def safe_commit(message, add_all=True):
    """
    Safely commit with multi-line messages using temporary file
    """
    try:
        # Add files if requested
        if add_all:
            subprocess.run(['git', 'add', '-A'], check=True)
        
        # Write message to temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write(message)
            temp_file = f.name
        
        # Commit using file
        result = subprocess.run(['git', 'commit', '-F', temp_file], 
                              capture_output=True, text=True)
        
        # Cleanup
        os.unlink(temp_file)
        
        if result.returncode == 0:
            print(f"✅ Commit successful: {result.stdout.strip()}")
            return True
        else:
            print(f"❌ Commit failed: {result.stderr.strip()}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 commit-helper.py 'commit message'")
        print("       python3 commit-helper.py --file message.txt")
        sys.exit(1)
    
    if sys.argv[1] == '--file':
        with open(sys.argv[2], 'r') as f:
            message = f.read().strip()
    else:
        message = sys.argv[1]
    
    safe_commit(message)

if __name__ == '__main__':
    main()