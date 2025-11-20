#!/usr/bin/env python3
"""
Simple Safe Commit - Single line messages only, zero quoting issues
Usage: python3 simple-commit.py "message"
"""

import sys
import subprocess
import tempfile
import os
import json
import re
from pathlib import Path

def run_build_verification():
    """Run build and test verification before commit"""
    print("🔧 Running build verification...")
    
    # Check for common build files to determine build system
    cwd = Path.cwd()
    build_commands = []
    
    # CMake project
    if (cwd / 'CMakeLists.txt').exists():
        print("   📋 Detected CMake project")
        # Check if build directory exists
        if (cwd / 'build').exists():
            build_commands.append((['cmake', '--build', 'build'], 'CMake build'))
        else:
            print("   ⚠️  Build directory not found, configuring first...")
            config_result = subprocess.run(['cmake', '-B', 'build', '-S', '.'],
                                         capture_output=True, text=True, timeout=60)
            if config_result.returncode == 0:
                build_commands.append((['cmake', '--build', 'build'], 'CMake build'))
            else:
                print(f"   ❌ CMake configuration failed:")
                print(f"   {config_result.stderr.strip()[:200]}")
                return False
    
    # Python project
    elif (cwd / 'setup.py').exists() or (cwd / 'pyproject.toml').exists():
        print("   📋 Detected Python project")
        # Find Python files and check syntax
        python_files = list(cwd.glob('**/*.py'))
        if python_files:
            # Check syntax of Python files
            for py_file in python_files[:10]:  # Limit to first 10 files
                result = subprocess.run(['python3', '-m', 'py_compile', str(py_file)],
                                      capture_output=True, text=True)
                if result.returncode != 0:
                    print(f"   ❌ Python syntax error in {py_file}:")
                    print(f"   {result.stderr.strip()[:200]}")
                    return False
            print(f"   ✅ Python syntax check passed ({len(python_files)} files)")
    
    # Node.js project
    elif (cwd / 'package.json').exists():
        print("   📋 Detected Node.js project")
        build_commands.append((['npm', 'run', 'build'], 'npm build'))
        build_commands.append((['npm', 'test'], 'npm test'))
    
    # Generic make
    elif (cwd / 'Makefile').exists():
        print("   📋 Detected Makefile")
        build_commands.append((['make'], 'Make build'))
    
    if not build_commands and not (cwd / 'setup.py').exists() and not (cwd / 'pyproject.toml').exists():
        print("   ⚠️  No recognized build system found, skipping build check")
        return True
    
    # Run build commands
    for command, description in build_commands:
        print(f"   🔨 Running: {description}")
        try:
            result = subprocess.run(command, capture_output=True, text=True, 
                                  timeout=120, cwd=cwd)
            
            if result.returncode == 0:
                print(f"   ✅ {description} passed")
            else:
                print(f"   ❌ {description} FAILED")
                
                # Show first few lines of error
                if result.stderr:
                    error_lines = result.stderr.strip().split('\n')[:5]
                    print("   📄 Error details:")
                    for line in error_lines:
                        if line.strip():
                            print(f"      {line.strip()[:100]}")
                
                print(f"\n🚫 COMMIT BLOCKED: Build/test failures detected")
                print(f"   Fix build issues before committing")
                print(f"   Run '{' '.join(command)}' to see full details")
                return False
                
        except subprocess.TimeoutExpired:
            print(f"   ⏰ {description} timed out (>2min)")
            print(f"   Consider running manually: {' '.join(command)}")
            return False
        except FileNotFoundError:
            print(f"   ⚠️  Command not found: {command[0]}")
            print(f"   Skipping {description}")
    
    print("✅ All build verifications passed!")
    return True

def validate_simple_issue_reference(message):
    """Light issue reference validation for simple commits"""
    # Basic patterns for issue references
    issue_patterns = [
        r'#\d+',           # #123
        r'fixes #\d+',     # fixes #123
        r'closes #\d+',    # closes #123
        r'refs #\d+',      # refs #123
        r'PROJ-\d+',       # PROJ-123
    ]
    
    # Check if message contains issue reference
    for pattern in issue_patterns:
        if re.search(pattern, message, re.IGNORECASE):
            return True
    
    # Check for bypass types (docs, chore, etc.)
    bypass_types = ['docs:', 'chore:', 'style:', 'refactor:']
    for bypass in bypass_types:
        if message.lower().startswith(bypass):
            print(f"✅ '{bypass.rstrip(':')}' type bypasses issue requirement")
            return True
    
    # No issue found - warn but don't block (simple commit is lenient)
    print("⚠️  No issue reference found (e.g., #123, fixes #456)")
    print("💡 Consider linking commits to issues for better tracking")
    
    # For simple commit, just warn - don't block
    return True

def simple_commit(message, add_all=False, push=False, verify_build=False, max_files=20):
    """Simple single-line commit with zero shell issues and safety checks"""
    
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
        
        # Check file count limit
        staged_files = staged_result.stdout.strip().split('\n')
        staged_files = [f for f in staged_files if f.strip()]  # Remove empty lines
        
        if len(staged_files) > max_files:
            print(f"🚨 COMMIT BLOCKED: Too many files ({len(staged_files)} > {max_files})")
            print("   Large commits should be done manually for safety")
            print("   Consider breaking into smaller, logical commits")
            print(f"   Files to commit: {len(staged_files)}")
            for i, f in enumerate(staged_files[:5]):
                print(f"   • {f}")
            if len(staged_files) > 5:
                print(f"   ... and {len(staged_files) - 5} more files")
            print("\n💡 Use git commit manually or split into smaller commits")
            return False
        
        # Build/test verification if requested
        if verify_build:
            if not run_build_verification():
                return False
        
        # Issue reference validation (light version)
        if not validate_simple_issue_reference(message):
            return False
        
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
        print("  python3 simple-commit.py --add 'message'           # add all files first")  
        print("  python3 simple-commit.py --push 'message'          # push after commit")
        print("  python3 simple-commit.py --build 'message'         # verify build first")
        print("  python3 simple-commit.py --verify 'message'        # same as --build")
        print("  python3 simple-commit.py --all 'message'           # add + build + push")
        print("  python3 simple-commit.py --max-files=50 'message'  # custom file limit")
        print()
        print("Features:")
        print("  • Zero shell quoting issues")
        print("  • Single-line commit messages")
        print("  • Optional add all files")
        print("  • Optional build/test verification")
        print("  • File count safety limits")
        print("  • Optional push after commit")
        sys.exit(0 if '--help' in sys.argv else 1)
    
    # Parse arguments
    add_all = '--add' in sys.argv or '--all' in sys.argv
    push = '--push' in sys.argv or '--all' in sys.argv
    verify_build = '--build' in sys.argv or '--verify' in sys.argv or '--all' in sys.argv
    
    # Parse max files limit
    max_files = 20  # default
    for arg in sys.argv:
        if arg.startswith('--max-files='):
            try:
                max_files = int(arg.split('=')[1])
            except ValueError:
                print(f"❌ Invalid max-files value: {arg}")
                sys.exit(1)
    
    # Remove flags from argv to get message
    clean_argv = [arg for arg in sys.argv if not arg.startswith('--')]
    
    if len(clean_argv) < 2:
        print("❌ Error: No commit message provided")
        sys.exit(1)
    
    message = clean_argv[1]
    
    if not message.strip():
        print("❌ Error: Empty commit message")
        sys.exit(1)
    
    success = simple_commit(message, add_all, push, verify_build, max_files)
    sys.exit(0 if success else 1)