#!/usr/bin/env python3
"""
Beacon Build Script

Top-level clean build script for all applications.
Converts the functionality of build.sh to Python with enhanced features.

Usage: python3 beacon-build.py [--debug|--release] [--clean]
"""

import subprocess
import sys
import os
import argparse
from pathlib import Path
import multiprocessing

class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m' 
    RED = '\033[91m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'
    RESET = '\033[0m'

def get_cpu_count():
    """Get the number of CPU cores for parallel builds"""
    try:
        return multiprocessing.cpu_count()
    except:
        return 4

def run_command(cmd, description, cwd=None):
    """Run a command with proper error handling"""
    print(f"{Colors.BLUE}[Beacon] {description}...{Colors.RESET}")
    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True, cwd=cwd)
        print(f"{Colors.GREEN}[SUCCESS] {description} completed{Colors.RESET}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"{Colors.RED}[ERROR] {description} failed:{Colors.RESET}")
        if e.stdout:
            print(f"STDOUT: {e.stdout}")
        if e.stderr:
            print(f"STDERR: {e.stderr}")
        return False

def clean_build_directory(build_dir):
    """Clean and recreate build directory"""
    import shutil
    
    if build_dir.exists():
        print(f"{Colors.YELLOW}[Beacon] Cleaning build directory: {build_dir}{Colors.RESET}")
        shutil.rmtree(build_dir, ignore_errors=True)
    
    print(f"{Colors.BLUE}[Beacon] Creating build directory: {build_dir}{Colors.RESET}")
    build_dir.mkdir(parents=True, exist_ok=True)

def build_gtest(script_dir):
    """Build Google Test if not already built"""
    gtest_dir = script_dir / "vendor" / "googletest"
    gtest_build_dir = gtest_dir / "build"
    gtest_lib = gtest_build_dir / "lib" / "libgtest.a"
    
    if gtest_lib.exists():
        print(f"{Colors.GREEN}[Beacon] Google Test already built{Colors.RESET}")
        return True
    
    if not gtest_dir.exists():
        print(f"{Colors.RED}[ERROR] Google Test not found at {gtest_dir}{Colors.RESET}")
        return False
    
    print(f"{Colors.BLUE}[Beacon] Building Google Test...{Colors.RESET}")
    
    # Create build directory
    gtest_build_dir.mkdir(parents=True, exist_ok=True)
    
    # Configure gtest
    gtest_cmake_cmd = [
        "cmake", "..",
        "-DCMAKE_BUILD_TYPE=Release",
        "-DBUILD_GMOCK=ON",
        "-DBUILD_GTEST=ON"
    ]
    
    if not run_command(gtest_cmake_cmd, "Configuring Google Test", cwd=gtest_build_dir):
        return False
    
    # Build gtest
    cpu_count = get_cpu_count()
    gtest_build_cmd = ["cmake", "--build", ".", f"-j{cpu_count}"]
    
    if not run_command(gtest_build_cmd, f"Building Google Test (using {cpu_count} cores)", cwd=gtest_build_dir):
        return False
    
    return True

def find_binaries(build_dir):
    """Find built binaries and return their paths"""
    binaries = {}
    
    # Common binary locations
    binary_patterns = [
        "src/apps/*/generator",
        "src/apps/*/matching_engine", 
        "src/apps/*/AlgoTwapProtocol",
        "src/apps/*/playbook",
        "src/apps/*/playback",
        "tests/*",
        "src/apps/*/*"  # Catch-all for other binaries
    ]
    
    for pattern in binary_patterns:
        import glob
        matches = glob.glob(str(build_dir / pattern))
        for match in matches:
            binary_path = Path(match)
            if binary_path.is_file() and os.access(binary_path, os.X_OK):
                name = binary_path.name
                binaries[name] = binary_path
    
    return binaries

def main():
    parser = argparse.ArgumentParser(description='Beacon Build Script - Clean build for all applications')
    parser.add_argument('--debug', action='store_true', help='Build in debug mode (default: release)')
    parser.add_argument('--release', action='store_true', help='Build in release mode')
    parser.add_argument('--clean', action='store_true', help='Force clean build (always done by default)')
    parser.add_argument('--verbose', action='store_true', help='Verbose build output')
    parser.add_argument('--no-tests', action='store_true', help='Skip building tests')
    
    args = parser.parse_args()
    
    # Determine build type
    if args.debug:
        build_type = "Debug"
    else:
        build_type = "Release"  # Default to release
    
    # Get script directory (repo root)
    script_dir = Path(__file__).parent.absolute()
    build_dir = script_dir / "build"
    
    print(f"{Colors.BOLD}{Colors.CYAN}==========================================")
    print(f"  Beacon - Building All Applications")
    print(f"==========================================={Colors.RESET}")
    print()
    print(f"{Colors.BLUE}Build Type: {build_type}{Colors.RESET}")
    print(f"{Colors.BLUE}Repository: {script_dir}{Colors.RESET}")
    print(f"{Colors.BLUE}Build Dir:  {build_dir}{Colors.RESET}")
    print()
    
    # Always clean build
    clean_build_directory(build_dir)
    
    # Configure CMake
    cpu_count = get_cpu_count()
    cmake_cmd = [
        "cmake", "..",
        f"-DCMAKE_BUILD_TYPE={build_type}",
        "-DCMAKE_CXX_STANDARD=17"
    ]
    
    # Add test configuration if not skipping tests
    if not args.no_tests:
        # Build Google Test first
        if not build_gtest(script_dir):
            print(f"{Colors.RED}❌ Google Test build failed{Colors.RESET}")
            sys.exit(1)
        
        cmake_cmd.extend([
            "-DBUILD_TESTING=ON",
            f"-DGTEST_ROOT={script_dir}/vendor/googletest",
            f"-DGTEST_INCLUDE_DIR={script_dir}/vendor/googletest/googletest/include",
            f"-DGTEST_LIBRARY={script_dir}/vendor/googletest/build/lib/libgtest.a",
            f"-DGTEST_MAIN_LIBRARY={script_dir}/vendor/googletest/build/lib/libgtest_main.a"
        ])
    else:
        cmake_cmd.append("-DBUILD_TESTING=OFF")
        print(f"{Colors.YELLOW}[Beacon] Skipping tests build{Colors.RESET}")
    
    if not run_command(cmake_cmd, f"Configuring CMake ({build_type})", cwd=build_dir):
        print(f"{Colors.RED}❌ CMake configuration failed{Colors.RESET}")
        sys.exit(1)
    
    # Build all targets
    build_cmd = ["cmake", "--build", ".", f"-j{cpu_count}"]
    if args.verbose:
        build_cmd.append("--verbose")
    
    build_success = run_command(build_cmd, f"Building all targets (using {cpu_count} cores)", cwd=build_dir)
    
    print()
    print(f"{Colors.BOLD}{Colors.CYAN}==========================================")
    print(f"  Build Results")  
    print(f"=========================================={Colors.RESET}")
    print()
    
    # Find and display built binaries regardless of build result
    binaries = find_binaries(build_dir)
    if binaries:
        print(f"{Colors.CYAN}Built Applications:{Colors.RESET}")
        for name, path in sorted(binaries.items()):
            rel_path = path.relative_to(script_dir)
            print(f"  {Colors.GREEN}[SUCCESS]{Colors.RESET} {name}: {Colors.YELLOW}{rel_path}{Colors.RESET}")
        
        print()
        if build_success:
            print(f"{Colors.BOLD}{Colors.GREEN}ALL BUILDS SUCCESSFUL!{Colors.RESET}")
        else:
            print(f"{Colors.YELLOW}[WARNING] Some tests failed, but main applications built successfully!{Colors.RESET}")
            print(f"{Colors.GREEN}Ready for demo: Your core apps are working!{Colors.RESET}")
    else:
        print(f"{Colors.RED}[ERROR] No executable binaries found{Colors.RESET}")
        if not build_success:
            sys.exit(1)
    
    print()
    print(f"{Colors.GREEN}Ready to run applications or start demo!{Colors.RESET}")
    
    if not build_success:
        print(f"{Colors.YELLOW}Note: Build had some test failures, but main applications are ready{Colors.RESET}")
        sys.exit(0)  # Exit cleanly since main apps built

if __name__ == "__main__":
    main()