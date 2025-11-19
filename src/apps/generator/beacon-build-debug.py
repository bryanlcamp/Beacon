#!/usr/bin/env python3
"""
Beacon Debug Build Script
Builds the Beacon project in debug mode with sanitizers and symbols.
"""

import subprocess
import shutil
from pathlib import Path

def main():
    # Get paths relative to this script
    script_dir = Path(__file__).parent
    project_root = script_dir.parent.parent.parent
    build_dir = project_root / "build-debug"
    generator_bin_dir = script_dir / "bin" / "debug"
    
    # Also support global bin directory for backward compatibility
    global_bin_dir = project_root / "bin" / "debug"
    
    print("🧹 Cleaning build directory...")
    if build_dir.exists():
        shutil.rmtree(build_dir)
    
    # Create directories
    build_dir.mkdir(exist_ok=True)
    generator_bin_dir.mkdir(parents=True, exist_ok=True)
    global_bin_dir.mkdir(parents=True, exist_ok=True)
    
    print("🔧 Configuring CMake for Debug build...")
    cmake_args = [
        "cmake", "-B", str(build_dir), "-S", str(project_root),
        "-DCMAKE_BUILD_TYPE=Debug",
        "-DCMAKE_CXX_FLAGS=-fsanitize=address,undefined -g -O0 -Wall -Wextra",
        "-DCMAKE_EXE_LINKER_FLAGS=-fsanitize=address,undefined"
    ]
    
    subprocess.run(cmake_args, check=True, cwd=project_root)
    
    print("🔨 Building generator in Debug mode...")
    subprocess.run(["cmake", "--build", str(build_dir), "--target", "generator"], 
                   check=True, cwd=project_root)
    
    # Copy binary to both locations
    generator_binary = build_dir / "src" / "apps" / "generator" / "generator"
    if generator_binary.exists():
        # Copy to generator-specific directory (primary)
        shutil.copy2(generator_binary, generator_bin_dir / "generator")
        print(f"✅ Debug binary copied to {generator_bin_dir / 'generator'}")
        
        # Copy to global directory (backward compatibility)
        shutil.copy2(generator_binary, global_bin_dir / "generator")
        print(f"✅ Debug binary also copied to {global_bin_dir / 'generator'}")
    else:
        print("❌ Generator binary not found!")
        return 1
    
    print("🧹 Cleaning up build directory...")
    if build_dir.exists():
        shutil.rmtree(build_dir)
    
    print("🎉 Debug build complete!")
    return 0

if __name__ == "__main__":
    exit(main())