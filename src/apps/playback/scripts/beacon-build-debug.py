#!/usr/bin/env python3
"""
Beacon Playback Debug Build Script
Builds the debug version of the playback system with all debugging symbols.
"""

import subprocess
import sys
from pathlib import Path

def main():
    # Get project root (4 levels up from this script: scripts -> playback -> apps -> src -> root)
    project_root = Path(__file__).parent.parent.parent.parent.parent
    build_dir = project_root / "build"
    bin_dir = project_root / "bin" / "debug"
    
    print("🐛 Building Beacon playback (DEBUG)...")
    
    # Create directories if they don't exist
    build_dir.mkdir(exist_ok=True)
    bin_dir.mkdir(parents=True, exist_ok=True)
    
    try:
        # Configure with debug flags
        print("🔧 Configuring CMake for debug build...")
        result = subprocess.run([
            "cmake",
            "-DCMAKE_BUILD_TYPE=Debug",
            "-DCMAKE_CXX_FLAGS_DEBUG=-g -O0 -DDEBUG -fno-omit-frame-pointer",
            "-S", str(project_root),
            "-B", str(build_dir)
        ], cwd=project_root, check=True)
        
        # Build playback target
        print("🏗️  Building playback target...")
        result = subprocess.run([
            "cmake", "--build", str(build_dir), 
            "--target", "playback", 
            "--config", "Debug",
            "-j"
        ], cwd=project_root, check=True)
        
        # Copy binary to bin/debug
        source_binary = build_dir / "src" / "apps" / "playback" / "playback"
        dest_binary = bin_dir / "playback"
        
        if source_binary.exists():
            import shutil
            shutil.copy2(str(source_binary), str(dest_binary))
            print(f"📋 Copied binary to: {dest_binary}")
        else:
            print("⚠️  Warning: Binary not found at expected location")
        
        print("✅ Debug build complete!")
        print(f"🎯 Binary location: {dest_binary}")
        print("🐛 Debug symbols included for debugging")
        return 0
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Build failed with exit code: {e.returncode}")
        return 1
    except KeyboardInterrupt:
        print("\n⚠️  Build interrupted by user")
        return 130
    except Exception as e:
        print(f"💥 Unexpected error: {e}")
        return 1

if __name__ == "__main__":
    exit(main())