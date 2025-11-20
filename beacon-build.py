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

def find_binaries(build_dir):
    """Find built binaries and return their paths"""
    binaries = {}
    
    # Common binary locations
    binary_patterns = [
        "src/apps/*/generator",
        "src/apps/*/matching_engine", 
        "src/apps/*/AlgoTwapProtocol",
        "src/apps/*/playback",
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
        "-DCMAKE_CXX_STANDARD=17",
        "-DBUILD_TESTING=OFF"
    ]
    
    if not run_command(cmake_cmd, f"Configuring CMake ({build_type})", cwd=build_dir):
        print(f"{Colors.RED}❌ CMake configuration failed{Colors.RESET}")
        sys.exit(1)
    
    # Build all targets
    build_cmd = ["cmake", "--build", ".", f"-j{cpu_count}"]
    if args.verbose:
        build_cmd.append("--verbose")
    
    if not run_command(build_cmd, f"Building all targets (using {cpu_count} cores)", cwd=build_dir):
        print(f"{Colors.RED}❌ Build failed{Colors.RESET}")
        sys.exit(1)
    
    print()
    print(f"{Colors.BOLD}{Colors.GREEN}==========================================")
    print(f"  Build Complete!")  
    print(f"=========================================={Colors.RESET}")
    print()
    
    # Find and display built binaries
    binaries = find_binaries(build_dir)
    if binaries:
        print(f"{Colors.CYAN}Built Binaries:{Colors.RESET}")
        for name, path in sorted(binaries.items()):
            rel_path = path.relative_to(script_dir)
            print(f"  {Colors.GREEN}✓{Colors.RESET} {name}: {Colors.YELLOW}{rel_path}{Colors.RESET}")
    else:
        print(f"{Colors.YELLOW}⚠️  No executable binaries found{Colors.RESET}")
    
    print()
    print(f"{Colors.GREEN}🚀 Ready to run: python3 beacon.py{Colors.RESET}")

if __name__ == "__main__":
    main()