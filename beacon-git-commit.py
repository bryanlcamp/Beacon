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
import json

class GitProtectionError(Exception):
    """Custom exception for git protection violations"""
    pass

class BeaconGitCommit:
    def __init__(self):
        self.repo_root = Path.cwd()
        self.staged_files = []
        self.modified_files = []
        self.untracked_files = []
        self.commit_hash = None
        self.config = self.load_config()
        
        # Load settings from config
        protection = self.config.get('protection_settings', {})
        self.protected_branches = protection.get('protected_branches', ['main', 'master'])
        self.protected_files = protection.get('protected_files', ['VERSION'])
        self.max_file_size_mb = protection.get('max_file_size_mb', 10)
        self.max_commit_files = protection.get('max_commit_files', 50)
        self.dangerous_patterns = [
            re.compile(pattern, re.IGNORECASE) 
            for pattern in self.config.get('security_patterns', [])
        ]
        
    def load_config(self):
        """Load configuration from .beacon-git-config.json"""
        config_file = self.repo_root / '.beacon-git-config.json'
        
        if config_file.exists():
            try:
                with open(config_file, 'r') as f:
                    config = json.load(f)
                print(f"✅ Loaded configuration from {config_file.name}")
                return config
            except (json.JSONDecodeError, IOError) as e:
                print(f"⚠️  Config file error: {e}")
                print("   Using default settings")
        
        # Return default config
        return {
            'protection_settings': {
                'enabled': True,
                'protected_branches': ['main', 'master'],
                'protected_files': ['VERSION'],
                'max_file_size_mb': 10,
                'max_commit_files': 50
            },
            'security_patterns': [
                r'password\s*=',
                r'api[_-]?key\s*=', 
                r'secret\s*=',
                r'token\s*='
            ]
        }
        
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
    
    def check_professional_protections(self):
        """Comprehensive professional protection checks"""
        protection_settings = self.config.get('protection_settings', {})
        
        if not protection_settings.get('enabled', True):
            print("🔓 Protection checks disabled")
            return True
            
        print("🔐 Running professional protection checks...")
        
        # 1. Check current branch protection
        if protection_settings.get('branch_protection_enabled', True):
            current_branch_result = self.run_git_command(['branch', '--show-current'])
            if current_branch_result:
                current_branch = current_branch_result.stdout.strip()
                if current_branch in self.protected_branches:
                    print(f"⚠️  WARNING: You're on protected branch '{current_branch}'")
                    confirm = input("🤔 Are you authorized to commit to this branch? (yes/no): ").strip().lower()
                    if confirm != 'yes':
                        raise GitProtectionError(f"Commit to protected branch '{current_branch}' not authorized")
                    print("✅ Protected branch access confirmed")
        
        # 2. Check for uncommitted changes to protected files
        if self.staged_files or self.modified_files:
            all_changed_files = self.staged_files + self.modified_files
            protected_matches = []
            
            for file_path in all_changed_files:
                for pattern in self.protected_files:
                    if '*' in pattern:
                        # Handle wildcard patterns
                        import fnmatch
                        if fnmatch.fnmatch(file_path, pattern):
                            protected_matches.append(file_path)
                    elif pattern in file_path:
                        protected_matches.append(file_path)
            
            if protected_matches:
                print(f"🚨 CRITICAL: Changes detected to {len(protected_matches)} protected file(s):")
                for file_path in protected_matches:
                    print(f"   🔒 {file_path}")
                
                confirm = input("🚨 Confirm changes to protected files (type 'CONFIRM'): ").strip()
                if confirm != 'CONFIRM':
                    raise GitProtectionError("Changes to protected files not confirmed")
                print("✅ Protected file changes confirmed")
        
        # 3. Check for secrets/credentials
        self.check_for_secrets()
        
        # 4. Check file sizes and commit size
        if protection_settings.get('size_limits_enabled', True):
            self.check_commit_size_limits()
        
        # 5. Build verification if enabled
        if protection_settings.get('build_verification_enabled', False):
            if not self.run_build_verification():
                raise GitProtectionError("Build verification failed - commit blocked")
        
        # 5. Check repository health
        if protection_settings.get('repo_health_check_enabled', True):
            self.check_repo_health()
        
        print("✅ All protection checks passed")
        return True
    
    def check_for_secrets(self):
        """Scan for potential secrets in staged content"""
        if not self.config.get('protection_settings', {}).get('security_scan_enabled', True):
            return
            
        print("🔍 Scanning for potential secrets...")
        
        if not self.staged_files:
            return
        
        # Get diff of staged content
        diff_result = self.run_git_command(['diff', '--cached'])
        if not diff_result:
            return
        
        diff_content = diff_result.stdout
        secrets_found = []
        
        for pattern in self.dangerous_patterns:
            matches = pattern.finditer(diff_content)
            for match in matches:
                # Get line context
                lines = diff_content[:match.start()].count('\n')
                secrets_found.append(f"Line {lines}: {pattern.pattern}")
        
        if secrets_found:
            print(f"🚨 SECURITY ALERT: Potential secrets detected!")
            for secret in secrets_found:
                print(f"   🔑 {secret}")
            
            print("\n⚠️  Review these potential security issues:")
            print("   • Remove any real passwords, API keys, or tokens")
            print("   • Use environment variables or config files")
            print("   • Add sensitive files to .gitignore")
            
            confirm = input("\n🛡️  Confirm no real secrets are being committed (type 'SAFE'): ").strip()
            if confirm != 'SAFE':
                raise GitProtectionError("Potential secrets detected - commit aborted for security")
            
            print("✅ Security review completed")
    
    def check_commit_size_limits(self):
        """Check file sizes and overall commit limits"""
        if not self.staged_files:
            return
        
        print(f"📏 Checking commit size limits...")
        
        # Check number of files
        if len(self.staged_files) > self.max_commit_files:
            print(f"⚠️  Large commit: {len(self.staged_files)} files (limit: {self.max_commit_files})")
            confirm = input("🤔 Proceed with large commit? (y/n): ").strip().lower()
            if confirm != 'y':
                raise GitProtectionError(f"Commit exceeds file limit ({self.max_commit_files} files)")
        
        # Check individual file sizes
        large_files = []
        for file_path in self.staged_files:
            if os.path.exists(file_path):
                size_mb = os.path.getsize(file_path) / (1024 * 1024)
                if size_mb > self.max_file_size_mb:
                    large_files.append(f"{file_path} ({size_mb:.1f}MB)")
        
        if large_files:
            print(f"⚠️  Large files detected:")
            for file_info in large_files:
                print(f"   📁 {file_info}")
            
            confirm = input("🤔 Commit large files? (y/n): ").strip().lower()
            if confirm != 'y':
                raise GitProtectionError("Large files detected - commit aborted")
        
        print("✅ Size limits check passed")
    
    def check_repo_health(self):
        """Check overall repository health"""
        print("🏥 Checking repository health...")
        
        # Check for merge conflicts
        merge_head = self.repo_root / '.git' / 'MERGE_HEAD'
        if merge_head.exists():
            print("🚨 MERGE IN PROGRESS: Repository has unresolved merge")
            raise GitProtectionError("Cannot commit during active merge - resolve conflicts first")
        
        # Check for rebase in progress
        rebase_dir = self.repo_root / '.git' / 'rebase-apply'
        if rebase_dir.exists():
            print("🚨 REBASE IN PROGRESS: Repository has active rebase")
            raise GitProtectionError("Cannot commit during active rebase - complete rebase first")
        
        # Check remote connectivity (non-blocking)
        remote_result = self.run_git_command(['ls-remote', '--exit-code', 'origin'], check=False)
        if remote_result and remote_result.returncode != 0:
            print("⚠️  WARNING: Cannot reach remote repository")
            print("   Push may fail - check network connection")
        
        print("✅ Repository health check passed")
    
    def run_build_verification(self):
        """Run build and test verification before commit"""
        print("🔧 Running build verification...")
        
        # Check for common build files to determine build system
        build_commands = []
        
        # CMake project
        if (self.repo_root / 'CMakeLists.txt').exists():
            print("   📋 Detected CMake project")
            if (self.repo_root / 'build').exists():
                build_commands.append((['cmake', '--build', 'build'], 'CMake build'))
            else:
                print("   ⚠️  Build directory not found, configuring...")
                config_result = subprocess.run(['cmake', '-B', 'build', '-S', '.'],
                                             capture_output=True, text=True, timeout=60)
                if config_result.returncode == 0:
                    build_commands.append((['cmake', '--build', 'build'], 'CMake build'))
                else:
                    print(f"   ❌ CMake configuration failed:")
                    print(f"   {config_result.stderr.strip()[:200]}")
                    return False
        
        # Python project  
        elif (self.repo_root / 'setup.py').exists() or (self.repo_root / 'pyproject.toml').exists():
            print("   📋 Detected Python project")
            # Basic syntax check
            python_files = list(self.repo_root.glob('**/*.py'))
            if python_files:
                for py_file in python_files[:10]:  # Limit check
                    result = subprocess.run(['python3', '-m', 'py_compile', str(py_file)],
                                          capture_output=True, text=True)
                    if result.returncode != 0:
                        print(f"   ❌ Python syntax error in {py_file}:")
                        print(f"   {result.stderr.strip()[:200]}")
                        return False
                print(f"   ✅ Python syntax check passed ({len(python_files)} files)")
        
        # Node.js project
        elif (self.repo_root / 'package.json').exists():
            print("   📋 Detected Node.js project")
            build_commands.append((['npm', 'run', 'build'], 'npm build'))
        
        # Generic make
        elif (self.repo_root / 'Makefile').exists():
            print("   📋 Detected Makefile")
            build_commands.append((['make'], 'Make build'))
        
        if not build_commands and not any(p.exists() for p in [
            self.repo_root / 'setup.py', self.repo_root / 'pyproject.toml']):
            print("   ⚠️  No recognized build system found, skipping")
            return True
        
        # Run build commands
        for command, description in build_commands:
            print(f"   🔨 Running: {description}")
            try:
                result = subprocess.run(command, capture_output=True, text=True,
                                      timeout=180, cwd=self.repo_root)
                
                if result.returncode == 0:
                    print(f"   ✅ {description} passed")
                else:
                    print(f"   ❌ {description} FAILED")
                    
                    # Show error summary
                    if result.stderr:
                        error_lines = result.stderr.strip().split('\n')[:3]
                        print("   📄 First error:")
                        for line in error_lines:
                            if line.strip():
                                print(f"      {line.strip()[:80]}")
                    
                    print(f"\n🚫 Build verification failed")
                    print(f"   Run '{' '.join(command)}' for full details")
                    return False
                    
            except subprocess.TimeoutExpired:
                print(f"   ⏰ {description} timed out")
                return False
            except FileNotFoundError:
                print(f"   ⚠️  Command '{command[0]}' not found, skipping")
        
        print("✅ Build verification passed!")
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
            # Step 3: Professional protection checks
            if not self.check_professional_protections():
                return False
            
            # Step 4: Handle modified tracked files
            if not self.handle_modified_files():
                return False
            
            # Step 5: Handle untracked files
            if not self.handle_untracked_files():
                return False
            
            # Check if we have anything staged after handling files
            if not self.staged_files:
                print("\n⚠️  No files staged for commit")
                return True
            
            # Step 6: Final security scan after staging
            print("\n🔒 Final security scan...")
            self.check_for_secrets()
            
            # Step 7: Generate and edit commit message
            initial_message = self.generate_intelligent_commit_message()
            final_message = self.edit_commit_message(initial_message)
            
            # Step 8: Pre-commit validation
            if not self.validate_commit_message(final_message):
                return False
            
            # Step 9: Perform commit
            if not self.perform_commit(final_message):
                return False
            
            # Step 10: Push to remote
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
        except GitProtectionError as e:
            print(f"\n🚨 PROTECTION VIOLATION: {e}")
            print("🔒 Commit aborted for security/safety reasons")
            self.rollback_changes()
            return False
        except Exception as e:
            print(f"\n❌ Unexpected error: {e}")
            print("🔄 Rolling back for safety...")
            self.rollback_changes()
            return False
    
    def validate_commit_message(self, message):
        """Validate commit message meets professional standards"""
        print("📝 Validating commit message...")
        
        lines = message.strip().split('\n')
        if not lines:
            print("❌ Empty commit message")
            return False
        
        # Check first line (subject)
        subject = lines[0].strip()
        
        # Length check
        if len(subject) > 72:
            print(f"⚠️  Subject line too long ({len(subject)} chars, max 72)")
            confirm = input("🤔 Proceed with long subject? (y/n): ").strip().lower()
            if confirm != 'y':
                return False
        
        # Check conventional commit format (optional but recommended)
        conventional_pattern = r'^(feat|fix|docs|style|refactor|test|chore|ci|build)(\(.+\))?: .+'
        if not re.match(conventional_pattern, subject):
            print("💡 TIP: Consider using conventional commit format:")
            print("   feat: add new feature")
            print("   fix: resolve bug")
            print("   docs: update documentation")
            print("   etc.")
        
        # Check for TODO/FIXME in commit message
        if re.search(r'\b(TODO|FIXME|XXX|HACK)\b', message, re.IGNORECASE):
            print("⚠️  TODO/FIXME found in commit message")
            confirm = input("🤔 Commit with TODO/FIXME? (y/n): ").strip().lower()
            if confirm != 'y':
                return False
        
        print("✅ Commit message validation passed")
        return True

