#!/usr/bin/env python3
"""
Beacon Clean Script
Cleans all build artifacts and binaries.
"""

import shutil
from pathlib import Path

def main():
    # Get project root (4 levels up from this script: scripts -> generator -> apps -> src -> root)
    project_root = Path(__file__).parent.parent.parent.parent.parent
    
    dirs_to_clean = [
        project_root / "build",
        project_root / "bin" / "debug", 
        project_root / "bin" / "release",
        project_root / "bin"  # Remove empty bin directory if it exists
    ]
    
    print("🧹 Cleaning all build artifacts and binaries...")
    
    for dir_path in dirs_to_clean:
        if dir_path.exists():
            if dir_path.name == "bin" and any(dirs_to_clean[:-1]):
                # Only remove bin if it's empty after cleaning subdirs
                try:
                    dir_path.rmdir()  # Only removes if empty
                    print(f"🗑️  Removed empty directory: {dir_path}")
                except OSError:
                    pass  # Directory not empty, that's fine
            else:
                shutil.rmtree(dir_path)
                print(f"🗑️  Removed: {dir_path}")
    
    print("✨ Clean complete!")
    return 0

if __name__ == "__main__":
    exit(main())