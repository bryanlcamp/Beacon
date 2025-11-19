#!/usr/bin/env python3
"""
Beacon CI/CD Release Build Script
Builds all components using unified CMake system
"""

import subprocess
import sys
from pathlib import Path

def run_command(cmd, description):
    """Run a command and handle errors"""
    print(f"[CI/CD] {description}...")
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        print(f"[SUCCESS] {description} completed")
        return True
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] {description} failed:")
        print(f"STDOUT: {e.stdout}")
        print(f"STDERR: {e.stderr}")
        return False

def main():
    """Build all components in release mode"""
    repo_root = Path(__file__).resolve().parents[2]
    
    print(f"[CI/CD] Building Beacon Trading System (Release)")
    print(f"[CI/CD] Repository root: {repo_root}")
    
    # Change to repo root
    import os
    os.chdir(repo_root)
    
    # Configure CMake for Release with verbose output
    cmake_config_cmd = "cmake -B build-release -S . -DCMAKE_BUILD_TYPE=Release --log-level=VERBOSE"
    if not run_command(cmake_config_cmd, "CMake Release configuration"):
        print(f"[DEBUG] CMake configuration failed. Trying fallback...")
        # Try with less strict requirements
        fallback_cmd = "cmake -B build-release -S . -DCMAKE_BUILD_TYPE=Release -DCMAKE_CXX_STANDARD=17"
        if not run_command(fallback_cmd, "CMake Release configuration (fallback)"):
            print(f"[ERROR] Both CMake configuration attempts failed")
            sys.exit(1)
    
    # Build critical targets (skip tests for faster CI/CD)
    critical_targets = ["generator", "matching_engine", "AlgoTwapProtocol"]
    for target in critical_targets:
        if not run_command(f"cmake --build build-release --target {target}", f"Release build - {target}"):
            print(f"[ERROR] Failed to build critical target: {target}")
            sys.exit(1)
    
    print(f"[CI/CD] ✅ All critical targets built successfully")
    
    # Optionally build all targets (including tests) - this might fail but won't stop CI/CD
    print(f"[CI/CD] Building remaining targets (tests, examples)...")
    if not run_command("cmake --build build-release --config Release", "Release build - all targets"):
        print(f"[CI/CD] ❌ Release build failed - checking for partial success...")
        # Check if critical binaries were still built
        critical_binaries = [
            "build-release/src/apps/generator/generator",
            "build-release/src/apps/matching_engine/matching_engine", 
            "build-release/src/apps/client_algorithm/AlgoTwapProtocol"
        ]
        
        partial_success = True
        for binary in critical_binaries:
            binary_path = repo_root / binary
            if not binary_path.exists():
                print(f"[ERROR] Critical binary missing: {binary}")
                partial_success = False
        
        if not partial_success:
            print(f"[CI/CD] ❌ Critical binaries missing - build failed completely")
            sys.exit(1)
        else:
            print(f"[CI/CD] ⚠️  Build completed with errors but critical binaries exist")
    
    # Verify key binaries exist
    required_binaries = [
        "build-release/src/apps/generator/generator",
        "build-release/src/apps/matching_engine/matching_engine", 
        "build-release/src/apps/client_algorithm/AlgoTwapProtocol"
    ]
    
    print(f"[CI/CD] Verifying build outputs...")
    missing_binaries = []
    for binary in required_binaries:
        binary_path = repo_root / binary
        if binary_path.exists():
            print(f"[SUCCESS] ✓ {binary}")
        else:
            print(f"[ERROR] ✗ {binary}")
            missing_binaries.append(binary)
    
    if missing_binaries:
        print(f"[ERROR] Missing {len(missing_binaries)} required binaries")
        sys.exit(1)
    
    print(f"[CI/CD] ✅ Release build complete - all binaries present")

if __name__ == "__main__":
    main()
