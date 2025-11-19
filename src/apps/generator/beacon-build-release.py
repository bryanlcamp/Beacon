#!/usr/bin/env python3
"""
Beacon Release Build Script
Builds the Beacon project in release mode with full optimizations.
"""

import subprocess
import shutil
from pathlib import Path

def main():
    # Get project root (3 levels up from this script: generator -> apps -> src -> root)
    project_root = Path(__file__).parent.parent.parent.parent
    build_dir = project_root / "build-release"
    bin_release_dir = project_root / "bin" / "release"
    
    print("🧹 Cleaning build directory...")
    if build_dir.exists():
        shutil.rmtree(build_dir)
    
    # Create directories
    build_dir.mkdir(exist_ok=True)
    bin_release_dir.mkdir(parents=True, exist_ok=True)
    
    print("🔧 Configuring CMake for Release build...")
    cmake_args = [
        "cmake", "-B", str(build_dir), "-S", str(project_root),
        "-DCMAKE_BUILD_TYPE=Release",
        "-DCMAKE_CXX_FLAGS=-O3 -DNDEBUG -march=native -flto",
        "-DCMAKE_EXE_LINKER_FLAGS=-flto"
    ]
    
    subprocess.run(cmake_args, check=True, cwd=project_root)
    
    print("🔨 Building generator in Release mode...")
    subprocess.run(["cmake", "--build", str(build_dir), "--target", "generator"], 
                   check=True, cwd=project_root)
    
    # Copy binary to bin/release
    generator_binary = build_dir / "src" / "apps" / "generator" / "generator"
    if generator_binary.exists():
        shutil.copy2(generator_binary, bin_release_dir / "generator")
        print(f"✅ Release binary copied to {bin_release_dir / 'generator'}")
    else:
        print("❌ Generator binary not found!")
        return 1
    
    print("🧹 Cleaning up build directory...")
    if build_dir.exists():
        shutil.rmtree(build_dir)
    
    print("🎉 Release build complete!")
    return 0

if __name__ == "__main__":
    exit(main())