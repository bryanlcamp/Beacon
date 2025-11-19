#!/usr/bin/env python3
"""
Beacon Playback Clean Script
Cleans all playback build artifacts and binaries.
"""

import shutil
from pathlib import Path

def main():
    # Get project root (4 levels up from this script: scripts -> playback -> apps -> src -> root)
    project_root = Path(__file__).parent.parent.parent.parent.parent
    
    dirs_to_clean = [
        project_root / "build" / "src" / "apps" / "playback",
        project_root / "bin" / "debug" / "playback", 
        project_root / "bin" / "release" / "playback",
    ]
    
    files_to_clean = [
        project_root / "bin" / "debug" / "playback",
        project_root / "bin" / "release" / "playback",
    ]
    
    print("🧹 Cleaning all playback build artifacts and binaries...")
    
    for dir_path in dirs_to_clean:
        if dir_path.exists():
            shutil.rmtree(dir_path)
            print(f"🗑️  Removed directory: {dir_path}")
    
    for file_path in files_to_clean:
        if file_path.exists():
            file_path.unlink()
            print(f"🗑️  Removed file: {file_path}")
    
    print("✨ Playback clean complete!")
    return 0

if __name__ == "__main__":
    exit(main())