#!/usr/bin/env python3
"""
Safe Git Commit - Prevents shell quoting issues
Usage: python3 safe-commit.py "commit message"
"""

import sys
import subprocess
import tempfile
import os

def safe_commit(message, add_all=False):
    """Safely commit with any message using temporary file"""
    try:
        if add_all:
            subprocess.run(['git', 'add', '.'], check=True)
        
        # Write message to temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write(message)
            temp_file = f.name
        
        # Commit using file (avoids ALL shell quoting issues)
        result = subprocess.run(['git', 'commit', '-F', temp_file], 
                              capture_output=True, text=True)
        
        # Cleanup
        os.unlink(temp_file)
        
        if result.returncode == 0:
            print("✅ Commit successful!")
            print(result.stdout.strip())
            return True
        else:
            print("❌ Commit failed:")
            print(result.stderr.strip())
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 safe-commit.py 'commit message'")
        print("       python3 safe-commit.py --add 'commit message'  # add all files first")
        sys.exit(1)
    
    add_all = '--add' in sys.argv
    if add_all:
        sys.argv.remove('--add')
    
    message = sys.argv[1]
    safe_commit(message, add_all)