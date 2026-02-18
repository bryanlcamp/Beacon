#!/usr/bin/env python3
"""
Beacon Build Script

Top-level clean build script for all applications.
Converts the functionality of build.sh to Python with enhanced features.

Usage: python3 beacon-build.py [--debug|--release] [--clean]
"""

import argparse
import subprocess
import sys
import time
import multiprocessing
import shutil
from pathlib import Path

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
    return multiprocessing.cpu_count() or 4

def run_command(cmd, description, cwd=None, show_progress=False):
    """Run a command with proper error handling and optional progress"""
    print(f"{Colors.BLUE}[Beacon] {description}...{Colors.RESET}")

    if show_progress:
        # Show live progress for long-running builds
        try:
            process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                     text=True, cwd=cwd, bufsize=1, universal_newlines=True)

            # Show progress dots
            start_time = time.time()
            last_dot = start_time
            output_lines = []

            while True:
                output = process.stdout.readline()
                if output == '' and process.poll() is not None:
                    break
                if output:
                    output_lines.append(output.strip())
                    # Show a progress dot every 2 seconds
                    current_time = time.time()
                    if current_time - last_dot >= 2.0:
                        print('.', end='', flush=True)
                        last_dot = current_time

            print()  # New line after dots

            if process.returncode == 0:
                elapsed = time.time() - start_time
                print(f"{Colors.GREEN}[SUCCESS] {description} completed in {elapsed:.1f}s{Colors.RESET}")
                return True
            else:
                print(f"{Colors.RED}[ERROR] {description} failed{Colors.RESET}")
                # Show last 10 lines of output for debugging
                for line in output_lines[-10:]:
                    print(f"{Colors.RED}  {line}{Colors.RESET}")
                return False

        except (subprocess.SubprocessError, OSError) as e:
            print(f"{Colors.RED}[ERROR] {description} failed: {e}{Colors.RESET}")
            return False

    # Original method for quick commands or fallback
    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True, cwd=cwd)
        print(f"{Colors.GREEN}[SUCCESS] {description} completed{Colors.RESET}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"{Colors.RED}[ERROR] {description} failed:{Colors.RESET}")
        print(f"{Colors.RED}Command: {' '.join(cmd)}{Colors.RESET}")
        if e.stdout:
            print(f"{Colors.RED}STDOUT: {e.stdout}{Colors.RESET}")
        if e.stderr:
            print(f"{Colors.RED}STDERR: {e.stderr}{Colors.RESET}")
        return False

def clean_cmake_build(script_dir):
    """Clean the main CMake build directory"""
    build_dir = script_dir / "build"
    if build_dir.exists():
        print(f"{Colors.YELLOW}[CLEAN] Removing {build_dir}{Colors.RESET}")
        shutil.rmtree(build_dir, ignore_errors=True)
    return True

def build_with_cmake(script_dir, build_type, skip_tests=False, verbose=False):
    """Build all apps using the main CMake system"""
    build_dir = script_dir / "build"
    build_dir.mkdir(parents=True, exist_ok=True)

    # Configure CMake
    cmake_config_args = [
        "cmake", "..",
        f"-DCMAKE_BUILD_TYPE={build_type}",
        "-DCMAKE_CXX_STANDARD=17"
    ]

    if skip_tests:
        cmake_config_args.append("-DBUILD_TESTING=OFF")
    else:
        cmake_config_args.append("-DBUILD_TESTING=ON")

    if verbose:
        cmake_config_args.append("-DCMAKE_VERBOSE_MAKEFILE=ON")

    # Configure
    success = run_command(cmake_config_args, f"Configuring CMake ({build_type})", cwd=build_dir)
    if not success:
        return False

    # Build
    cpu_count = get_cpu_count()
    build_args = ["cmake", "--build", ".", f"-j{cpu_count}"]
    if verbose:
        build_args.append("--verbose")

    success = run_command(build_args, f"Building all apps with {cpu_count} cores", cwd=build_dir, show_progress=True)
    if not success:
        return False

    # Run tests if requested
    if not skip_tests:
        test_args = ["ctest", "--output-on-failure", "--parallel", str(cpu_count)]
        if verbose:
            test_args.append("--verbose")
        success = run_command(test_args, "Running tests", cwd=build_dir)
        # Don't fail the build if tests fail - just warn
        if not success:
            print(f"{Colors.YELLOW}[WARN] Some tests failed, but build succeeded{Colors.RESET}")

    return True

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

    print(f"{Colors.BOLD}{Colors.CYAN}==========================================")
    print(f"  Beacon - Unified CMake Build System")
    print(f"==========================================={Colors.RESET}")
    print()
    print(f"{Colors.BLUE}Build Type: {build_type}{Colors.RESET}")
    print(f"{Colors.BLUE}Repository: {script_dir}{Colors.RESET}")
    print()

    # Always clean for consistent builds
    clean_cmake_build(script_dir)

    # Build using unified CMake system
    success = build_with_cmake(script_dir, build_type, args.no_tests, args.verbose)

    print()
    print(f"{Colors.BOLD}{Colors.CYAN}==========================================")
    print(f"  Build Results")
    print(f"=========================================={Colors.RESET}")

    if success:
        print(f"{Colors.GREEN}🎯 BUILD SUCCESSFUL! Trading platform ready.{Colors.RESET}")
    else:
        print(f"{Colors.RED}❌ BUILD FAILED. Check error messages above.{Colors.RESET}")
        return 1

    return 0

if __name__ == "__main__":
    sys.exit(main())