def main():
    if '--help' in sys.argv or '-h' in sys.argv:
        print("beacon-git-commit.py - Professional Git Workflow")
        print()
        print("Intelligent git workflow with:")
        print("  • Smart handling of modified and untracked files")
        print("  • Intelligent commit message generation")
        print("  • Professional protection and security checks")
        print("  • Safe commit and push with rollback on errors")
        print("  • Configurable protection settings")
        print()
        print("Usage:")
        print("  python3 beacon-git-commit.py           # Normal workflow")
        print("  python3 beacon-git-commit.py --bypass  # Emergency bypass mode")
        print("  python3 beacon-git-commit.py --config  # Show current configuration")
        print()
        print("Configuration:")
        print("  Edit .beacon-git-config.json to customize protection settings")
        return
    
    # Handle special flags
    if '--config' in sys.argv:
        workflow = BeaconGitCommit()
        print("📋 Current Configuration:")
        print("=" * 40)
        print(json.dumps(workflow.config, indent=2))
        return
    
    # Emergency bypass mode
    bypass_mode = '--bypass' in sys.argv
    if bypass_mode:
        print("🚨 EMERGENCY BYPASS MODE ACTIVATED")
        print("⚠️  All protection checks will be DISABLED")
        confirm = input("🤔 Are you sure you want to proceed? (type 'EMERGENCY'): ").strip()
        if confirm != 'EMERGENCY':
            print("❌ Bypass cancelled")
            return
        print("🔓 Protections bypassed - USE WITH EXTREME CAUTION")
    
    workflow = BeaconGitCommit()
    
    # Disable protections if bypass mode
    if bypass_mode:
        workflow.config['protection_settings']['enabled'] = False
        workflow.config['protection_settings']['security_scan_enabled'] = False
        workflow.config['protection_settings']['branch_protection_enabled'] = False
    
    success = workflow.run()
    
    if not success:
        sys.exit(1)

if __name__ == '__main__':
    main()