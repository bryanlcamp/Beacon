#!/usr/bin/env python3
"""
beacon-git-commit.py - Intelligent Git Workflow Automation
Professional commit workflow with safety checks and smart defaults
"""

import subprocess
import sys
import os
import tempfile
import re
from pathlib import Path
from datetime import datetime

class BeaconGitCommit:
    def __init__(self):
        self.repo_root = Path.cwd()
        self.staged_files = []
        self.modified_files = []
        self.untracked_files = []
        self.commit_hash = None
        
    def run_git_command(self, cmd, capture_output=True, check=False):
        """Run git command safely"""
        try:
            result = subprocess.run(['git'] + cmd, 
                                  capture_output=capture_output, 
                                  text=True, 
                                  check=check)
            return result
        except subprocess.CalledProcessError as e:
            print(f"❌ Git command failed: git {' '.join(cmd)}")
            print(f"   Error: {e.stderr.strip() if e.stderr else str(e)}")
            return None
    
    def check_git_repo(self):
        """Verify we're in a git repository"""
        result = self.run_git_command(['rev-parse', '--git-dir'])
        if not result or result.returncode != 0:
            print("❌ Not in a git repository!")
            return False
        return True
    
    def analyze_repo_status(self):
        """Analyze current repository status"""
        print("🔍 Analyzing repository status...")
        
        # Get repository status
        status_result = self.run_git_command(['status', '--porcelain'])
        if not status_result:
            return False
        
        # Parse git status output
        for line in status_result.stdout.strip().split('\n'):
            if not line:
                continue
                
            status_code = line[:2]
            filename = line[3:]
            
            if status_code[0] in ['A', 'M', 'D', 'R', 'C']:  # Staged changes
                self.staged_files.append(filename)
            elif status_code[1] in ['M', 'D']:  # Modified tracked files
                self.modified_files.append(filename)
            elif status_code == '??':  # Untracked files
                self.untracked_files.append(filename)
        
        print(f"   📁 Staged files: {len(self.staged_files)}")
        print(f"   📝 Modified tracked files: {len(self.modified_files)}")
        print(f"   ❓ Untracked files: {len(self.untracked_files)}")
        
        return True
    
    def handle_modified_files(self):
        """Handle unstaged modifications to tracked files"""
        if not self.modified_files:
            return True
            
        print(f"\n⚠️  Found {len(self.modified_files)} modified tracked file(s):")
        for file in self.modified_files[:10]:  # Show max 10
            print(f"   📝 {file}")
        if len(self.modified_files) > 10:
            print(f"   ... and {len(self.modified_files) - 10} more")
        
        response = input("\n💭 Include these modifications in the commit? (y/n/diff): ").strip().lower()
        
        if response == 'diff':
            # Show diff for modified files
            print("\n📋 Changes in modified files:")
            diff_result = self.run_git_command(['diff', '--stat'])
            if diff_result:
                print(diff_result.stdout)
            response = input("Include these changes? (y/n): ").strip().lower()
        
        if response in ['y', 'yes']:
            # Stage modified files
            add_result = self.run_git_command(['add'] + self.modified_files, check=False)
            if add_result and add_result.returncode == 0:
                print(f"✅ Staged {len(self.modified_files)} modified file(s)")
                self.staged_files.extend(self.modified_files)
                self.modified_files = []
                return True
            else:
                print("❌ Failed to stage modified files")
                return False
        elif response in ['n', 'no']:
            print("🚫 Commit aborted - this commit needs to be done manually")
            print("💡 Use 'git add <files>' to selectively stage changes, then commit manually")
            return False
        else:
            print("❌ Invalid response. Aborting.")
            return False
    
    def handle_untracked_files(self):
        """Handle untracked files"""
        if not self.untracked_files:
            return True
        
        # Filter out obvious temp/build files
        important_untracked = []
        for file in self.untracked_files:
            # Skip common temp/build patterns
            if any(pattern in file.lower() for pattern in 
                   ['.tmp', '.temp', 'build/', '.DS_Store', '__pycache__', '.pyc']):
                continue
            important_untracked.append(file)
        
        if not important_untracked:
            return True
        
        print(f"\n📂 Found {len(important_untracked)} untracked file(s):")
        for file in important_untracked[:10]:  # Show max 10
            print(f"   ❓ {file}")
        if len(important_untracked) > 10:
            print(f"   ... and {len(important_untracked) - 10} more")
        
        response = input("\n💭 Add these untracked files to the commit? (y/n/select): ").strip().lower()
        
        if response == 'select':
            # Let user select specific files
            selected_files = []
            for file in important_untracked:
                file_response = input(f"Add '{file}'? (y/n): ").strip().lower()
                if file_response in ['y', 'yes']:
                    selected_files.append(file)
            
            if selected_files:
                add_result = self.run_git_command(['add'] + selected_files, check=False)
                if add_result and add_result.returncode == 0:
                    print(f"✅ Added {len(selected_files)} untracked file(s)")
                    self.staged_files.extend(selected_files)
                else:
                    print("❌ Failed to add selected files")
                    return False
        elif response in ['y', 'yes']:
            # Add all important untracked files
            add_result = self.run_git_command(['add'] + important_untracked, check=False)
            if add_result and add_result.returncode == 0:
                print(f"✅ Added {len(important_untracked)} untracked file(s)")
                self.staged_files.extend(important_untracked)
            else:
                print("❌ Failed to add untracked files")
                return False
        
        return True
    
    def generate_intelligent_commit_message(self):
        """Generate an intelligent commit message based on changes"""
        if not self.staged_files:
            return "chore: Update repository"
        
        # Analyze file changes to generate appropriate message
        added_files = []
        modified_files = []
        deleted_files = []
        
        # Get detailed status of staged files
        diff_result = self.run_git_command(['diff', '--cached', '--name-status'])
        if diff_result:
            for line in diff_result.stdout.strip().split('\n'):
                if not line:
                    continue
                parts = line.split('\t', 1)
                if len(parts) == 2:
                    status, filename = parts[0], parts[1]
                    if status == 'A':
                        added_files.append(filename)
                    elif status == 'M':
                        modified_files.append(filename)
                    elif status == 'D':
                        deleted_files.append(filename)
        
        # Determine commit type and scope
        commit_type = "feat"  # Default
        scope = ""
        description_parts = []
        
        # Analyze file patterns to determine type
        file_patterns = {
            'docs': ['.md', 'README', 'docs/', 'documentation'],
            'test': ['test_', 'tests/', '_test.', 'spec_'],
            'config': ['config/', '.json', '.yml', '.yaml', '.toml'],
            'ci': ['.github/', 'ci/', 'cd/', 'pipeline'],
            'build': ['CMakeLists.txt', 'Makefile', 'build.', 'setup.'],
            'release': ['VERSION', 'CHANGELOG', 'release', 'BeaconRelease.py']
        }
        
        # Determine primary type based on files
        type_counts = {t: 0 for t in file_patterns.keys()}
        for filename in self.staged_files:
            for file_type, patterns in file_patterns.items():
                if any(pattern in filename for pattern in patterns):
                    type_counts[file_type] += 1
        
        # Select the most common type, or use 'feat' as default
        if any(type_counts.values()):
            commit_type = max(type_counts, key=type_counts.get)
            if commit_type == 'test':
                commit_type = 'test'
            elif commit_type == 'docs':
                commit_type = 'docs'
            elif commit_type == 'config':
                commit_type = 'config'
            elif commit_type == 'ci':
                commit_type = 'ci'
            elif commit_type == 'build':
                commit_type = 'build'
            elif commit_type == 'release':
                commit_type = 'chore'
        
        # Generate description based on operations
        if added_files and not modified_files and not deleted_files:
            if len(added_files) == 1:
                description_parts.append(f"Add {Path(added_files[0]).name}")
            else:
                description_parts.append(f"Add {len(added_files)} new files")
        elif modified_files and not added_files and not deleted_files:
            if len(modified_files) == 1:
                description_parts.append(f"Update {Path(modified_files[0]).name}")
            else:
                description_parts.append(f"Update {len(modified_files)} files")
        elif deleted_files and not added_files and not modified_files:
            if len(deleted_files) == 1:
                description_parts.append(f"Remove {Path(deleted_files[0]).name}")
            else:
                description_parts.append(f"Remove {len(deleted_files)} files")
        else:
            # Mixed operations
            ops = []
            if added_files:
                ops.append(f"add {len(added_files)}")
            if modified_files:
                ops.append(f"update {len(modified_files)}")
            if deleted_files:
                ops.append(f"remove {len(deleted_files)}")
            description_parts.append(f"Multiple changes ({', '.join(ops)} files)")
        
        # Generate the commit message
        if commit_type == 'feat' and not description_parts:
            description_parts = ["Implement new functionality"]
        
        main_description = description_parts[0] if description_parts else "Update repository"
        
        # Generate scope if appropriate
        common_dirs = set()
        for filename in self.staged_files:
            parts = Path(filename).parts
            if len(parts) > 1:
                common_dirs.add(parts[0])
        
        if len(common_dirs) == 1:
            scope = f"({list(common_dirs)[0]})"
        
        commit_message = f"{commit_type}{scope}: {main_description}"
        
        # Add detailed bullet points for multiple files
        if len(self.staged_files) > 1:
            commit_message += "\n"
            if added_files:
                commit_message += f"\n- Add {len(added_files)} new file(s)"
            if modified_files:
                commit_message += f"\n- Update {len(modified_files)} existing file(s)"
            if deleted_files:
                commit_message += f"\n- Remove {len(deleted_files)} file(s)"
        
        return commit_message
    
    def edit_commit_message(self, initial_message):
        """Allow user to edit commit message"""
        print(f"\n💭 Generated commit message:")
        print("─" * 50)
        print(initial_message)
        print("─" * 50)
        
        response = input("\n✏️  Edit this message? (y/n/show): ").strip().lower()
        
        if response == 'show':
            # Show what files will be committed
            print("\n📋 Files to be committed:")
            for file in self.staged_files:
                print(f"   ✅ {file}")
            response = input("\nEdit the commit message? (y/n): ").strip().lower()
        
        if response in ['y', 'yes']:
            # Create temporary file for editing
            with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
                f.write(initial_message)
                temp_file = f.name
            
            # Open editor
            editor = os.environ.get('EDITOR', 'nano')
            try:
                subprocess.run([editor, temp_file], check=True)
                
                # Read edited message
                with open(temp_file, 'r') as f:
                    edited_message = f.read().strip()
                
                # Clean up
                os.unlink(temp_file)
                
                # Validate message
                if not edited_message or not edited_message.strip():
                    print("❌ Empty commit message. Using generated message.")
                    return initial_message
                
                # Remove non-printable characters except newlines and tabs
                cleaned_message = ''.join(char for char in edited_message 
                                        if char.isprintable() or char in '\n\t')
                
                return cleaned_message
                
            except Exception as e:
                print(f"❌ Error editing message: {e}")
                os.unlink(temp_file)
                return initial_message
        
        return initial_message
    
    def perform_commit(self, message):
        """Perform the actual git commit"""
        print(f"\n🚀 Committing changes...")
        
        # Write message to temporary file (avoids shell quoting issues)
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write(message)
            temp_file = f.name
        
        try:
            # Perform commit
            commit_result = self.run_git_command(['commit', '-F', temp_file], check=False)
            os.unlink(temp_file)
            
            if commit_result and commit_result.returncode == 0:
                # Extract commit hash
                hash_result = self.run_git_command(['rev-parse', 'HEAD'])
                if hash_result:
                    self.commit_hash = hash_result.stdout.strip()[:8]
                
                print(f"✅ Commit successful: {self.commit_hash}")
                return True
            else:
                print("❌ Commit failed")
                if commit_result:
                    print(f"   Error: {commit_result.stderr}")
                return False
                
        except Exception as e:
            print(f"❌ Commit error: {e}")
            os.unlink(temp_file)
            return False
    
    def perform_push(self):
        """Push changes to remote repository"""
        print(f"\n📤 Pushing to remote repository...")
        
        # Check if we have a remote
        remote_result = self.run_git_command(['remote'])
        if not remote_result or not remote_result.stdout.strip():
            print("⚠️  No remote repository configured. Skipping push.")
            return True
        
        # Check current branch
        branch_result = self.run_git_command(['branch', '--show-current'])
        if not branch_result:
            print("❌ Could not determine current branch")
            return False
        
        current_branch = branch_result.stdout.strip()
        
        # Perform push
        push_result = self.run_git_command(['push', 'origin', current_branch], check=False)
        
        if push_result and push_result.returncode == 0:
            print(f"✅ Successfully pushed to origin/{current_branch}")
            return True
        else:
            print(f"❌ Push failed")
            if push_result and push_result.stderr:
                print(f"   Error: {push_result.stderr}")
            return False
    
    def rollback_changes(self):
        """Rollback changes if something went wrong"""
        print("\n🔄 Rolling back changes...")
        
        if self.commit_hash:
            # Reset to previous commit
            reset_result = self.run_git_command(['reset', '--soft', 'HEAD~1'], check=False)
            if reset_result and reset_result.returncode == 0:
                print("✅ Commit rolled back successfully")
            else:
                print("❌ Failed to rollback commit")
        
        # Unstage any staged files
        if self.staged_files:
            unstage_result = self.run_git_command(['reset', 'HEAD'] + self.staged_files, check=False)
            if unstage_result and unstage_result.returncode == 0:
                print("✅ Files unstaged successfully")
            else:
                print("❌ Failed to unstage files")
    
    def run(self):
        """Main workflow execution"""
        print("🚀 Beacon Professional Git Commit Workflow")
        print("=" * 50)
        
        # Step 1: Verify git repository
        if not self.check_git_repo():
            return False
        
        # Step 2: Analyze repository status
        if not self.analyze_repo_status():
            return False
        
        # Check if there's anything to commit
        if not self.staged_files and not self.modified_files and not self.untracked_files:
            print("\n✅ Repository is clean - nothing to commit")
            return True
        
        try:
            # Step 3: Handle modified tracked files
            if not self.handle_modified_files():
                return False
            
            # Step 4: Handle untracked files
            if not self.handle_untracked_files():
                return False
            
            # Check if we have anything staged after handling files
            if not self.staged_files:
                print("\n⚠️  No files staged for commit")
                return True
            
            # Step 5: Generate and edit commit message
            initial_message = self.generate_intelligent_commit_message()
            final_message = self.edit_commit_message(initial_message)
            
            # Step 6: Perform commit
            if not self.perform_commit(final_message):
                return False
            
            # Step 7: Push to remote
            if not self.perform_push():
                print("⚠️  Commit successful but push failed")
                rollback = input("🤔 Rollback commit? (y/n): ").strip().lower()
                if rollback in ['y', 'yes']:
                    self.rollback_changes()
                    return False
                else:
                    print("💡 You can manually push later with: git push")
            
            # Step 8: Success output
            print(f"\n🎉 Workflow completed successfully!")
            print(f"   📝 Commit: {self.commit_hash}")
            print(f"   📁 Files: {len(self.staged_files)}")
            print(f"   📤 Pushed: ✅")
            return True
            
        except KeyboardInterrupt:
            print(f"\n\n⚠️  Workflow interrupted by user")
            rollback = input("🤔 Rollback any changes? (y/n): ").strip().lower()
            if rollback in ['y', 'yes']:
                self.rollback_changes()
            return False
        except Exception as e:
            print(f"\n❌ Unexpected error: {e}")
            self.rollback_changes()
            return False

def main():
    if '--help' in sys.argv or '-h' in sys.argv:
        print("beacon-git-commit.py - Professional Git Workflow")
        print()
        print("Intelligent git workflow with:")
        print("  • Smart handling of modified and untracked files")
        print("  • Intelligent commit message generation")
        print("  • Safe commit and push with rollback on errors")
        print("  • Professional output and error handling")
        print()
        print("Usage: python3 beacon-git-commit.py")
        return
    
    workflow = BeaconGitCommit()
    success = workflow.run()
    
    if not success:
        sys.exit(1)

if __name__ == '__main__':
    main()