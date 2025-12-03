#!/usr/bin/env python3
"""
Beacon Application Build Script - Generator
Standardized build interface for generator application with HFT optimizations
"""

import subprocess
import argparse
import shutil
import sys
import os
from pathlib import Path

# Application-specific configuration
APP_NAME = "generator"
APP_TARGETS = ["generator"]

def get_cpu_count():
    """Get number of CPU cores for parallel builds"""
    import multiprocessing
    return multiprocessing.cpu_count() or 4

def check_dependencies():
    """Check if required libraries and dependencies exist"""
    script_dir = Path(__file__).parent
    beacon_root = script_dir.parent.parent.parent
    
    required_libs = [
        beacon_root / "libs" / "beacon_encoder",
        beacon_root / "libs" / "beacon_exchange", 
        beacon_root / "libs" / "beacon_hft"
    ]
    
    # Fix: Check for nlohmann/json.hpp at the correct location (directly in vendor/nlohmann/)
    nlohmann_path = beacon_root / "vendor" / "nlohmann" / "json.hpp"
    
    missing_deps = []
    for lib_path in required_libs:
        if not lib_path.exists():
            missing_deps.append(str(lib_path))
    
    # Check nlohmann/json specifically at the correct path
    if not nlohmann_path.exists():
        print(f"[ERROR] nlohmann/json.hpp not found at: {nlohmann_path}")
        print(f"[INFO] Please verify vendor directory structure:")
        vendor_dir = beacon_root / "vendor"
        if vendor_dir.exists():
            print(f"[DEBUG] Vendor directory contents:")
            for item in vendor_dir.iterdir():
                print(f"  - {item}")
                # Also show contents of nlohmann directory if it exists
                if item.name == "nlohmann" and item.is_dir():
                    print(f"[DEBUG] nlohmann directory contents:")
                    for nlohmann_item in item.iterdir():
                        print(f"    - {nlohmann_item}")
        missing_deps.append(str(nlohmann_path))
    else:
        print(f"[DEPS] Found nlohmann/json.hpp at: {nlohmann_path} ✅")
    
    if missing_deps:
        print(f"[ERROR] Missing required dependencies:")
        for dep in missing_deps:
            print(f"  - {dep}")
        return False
    
    print(f"[DEPS] All required libraries found ✅")
    return True

def clean_build_dirs():
    """Remove all build artifacts"""
    script_dir = Path(__file__).parent
    # Clean simplified build directory structure
    build_path = script_dir / "build"
    bin_path = script_dir / "bin"
    
    if build_path.exists():
        print(f"[CLEAN] Removing {build_path}")
        shutil.rmtree(build_path, ignore_errors=True)
    
    if bin_path.exists():
        print(f"[CLEAN] Removing {bin_path}")
        shutil.rmtree(bin_path, ignore_errors=True)

def build_mode(mode, run_test=False):
    """Build application in specified mode with HFT optimizations"""
    script_dir = Path(__file__).parent
    build_dir = script_dir / "build"
    bin_dir = script_dir / "bin"
    
    # Check dependencies first
    if not check_dependencies():
        return False
    
    # Clean and create directories
    if build_dir.exists():
        shutil.rmtree(build_dir, ignore_errors=True)
    build_dir.mkdir(parents=True, exist_ok=True)
    bin_dir.mkdir(parents=True, exist_ok=True)
    
    # Configure CMake with HFT optimizations
    cmake_config = "Debug" if mode == "debug" else "Release"
    cmake_args = [
        "cmake", "..",
        f"-DCMAKE_BUILD_TYPE={cmake_config}"
    ]
    
    # Add HFT-specific optimizations for release builds
    if mode == "release":
        cmake_args.extend([
            "-DCMAKE_CXX_FLAGS_RELEASE=-O3 -march=native -mtune=native -flto -DNDEBUG",
            "-DCMAKE_INTERPROCEDURAL_OPTIMIZATION=ON"
        ])
    
    cmake_args.append(f"-DBUILD_TESTING={'ON' if run_test else 'OFF'}")

    print(f"[BUILD] Configuring {APP_NAME} ({mode} mode) with HFT optimizations 🚀")
    try:
        result = subprocess.run(cmake_args, cwd=build_dir, check=True, capture_output=True, text=True)
        if result.stdout.strip():
            print(result.stdout)
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] CMake configuration failed for {APP_NAME}!")
        print(e.stdout)
        print(e.stderr)
        return False

    # Build with maximum parallelism
    cpu_count = get_cpu_count()
    build_args = ["cmake", "--build", ".", f"-j{cpu_count}"]
    
    # Add verbose output for debug builds
    if mode == "debug":
        build_args.append("--verbose")

    print(f"[BUILD] Building {APP_NAME} using {cpu_count} cores")
    try:
        result = subprocess.run(build_args, cwd=build_dir, check=True, capture_output=True, text=True)
        if result.stdout.strip():
            print(result.stdout)
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] Build failed for {APP_NAME}!")
        print("STDOUT:", e.stdout)
        print("STDERR:", e.stderr)
        return False
    
    # Copy binaries and check file sizes
    for target in APP_TARGETS:
        source_bin = build_dir / target
        if source_bin.exists():
            dest_bin = bin_dir / target
            shutil.copy2(source_bin, dest_bin)
            file_size = dest_bin.stat().st_size
            print(f"[SUCCESS] {target} -> {dest_bin} ({file_size:,} bytes)")
            
            # Make executable (important for CI/CD)
            dest_bin.chmod(0o755)
        else:
            print(f"[WARNING] Binary not found: {source_bin}")
            return False
    
    # Run test if requested
    if run_test:
        print(f"[TEST] Running {APP_NAME} test")
        try:
            subprocess.run(["ctest", "--output-on-failure"], cwd=build_dir, check=True)
            print(f"[SUCCESS] Test passed ✅")
        except subprocess.CalledProcessError as e:
            print(f"[ERROR] Test failed: {e}")
            return False
    
    # Always cleanup build directory after successful build
    shutil.rmtree(build_dir, ignore_errors=True)
    print(f"[CLEAN] Removed build directory")
    
    return True

def main():
    parser = argparse.ArgumentParser(description=f"Build {APP_NAME} application with HFT encoder library")
    parser.add_argument("--mode", choices=["debug", "release", "all", "clean"], 
                       default="all", help="Build mode (default: all)")
    parser.add_argument("--run-test", action="store_true", 
                       help="Run test after building (default: false)")
    parser.add_argument("--verbose", action="store_true",
                       help="Enable verbose output")
    
    args = parser.parse_args()
    
    if args.verbose:
        print(f"[INFO] Building {APP_NAME} with ELITE HFT encoder library 🚀")
    
    if args.mode == "clean":
        clean_build_dirs()
        print(f"[SUCCESS] Cleaned {APP_NAME} build artifacts")
        return 0
    
    modes = ["debug", "release"] if args.mode == "all" else [args.mode]
    
    for mode in modes:
        print(f"[START] Building {APP_NAME} in {mode} mode")
        if not build_mode(mode, args.run_test):
            print(f"[FAILED] {APP_NAME} {mode} build failed ❌")
            return 1
        print(f"[SUCCESS] {APP_NAME} {mode} build completed 🎉")
    
    print(f"[COMPLETE] {APP_NAME} ready to generate MONSTER HFT market data! 💎")
    return 0

if __name__ == "__main__":
    sys.exit(main())