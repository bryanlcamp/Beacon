#!/usr/bin/env python3
"""
Beacon Web Structure Verification Script
Helps identify duplicate files and verify clean structure
"""

import os
import glob
from pathlib import Path

def force_cleanup_now():
    """Force immediate cleanup of known duplicate files"""
    base_dir = Path(__file__).parent
    print(f"🔥 FORCE CLEANUP - Deleting known duplicates immediately...")
    
    # Known problem files that MUST be deleted
    problem_files = [
        "docs/documentation-hub.html",
        "apps/generator.html", 
        "docs/apps/generator.html",
        "documentation-hub.html"
    ]
    
    deleted_count = 0
    for file_path in problem_files:
        full_path = base_dir / file_path
        if full_path.exists():
            try:
                full_path.unlink()
                print(f"  🗑️ DELETED: {file_path}")
                deleted_count += 1
            except Exception as e:
                print(f"  ❌ FAILED to delete {file_path}: {e}")
        else:
            print(f"  ✅ Already gone: {file_path}")
    
    # Clean up empty directories
    empty_dirs = [
        base_dir / "docs",
        base_dir / "apps"
    ]
    
    for dir_path in empty_dirs:
        if dir_path.exists():
            try:
                if not any(dir_path.iterdir()):  # Only if empty
                    dir_path.rmdir()
                    print(f"  🗑️ REMOVED empty directory: {dir_path.name}/")
                else:
                    print(f"  ⚠️ Directory not empty: {dir_path.name}/")
            except Exception as e:
                print(f"  ⚠️ Could not remove {dir_path.name}/: {e}")
    
    print(f"\n🎉 FORCE CLEANUP COMPLETE - Deleted {deleted_count} files!")
    return deleted_count > 0

def verify_beacon_structure():
    """Verify the Beacon web structure is clean"""
    
    base_dir = Path(__file__).parent
    print(f"🔍 Checking Beacon structure in: {base_dir}")
    
    # Files that should NOT exist (duplicates/old files)
    forbidden_files = [
        "docs/documentation-hub.html",
        "documentation-hub.html", 
        "apps/generator.html",
        "web/documentation-hub.html"
    ]
    
    # Files that SHOULD exist (single source of truth)
    required_files = [
        "index.html",  # Root landing page
        "web/command-center/index.html",
        "web/apps/dataset-generator/index.html"
    ]
    
    print("\n❌ CHECKING FOR FORBIDDEN FILES:")
    found_forbidden = []
    for file_path in forbidden_files:
        full_path = base_dir / file_path
        if full_path.exists():
            found_forbidden.append(file_path)
            print(f"  ❌ FOUND: {file_path}")
        else:
            print(f"  ✅ MISSING (good): {file_path}")
    
    print("\n✅ CHECKING FOR REQUIRED FILES:")
    missing_required = []
    for file_path in required_files:
        full_path = base_dir / file_path
        if full_path.exists():
            print(f"  ✅ FOUND: {file_path}")
        else:
            missing_required.append(file_path)
            print(f"  ❌ MISSING: {file_path}")
    
    # Search for any stray documentation-hub files
    print("\n🔍 SEARCHING FOR ANY '*documentation-hub*' FILES:")
    doc_hub_files = list(base_dir.glob("**/documentation-hub*"))
    doc_hub_files.extend(list(base_dir.glob("**/*documentation-hub*")))
    # Remove duplicates
    doc_hub_files = list(set(doc_hub_files))
    
    if doc_hub_files:
        print("  ❌ FOUND DOCUMENTATION-HUB FILES:")
        for f in doc_hub_files:
            print(f"    - {f.relative_to(base_dir)}")
    else:
        print("  ✅ NO documentation-hub files found")
    
    # Search for any stray generator.html files
    print("\n🔍 SEARCHING FOR ANY '*generator.html' FILES:")
    generator_files = list(base_dir.glob("**/generator.html"))
    
    if generator_files:
        print("  ❌ FOUND GENERATOR.HTML FILES:")
        for f in generator_files:
            print(f"    - {f.relative_to(base_dir)}")
    else:
        print("  ✅ NO stray generator.html files found")
    
    # Summary
    print(f"\n📊 SUMMARY:")
    print(f"  Forbidden files found: {len(found_forbidden)}")
    print(f"  Required files missing: {len(missing_required)}")
    print(f"  Documentation-hub strays: {len(doc_hub_files)}")
    print(f"  Generator.html strays: {len(generator_files)}")
    
    # NEW: Auto-cleanup functionality
    all_problem_files = []
    all_problem_files.extend([base_dir / f for f in found_forbidden])
    all_problem_files.extend(doc_hub_files)
    all_problem_files.extend(generator_files)
    # Remove duplicates
    all_problem_files = list(set(all_problem_files))
    
    if all_problem_files:
        print(f"\n🧹 CLEANUP REQUIRED:")
        print(f"  Files to delete: {len(all_problem_files)}")
        for f in all_problem_files:
            print(f"    - {f.relative_to(base_dir)}")
        
        response = input(f"\n❓ Delete these {len(all_problem_files)} duplicate files? [y/N]: ")
        if response.lower().strip() in ['y', 'yes']:
            cleanup_files(all_problem_files, base_dir)
            print(f"\n🔄 Re-verifying structure after cleanup...")
            return verify_beacon_structure()  # Re-run verification
        else:
            print(f"❌ STRUCTURE IS NOT CLEAN!")
            return False
    else:
        print(f"\n✅ STRUCTURE IS CLEAN!")
        return True

def cleanup_files(files_to_delete, base_dir):
    """Delete the specified files and empty directories"""
    import shutil
    
    print(f"\n🧹 CLEANING UP DUPLICATE FILES:")
    
    for file_path in files_to_delete:
        try:
            if file_path.exists():
                file_path.unlink()
                print(f"  🗑️ Deleted: {file_path.relative_to(base_dir)}")
        except Exception as e:
            print(f"  ❌ Failed to delete {file_path.relative_to(base_dir)}: {e}")
    
    # Clean up empty directories
    empty_dirs = []
    for root, dirs, files in os.walk(base_dir):
        for directory in dirs:
            dir_path = Path(root) / directory
            if dir_path.exists() and not any(dir_path.iterdir()):
                empty_dirs.append(dir_path)
    
    if empty_dirs:
        print(f"\n🧹 CLEANING UP EMPTY DIRECTORIES:")
        for dir_path in empty_dirs:
            try:
                if dir_path.name in ['docs', 'apps'] and dir_path.parent == base_dir:
                    dir_path.rmdir()
                    print(f"  🗑️ Removed empty directory: {dir_path.relative_to(base_dir)}")
            except Exception as e:
                print(f"  ⚠️ Could not remove {dir_path.relative_to(base_dir)}: {e}")
    
    print(f"🎉 CLEANUP COMPLETE!")

if __name__ == "__main__":
    # First, force cleanup known problem files
    print("=" * 60)
    print("🚀 BEACON CLEANUP - FORCE MODE")
    print("=" * 60)
    
    force_cleanup_now()
    
    print("\n" + "=" * 60)
    print("🔍 VERIFICATION AFTER CLEANUP")
    print("=" * 60)
    
    verify_beacon_structure()
