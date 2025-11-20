#!/usr/bin/env python3
"""
BeaconRelease.py - Simple Professional Release Management
Creates releases following CamelCase naming conventions
"""

import subprocess
import sys
import os
from pathlib import Path
from datetime import datetime

class BeaconRelease:
    def __init__(self):
        self.repo_root = Path(__file__).parent  # BeaconRelease.py is in the repo root
        self.version_file = self.repo_root / "VERSION"
    
    def GetCurrentVersion(self):
        """Get current version from VERSION file"""
        if self.version_file.exists():
            return self.version_file.read_text().strip()
        return "0.0.0"
    
    def GetNextVersion(self, release_type):
        """Calculate next version based on type (major|minor|patch)"""
        current = self.GetCurrentVersion()
        # Remove any pre-release suffix (-beta, -alpha, etc.)
        base_version = current.split('-')[0]
        major, minor, patch = map(int, base_version.split('.'))
        
        if release_type == 'major':
            return f"{major + 1}.0.0"
        elif release_type == 'minor':
            return f"{major}.{minor + 1}.0"
        elif release_type == 'patch':
            return f"{major}.{minor}.{patch + 1}"
        else:
            raise ValueError(f"Invalid release type: {release_type}. Use: major, minor, patch")
    
    def UpdateVersion(self, new_version):
        """Update VERSION file with new version"""
        self.version_file.write_text(new_version + '\n')
        print(f"✅ Updated VERSION: {self.GetCurrentVersion()} → {new_version}")
    
    def CreateGitTag(self, version):
        """Create annotated git tag for release"""
        tag_name = f"v{version}"
        message = f"Release {version}"
        
        try:
            subprocess.run(['git', 'tag', '-a', tag_name, '-m', message], check=True)
            print(f"✅ Created git tag: {tag_name}")
            return True
        except subprocess.CalledProcessError:
            print(f"❌ Failed to create git tag: {tag_name}")
            return False
    
    def TriggerCiBuild(self, version):
        """Trigger CI/CD build by creating and pushing git tag"""
        print("🚀 Triggering CI/CD build...")
        tag_name = f"v{version}"
        
        # Create tag locally
        if not self.CreateGitTag(version):
            return False
            
        # Push tag to trigger CI/CD
        try:
            subprocess.run(['git', 'push', 'origin', tag_name], check=True)
            print(f"✅ Pushed tag {tag_name} - CI/CD build triggered")
            print(f"📋 Monitor CI/CD: https://github.com/bryanlcamp/Beacon/actions")
            return True
        except subprocess.CalledProcessError:
            print(f"❌ Failed to push tag {tag_name}")
            return False
    
    def SafetyChecks(self):
        """Essential safety checks before creating a release"""
        errors = []
        
        # Check 1: Are we on main branch?
        try:
            result = subprocess.run(['git', 'branch', '--show-current'], 
                                  capture_output=True, text=True, check=True)
            current_branch = result.stdout.strip()
            if current_branch != 'main':
                errors.append(f"❌ Not on main branch (currently on '{current_branch}')")
        except subprocess.CalledProcessError:
            errors.append("❌ Unable to determine current git branch")
        
        # Check 2: Are there uncommitted changes?
        try:
            result = subprocess.run(['git', 'status', '--porcelain'], 
                                  capture_output=True, text=True, check=True)
            if result.stdout.strip():
                errors.append("❌ Uncommitted changes detected")
        except subprocess.CalledProcessError:
            errors.append("❌ Unable to check git status")
        
        return errors
    
    def CreateRelease(self, release_type, build_binaries=True, create_tag=True, commit_version=True):
        """Create a complete release"""
        current = self.GetCurrentVersion()
        new_version = self.GetNextVersion(release_type)
        
        print(f"🚀 Creating Beacon Release: {current} → {new_version}")
        print()
        
        # SAFETY CHECKS FIRST
        print("🔍 Running safety checks...")
        safety_errors = self.SafetyChecks()
        
        if safety_errors:
            print()
            print("🚫 RELEASE BLOCKED - Safety checks failed:")
            for error in safety_errors:
                print(f"   {error}")
            print()
            print("Please fix these issues and try again.")
            return False
        
        print("✅ All safety checks passed!")
        print()
        
        # Final confirmation
        print(f"📋 Release Summary:")
        print(f"   Version: {current} → {new_version}")
        print(f"   Branch: main")
        print(f"   Actions: Update VERSION, commit, build binaries, create git tag")
        print()
        
        if '--yes' not in sys.argv:
            response = input("Continue with release? (yes/no): ").strip().lower()
            if response not in ['yes', 'y']:
                print("🚫 Release cancelled by user")
                return False
        
        print()
        
        # Update version file
        self.UpdateVersion(new_version)
        
        # Commit version change
        if commit_version:
            try:
                subprocess.run(['git', 'add', 'VERSION'], check=True)
                subprocess.run(['git', 'commit', '-m', f'Release v{new_version}'], check=True)
                print(f"✅ Committed version update")
            except subprocess.CalledProcessError:
                print("❌ Failed to commit version update")
                return False
        
        # Trigger CI/CD build (creates tag and pushes)
        if create_tag and not self.TriggerCiBuild(new_version):
            return False
        
        print(f"\n🎉 Release v{new_version} created successfully!")
        print(f"\n📋 Next Steps:")
        print(f"   1. Monitor CI/CD build: https://github.com/bryanlcamp/Beacon/actions")
        print(f"   2. Wait for CI/CD to complete (builds binaries and runs tests)")
        print(f"   3. Download artifacts from successful CI/CD run")
        print(f"   4. Create GitHub Release: https://github.com/bryanlcamp/Beacon/releases/new?tag=v{new_version}")
        print(f"   5. Attach CI-built binaries and write release notes")
        print(f"\n💡 Professional releases use CI/CD-built binaries for reproducibility!")
        
        return True
    
    def ShowVersion(self):
        """Show current version"""
        version = self.GetCurrentVersion()
        print(f"Current Beacon Version: {version}")
        
        # Show some additional info
        try:
            result = subprocess.run(['git', 'log', '--oneline', '-1'], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                commit = result.stdout.strip()
                print(f"Latest Commit: {commit}")
        except:
            pass

def main():
    if len(sys.argv) < 2:
        print("BeaconRelease.py - Professional Release Management")
        print()
        print("Usage:")
        print("  python3 BeaconRelease.py version          # Show current version")
        print("  python3 BeaconRelease.py major            # Create major release (1.0.0 → 2.0.0)")
        print("  python3 BeaconRelease.py minor            # Create minor release (1.0.0 → 1.1.0)")
        print("  python3 BeaconRelease.py patch            # Create patch release (1.0.0 → 1.0.1)")
        print()
        print("Examples:")
        print("  python3 BeaconRelease.py version          # Shows: Current Beacon Version: 1.0.0-beta")
        print("  python3 BeaconRelease.py minor            # Creates: 1.1.0 with git tag and binaries")
        sys.exit(1)
    
    release_manager = BeaconRelease()
    command = sys.argv[1]
    
    if command == 'version':
        release_manager.ShowVersion()
    elif command in ['major', 'minor', 'patch']:
        try:
            release_manager.CreateRelease(command)
        except Exception as e:
            print(f"❌ Release failed: {e}")
            sys.exit(1)
    else:
        print(f"❌ Unknown command: {command}")
        print("Use: version, major, minor, or patch")
        sys.exit(1)

if __name__ == '__main__':
    main()