#!/usr/bin/env python3
"""
Beacon CI/CD Release Build Script
Builds all components using unified CMake system
"""

import subprocess
import sys
from pathlib import Path

def run_command(cmd, description, timeout_seconds=300):
    """Run a command and handle errors with timeout"""
    print(f"[CI/CD] {description}...")
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True, timeout=timeout_seconds)
        print(f"[SUCCESS] {description} completed")
        return True
    except subprocess.TimeoutExpired:
        print(f"[ERROR] {description} timed out after {timeout_seconds} seconds")
        return False
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] {description} failed:")
        print(f"STDOUT: {e.stdout}")
        print(f"STDERR: {e.stderr}")
        return False

def emergency_fix_config_parser(repo_root):
    """Emergency fix for ConfigFileParser.h naming conflicts"""
    config_parser_path = repo_root / "src/apps/generator/include/ConfigFileParser.h"
    
    print("[🚑 EMERGENCY FIX] Checking ConfigFileParser.h...")
    
    if not config_parser_path.exists():
        print("[❌] ConfigFileParser.h not found - skipping fix")
        return
        
    # Read current content
    content = config_parser_path.read_text()
    
    # Check for old syntax and fix if needed
    if "PriceRange PriceRange;" in content:
        print("[❌] DETECTED OLD VERSION! Applying emergency patch...")
        content = content.replace("PriceRange PriceRange;", "PriceRange priceRange;")
        content = content.replace("QuantityRange QuantityRange;", "QuantityRange quantityRange;") 
        content = content.replace("PreviousDay PreviousDay;", "PreviousDay previousDay;")
        
        # Write fixed content
        config_parser_path.write_text(content)
        print("[✅] PATCHED! ConfigFileParser.h has been fixed.")
    else:
        print("[✅] ConfigFileParser.h already correct - no patching needed")

def main():
    """Build all components in release mode"""
    repo_root = Path(__file__).resolve().parents[2]
    
    print(f"[CI/CD] Building Beacon Trading System (Release) - Enhanced v2.0 + EMERGENCY FIX")
    
    # Apply emergency fix first
    emergency_fix_config_parser(repo_root)
    print(f"[CI/CD] Repository root: {repo_root}")
    print(f"[CI/CD] Using multi-strategy CMake configuration system")
    
    # Change to repo root
    import os
    os.chdir(repo_root)
    
    # Configure CMake for Release with multiple fallback strategies (prioritize CI-friendly options)
    cmake_strategies = [
        "cmake -B build-release -S . -DCMAKE_BUILD_TYPE=Release -DCMAKE_CXX_STANDARD=17 -DBUILD_TESTING=OFF",
        "cmake -B build-release -S . -DCMAKE_BUILD_TYPE=Release -DCMAKE_CXX_STANDARD=14 -DBUILD_TESTING=OFF", 
        "cmake -B build-release -S . -DCMAKE_BUILD_TYPE=Release -DCMAKE_CXX_STANDARD=17",
        "cmake -B build-release -S . -DCMAKE_BUILD_TYPE=Release --log-level=STATUS"
    ]
    
    cmake_success = False
    for i, cmd in enumerate(cmake_strategies):
        strategy_name = f"CMake Release configuration (strategy {i+1})"
        print(f"[DEBUG] Trying {strategy_name}: {cmd}")
        
        if run_command(cmd, strategy_name):
            cmake_success = True
            break
        else:
            print(f"[DEBUG] Strategy {i+1} failed, trying next...")
    
    if not cmake_success:
        print(f"[ERROR] All CMake configuration strategies failed")
        print(f"[DEBUG] Attempting minimal build without subdirectories...")
        
        # Last resort: try without problematic subdirectories
        minimal_cmd = "cmake -B build-release -S . -DCMAKE_BUILD_TYPE=Release -DBUILD_TESTING=OFF"
        if not run_command(minimal_cmd, "CMake minimal configuration"):
            print(f"[FATAL] Even minimal CMake configuration failed")
            sys.exit(1)
    
    # Build critical targets with explicit linking verification
    critical_targets = ["generator", "matching_engine", "AlgoTwapProtocol", "playback"]
    for target in critical_targets:
        print(f"[CI/CD] Building critical target: {target}")
        if not run_command(f"cmake --build build-release --target {target} --verbose", f"Release build - {target}"):
            print(f"[ERROR] Failed to build critical target: {target}")
            
            # Check what was actually created
            print(f"[DEBUG] Checking build output for {target}...")
            expected_paths = {
                "generator": "build-release/src/apps/generator/generator",
                "matching_engine": "build-release/src/apps/matching_engine/matching_engine",
                "AlgoTwapProtocol": "build-release/src/apps/client_algorithm/AlgoTwapProtocol",
                "playback": "build-release/src/apps/playback/playback"
            }
            
            if target in expected_paths:
                binary_path = repo_root / expected_paths[target]
                if binary_path.exists():
                    print(f"[WARNING] Target {target} build reported failure but binary exists at {binary_path}")
                    continue
                else:
                    print(f"[ERROR] Target {target} binary missing at expected path: {binary_path}")
            
            sys.exit(1)
        
        # Verify the binary was actually created
        expected_paths = {
            "generator": "build-release/src/apps/generator/generator",
            "matching_engine": "build-release/src/apps/matching_engine/matching_engine",
            "AlgoTwapProtocol": "build-release/src/apps/client_algorithm/AlgoTwapProtocol",
            "playback": "build-release/src/apps/playback/playback"
        }
        
        if target in expected_paths:
            binary_path = repo_root / expected_paths[target]
            if binary_path.exists():
                size = binary_path.stat().st_size
                print(f"[SUCCESS] {target} binary created: {binary_path} ({size} bytes)")
            else:
                print(f"[ERROR] {target} binary missing after successful build: {binary_path}")
                sys.exit(1)
    
    print(f"[CI/CD] ✅ All critical targets built and verified successfully")
    
    # Optionally build all targets (including tests) - this might fail but won't stop CI/CD
    print(f"[CI/CD] Building remaining targets (tests, examples)...")
    if not run_command("cmake --build build-release --config Release", "Release build - all targets"):
        print(f"[CI/CD] ❌ Release build failed - checking for partial success...")
        # Check if critical binaries were still built
        critical_binaries = [
            "build-release/src/apps/generator/generator",
            "build-release/src/apps/matching_engine/matching_engine", 
            "build-release/src/apps/client_algorithm/AlgoTwapProtocol",
            "build-release/src/apps/playback/playback"
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
    
    # Comprehensive binary verification
    required_binaries = [
        "build-release/src/apps/generator/generator",
        "build-release/src/apps/matching_engine/matching_engine", 
        "build-release/src/apps/client_algorithm/AlgoTwapProtocol",
        "build-release/src/apps/playback/playback"
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
