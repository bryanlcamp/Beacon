#!/usr/bin/env python3
"""
Simple Safe Commit - Single line messages only, zero quoting issues
Usage: python3 simple-commit.py "message"
"""

import sys
import subprocess
import tempfile
import os

def simple_commit(message, add_all=False, push=False):
    """Simple single-line commit with zero shell issues"""
    
    try:
        # Add files if requested
        if add_all:
            result = subprocess.run(['git', 'add', '.'], 
                                  capture_output=True, text=True, check=False)
            if result.returncode != 0:
                print(f"❌ Failed to add files: {result.stderr}")
                return False
            print("✅ Files added")
        
        # Check if anything is staged
        staged_result = subprocess.run(['git', 'diff', '--cached', '--name-only'],
                                     capture_output=True, text=True)
        if not staged_result.stdout.strip():
            print("⚠️  No changes staged for commit")
            return True
        
        # Write message to temp file (completely bypasses shell)
        with tempfile.NamedTemporaryFile(mode='w', 
                                       suffix='.msg', 
                                       delete=False, 
                                       encoding='utf-8') as f:
            f.write(message.strip())
            temp_file = f.name
        
        try:
            # Commit using file - NO SHELL PARSING AT ALL
            result = subprocess.run(['git', 'commit', '-F', temp_file],
                                  capture_output=True, text=True, check=False)
            
            if result.returncode == 0:
                print("✅ Commit successful!")
                print(result.stdout.strip())
                
                # Push if requested
                if push:
                    push_result = subprocess.run(['git', 'push'],
                                               capture_output=True, text=True, check=False)
                    if push_result.returncode == 0:
                        print("✅ Pushed successfully!")
                    else:
                        print(f"⚠️  Push failed: {push_result.stderr}")
                        print("💡 You can push manually: git push")
                
                return True
            else:
                print(f"❌ Commit failed: {result.stderr}")
                return False
                
        finally:
            if os.path.exists(temp_file):
                os.unlink(temp_file)
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == '__main__':
    if len(sys.argv) < 2 or '--help' in sys.argv:
        print("simple-commit.py - Zero Shell Quoting Issues")
        print()
        print("Simple git commit for single-line messages")
        print("Completely avoids all shell parsing and quoting problems")
        print()
        print("Usage:")
        print("  python3 simple-commit.py 'commit message'")
        print("  python3 simple-commit.py --add 'commit message'    # add all files first")  
        print("  python3 simple-commit.py --push 'commit message'   # push after commit")
        print("  python3 simple-commit.py --all 'commit message'    # add all + push")
        print()
        print("Features:")
        print("  • Zero shell quoting issues")
        print("  • Single-line commit messages")
        print("  • Optional add all files")
        print("  • Optional push after commit")
        sys.exit(0 if '--help' in sys.argv else 1)
    
    # Parse arguments
    add_all = '--add' in sys.argv or '--all' in sys.argv
    push = '--push' in sys.argv or '--all' in sys.argv
    
    # Remove flags from argv to get message
    clean_argv = [arg for arg in sys.argv if not arg.startswith('--')]
    
    if len(clean_argv) < 2:
        print("❌ Error: No commit message provided")
        sys.exit(1)
    
    message = clean_argv[1]
    
    if not message.strip():
        print("❌ Error: Empty commit message")
        sys.exit(1)
    
    success = simple_commit(message, add_all, push)
    sys.exit(0 if success else 1)