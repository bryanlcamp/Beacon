#!/usr/bin/env python3
"""
Interactive Safe Git Commit - Zero Shell Quoting Issues
Prompts for commit message interactively to avoid ALL shell parsing
"""

import subprocess
import tempfile
import os
import sys

def interactive_commit():
    """Interactive commit with zero shell quoting issues"""
    
    print("🚀 Interactive Safe Git Commit")
    print("=" * 40)
    
    # Check git status
    status_result = subprocess.run(['git', 'status', '--porcelain'], 
                                 capture_output=True, text=True)
    
    if status_result.returncode != 0:
        print("❌ Not in a git repository")
        return False
    
    # Show current status
    if status_result.stdout.strip():
        print("\n📋 Repository Status:")
        lines = status_result.stdout.strip().split('\n')
        staged_files = []
        unstaged_files = []
        untracked_files = []
        
        for line in lines:
            if line.strip():
                status = line[:2]
                filename = line[3:]
                
                if status[0] in ['A', 'M', 'D', 'R', 'C']:
                    staged_files.append(filename)
                elif status[1] in ['M', 'D']:
                    unstaged_files.append(filename)
                elif status == '??':
                    untracked_files.append(filename)
        
        if staged_files:
            print(f"✅ Staged ({len(staged_files)} files):")
            for f in staged_files[:5]:
                print(f"   • {f}")
            if len(staged_files) > 5:
                print(f"   ... and {len(staged_files) - 5} more")
        
        if unstaged_files:
            print(f"📝 Modified ({len(unstaged_files)} files):")
            for f in unstaged_files[:3]:
                print(f"   • {f}")
            if len(unstaged_files) > 3:
                print(f"   ... and {len(unstaged_files) - 3} more")
        
        if untracked_files:
            print(f"❓ Untracked ({len(untracked_files)} files):")
            for f in untracked_files[:3]:
                print(f"   • {f}")
            if len(untracked_files) > 3:
                print(f"   ... and {len(untracked_files) - 3} more")
        
        # Ask about adding files
        if unstaged_files or untracked_files:
            print(f"\n🤔 Add all changes before committing?")
            add_response = input("   (y)es / (n)o / (s)elect specific files: ").strip().lower()
            
            if add_response in ['y', 'yes']:
                add_result = subprocess.run(['git', 'add', '.'], 
                                         capture_output=True, text=True)
                if add_result.returncode == 0:
                    print("✅ All files added")
                else:
                    print(f"❌ Failed to add files: {add_result.stderr}")
                    return False
            elif add_response in ['s', 'select']:
                # Let user select specific files
                all_files = unstaged_files + untracked_files
                selected_files = []
                
                for file in all_files:
                    response = input(f"Add '{file}'? (y/n): ").strip().lower()
                    if response in ['y', 'yes']:
                        selected_files.append(file)
                
                if selected_files:
                    add_result = subprocess.run(['git', 'add'] + selected_files,
                                             capture_output=True, text=True)
                    if add_result.returncode == 0:
                        print(f"✅ Added {len(selected_files)} file(s)")
                    else:
                        print(f"❌ Failed to add files: {add_result.stderr}")
                        return False
    
    # Check if anything is staged
    staged_result = subprocess.run(['git', 'diff', '--cached', '--name-only'],
                                 capture_output=True, text=True)
    
    if not staged_result.stdout.strip():
        print("\n⚠️  No changes staged for commit")
        return True
    
    print(f"\n📝 Enter commit message (press Ctrl+D when done):")
    print("   Tip: First line should be a summary (max 72 chars)")
    print("   Add blank line then detailed description if needed")
    print("-" * 50)
    
    # Read multi-line commit message
    message_lines = []
    try:
        while True:
            try:
                line = input()
                message_lines.append(line)
            except EOFError:
                break
    except KeyboardInterrupt:
        print("\n\n❌ Commit cancelled by user")
        return False
    
    if not message_lines or not any(line.strip() for line in message_lines):
        print("❌ Empty commit message - commit cancelled")
        return False
    
    commit_message = '\n'.join(message_lines).strip()
    
    # Show preview
    print("\n📋 Commit Message Preview:")
    print("-" * 30)
    print(commit_message)
    print("-" * 30)
    
    confirm = input("\n🚀 Proceed with commit? (y/n): ").strip().lower()
    if confirm not in ['y', 'yes']:
        print("❌ Commit cancelled")
        return False
    
    # Perform commit using temporary file
    with tempfile.NamedTemporaryFile(mode='w', 
                                   suffix='.commit-msg', 
                                   delete=False, 
                                   encoding='utf-8') as f:
        f.write(commit_message)
        f.flush()
        temp_file = f.name
    
    try:
        commit_result = subprocess.run(['git', 'commit', '-F', temp_file],
                                     capture_output=True, text=True)
        
        if commit_result.returncode == 0:
            print("✅ Commit successful!")
            
            # Extract commit hash
            hash_result = subprocess.run(['git', 'rev-parse', 'HEAD'],
                                       capture_output=True, text=True)
            if hash_result.returncode == 0:
                commit_hash = hash_result.stdout.strip()[:8]
                print(f"   📝 Commit: {commit_hash}")
            
            # Ask about pushing
            push_response = input("\n📤 Push to remote? (y/n): ").strip().lower()
            if push_response in ['y', 'yes']:
                push_result = subprocess.run(['git', 'push'],
                                           capture_output=True, text=True)
                if push_result.returncode == 0:
                    print("✅ Successfully pushed to remote!")
                else:
                    print(f"❌ Push failed: {push_result.stderr}")
                    print("💡 You can push manually later with: git push")
            
            return True
        else:
            print(f"❌ Commit failed: {commit_result.stderr}")
            return False
            
    finally:
        if os.path.exists(temp_file):
            os.unlink(temp_file)

if __name__ == '__main__':
    if '--help' in sys.argv or '-h' in sys.argv:
        print("interactive-commit.py - Zero Shell Quoting Issues")
        print()
        print("Interactive git commit that completely avoids shell parsing")
        print("Perfect for multi-line commit messages with any characters")
        print()
        print("Usage: python3 interactive-commit.py")
        print()
        print("Features:")
        print("  • No shell quoting issues whatsoever")
        print("  • Interactive file selection")
        print("  • Multi-line message support")
        print("  • Commit preview and confirmation")
        print("  • Optional push after commit")
        sys.exit(0)
    
    success = interactive_commit()
    if not success:
        sys.exit(1)