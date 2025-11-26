#!/usr/bin/env python3
"""
Beacon Application Build Script - Playback
Standardized build interface for all Beacon applications
"""

import subprocess
import argparse
import shutil
import sys
import os
from pathlib import Path

# Application-specific configuration
APP_NAME = "playback"
APP_TARGETS = ["playback"]

def get_cpu_count():
    """Get number of CPU cores for parallel builds"""
    import multiprocessing
    return multiprocessing.cpu_count() or 4

def clean_build_dirs():
    """Remove all build artifacts"""
    script_dir = Path(__file__).parent
    for build_dir in ["build-debug", "build-release", "build"]:
        build_path = script_dir / build_dir
        if build_path.exists():
            print(f"[CLEAN] Removing {build_path}")
            shutil.rmtree(build_path, ignore_errors=True)

def build_mode(mode, run_tests=False):
    """Build application in specified mode"""
    script_dir = Path(__file__).parent
    build_dir = script_dir / f"build-{mode}"
    bin_dir = script_dir / "bin" / mode
    
    # Clean and create directories
    if build_dir.exists():
        shutil.rmtree(build_dir, ignore_errors=True)
    build_dir.mkdir(parents=True, exist_ok=True)
    bin_dir.mkdir(parents=True, exist_ok=True)
    
    # Configure CMake
    cmake_config = "Debug" if mode == "debug" else "Release"
    cmake_args = [
        "cmake", "..",
        f"-DCMAKE_BUILD_TYPE={cmake_config}",
        "-DCMAKE_CXX_STANDARD=17"
    ]
    
    if mode == "release":
        cmake_args.extend([
            "-DCMAKE_CXX_FLAGS_RELEASE=-O3 -DNDEBUG",
            "-DCMAKE_C_FLAGS_RELEASE=-O3 -DNDEBUG"
        ])
    elif mode == "debug":
        cmake_args.extend([
            "-DCMAKE_CXX_FLAGS_DEBUG=-g -O0",
            "-DCMAKE_C_FLAGS_DEBUG=-g -O0"
        ])
    
    if run_tests:
        cmake_args.append("-DBUILD_TESTING=ON")
    else:
        cmake_args.append("-DBUILD_TESTING=OFF")
    
    print(f"[BUILD] Configuring {APP_NAME} ({mode} mode)")
    try:
        subprocess.run(cmake_args, cwd=build_dir, check=True, capture_output=True)
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] CMake configuration failed: {e}")
        return False
    
    # Build
    cpu_count = get_cpu_count()
    build_args = ["cmake", "--build", ".", f"-j{cpu_count}"]
    
    print(f"[BUILD] Building {APP_NAME} using {cpu_count} cores")
    try:
        result = subprocess.run(build_args, cwd=build_dir, check=True, capture_output=True, text=True)
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] Build failed: {e}")
        if e.stdout:
            print(f"STDOUT: {e.stdout}")
        if e.stderr:
            print(f"STDERR: {e.stderr}")
        return False
    
    # Copy binaries
    for target in APP_TARGETS:
        source_bin = build_dir / target
        if source_bin.exists():
            dest_bin = bin_dir / target
            shutil.copy2(source_bin, dest_bin)
            print(f"[SUCCESS] {target} -> {dest_bin}")
        else:
            print(f"[WARNING] Binary not found: {source_bin}")
    
    # Run tests if requested
    if run_tests:
        print(f"[TEST] Running {APP_NAME} tests")
        try:
            subprocess.run(["ctest", "--output-on-failure"], cwd=build_dir, check=True)
            print(f"[SUCCESS] Tests passed")
        except subprocess.CalledProcessError as e:
            print(f"[ERROR] Tests failed: {e}")
            return False
    
    # Cleanup build directory
    shutil.rmtree(build_dir, ignore_errors=True)
    print(f"[CLEAN] Removed build directory")
    
    return True

def main():
    parser = argparse.ArgumentParser(description=f"Build {APP_NAME} application")
    parser.add_argument("--mode", choices=["debug", "release", "all", "clean"], 
                       default="all", help="Build mode (default: all)")
    parser.add_argument("--run-tests", action="store_true", 
                       help="Run tests after building (default: false)")
    
    args = parser.parse_args()
    
    if args.mode == "clean":
        clean_build_dirs()
        print(f"[SUCCESS] Cleaned {APP_NAME} build artifacts")
        return 0
    
    modes = ["debug", "release"] if args.mode == "all" else [args.mode]
    
    for mode in modes:
        print(f"[START] Building {APP_NAME} in {mode} mode")
        if not build_mode(mode, args.run_tests):
            print(f"[FAILED] {APP_NAME} {mode} build failed")
            return 1
        print(f"[SUCCESS] {APP_NAME} {mode} build completed")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())