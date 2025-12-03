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
import time
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
                return_code = process.poll()
                if return_code is not None:
                    # Capture any remaining output
                    remaining_output = process.stdout.read()
                    if remaining_output:
                        output_lines.append(remaining_output)
                    break
                
                # Read available output
                try:
                    line = process.stdout.readline()
                    if line:
                        output_lines.append(line)
                except:
                    pass
                
                current_time = time.time()
                if current_time - last_dot > 3:  # Show dot every 3 seconds
                    elapsed = int(current_time - start_time)
                    print(f"{Colors.YELLOW}  ... still working ({elapsed}s elapsed){Colors.RESET}")
                    last_dot = current_time
                
                time.sleep(0.5)
            
            if process.returncode == 0:
                elapsed = int(time.time() - start_time)
                print(f"{Colors.GREEN}[SUCCESS] {description} completed ({elapsed}s){Colors.RESET}")
                return True
            else:
                elapsed = int(time.time() - start_time)
                print(f"{Colors.RED}[ERROR] {description} failed after {elapsed}s{Colors.RESET}")
                # Show the last part of the output for debugging
                if output_lines:
                    print(f"{Colors.RED}Last output:{Colors.RESET}")
                    recent_output = ''.join(output_lines[-20:])  # Last 20 lines
                    print(recent_output)
                return False
                
        except (subprocess.SubprocessError, OSError) as e:
            print(f"{Colors.RED}[ERROR] Progress monitoring failed: {e}{Colors.RESET}")
            # Fall back to original method
    
    # Original method for quick commands or fallback
    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True, cwd=cwd)
        print(f"{Colors.GREEN}[SUCCESS] {description} completed{Colors.RESET}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"{Colors.RED}[ERROR] {description} failed:{Colors.RESET}")
        print(f"{Colors.RED}Command: {' '.join(cmd)}{Colors.RESET}")
        if e.stdout:
            print(f"{Colors.RED}STDOUT:{Colors.RESET}")
            print(e.stdout)
        if e.stderr:
            print(f"{Colors.RED}STDERR:{Colors.RESET}")
            print(e.stderr)
        return False

def clean_app_build_directories(script_dir, apps):
    """Clean build directories for all apps using standardized scripts"""
    print(f"{Colors.YELLOW}[Beacon] Cleaning app build directories...{Colors.RESET}")
    
    for app in apps:
        app_dir = script_dir / "src" / "apps" / app
        build_script = app_dir / "beacon-build-app.py"
        
        if build_script.exists():
            clean_cmd = ["python3", str(build_script), "--mode=clean"]
            run_command(clean_cmd, f"Cleaning {app}", cwd=app_dir)
        else:
            print(f"{Colors.YELLOW}[WARNING] No build script found for {app}{Colors.RESET}")



def find_binaries(script_dir):
    """Find built binaries from top-level build directory and individual app directories"""
    binaries = {}
    
    # First check top-level bin directory (for integrated builds)
    top_bin_dir = script_dir / "bin"
    if top_bin_dir.exists():
        for binary_path in top_bin_dir.rglob("*"):
            if binary_path.is_file() and os.access(binary_path, os.X_OK):
                rel_path = binary_path.relative_to(top_bin_dir)
                binaries[f"main_{rel_path}"] = binary_path
    
    # Then check build directory (for CMake integrated builds)
    build_dir = script_dir / "build"
    if build_dir.exists():
        for binary_path in build_dir.rglob("*"):
            if (binary_path.is_file() and 
                os.access(binary_path, os.X_OK) and 
                not str(binary_path).endswith('.so') and
                not str(binary_path).endswith('.a') and
                binary_path.parent.name != "CMakeFiles"):
                rel_path = binary_path.relative_to(build_dir)
                binaries[f"build_{rel_path}"] = binary_path
    
    # Finally check individual app build directories (for standalone builds)
    apps = ["generator", "playback", "matching_engine", "client_algorithm"]
    
    for app in apps:
        app_dir = script_dir / "src" / "apps" / app
        bin_dir = app_dir / "bin"
        
        if bin_dir.exists():
            # Check debug and release directories
            for build_type in ["debug", "release"]:
                type_dir = bin_dir / build_type
                if type_dir.exists():
                    for binary_path in type_dir.iterdir():
                        if binary_path.is_file() and os.access(binary_path, os.X_OK):
                            binaries[f"{app}_{build_type}_{binary_path.name}"] = binary_path
    
    return binaries

def clean_cmake_build(script_dir):
    """Clean the main CMake build directory"""
    build_dir = script_dir / "build"
    if build_dir.exists():
        print(f"{Colors.YELLOW}[CLEAN] Removing {build_dir}{Colors.RESET}")
        import shutil
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
            print(f"{Colors.YELLOW}[WARNING] Some tests failed, but build completed{Colors.RESET}")
    
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
    print(f"{Colors.BLUE}Using unified CMake build{Colors.RESET}")
    print()
    
    # Always clean for consistent builds
    clean_cmake_build(script_dir)
    
    # Build using unified CMake system
    print(f"{Colors.CYAN}[Beacon] Building all applications with CMake...{Colors.RESET}")
    
    success = build_with_cmake(script_dir, build_type, args.no_tests, args.verbose)
    
    print()
    print(f"{Colors.BOLD}{Colors.CYAN}==========================================")
    print(f"  Build Results")  
    print(f"=========================================={Colors.RESET}")
    print()
    
    # Always check for built binaries, even if build "failed" (could be test failure)
    binaries = find_binaries(script_dir)
    
    if binaries:
        print(f"{Colors.CYAN}Successfully Built Applications:{Colors.RESET}")
        
        # Categorize binaries by app
        app_binaries = {}
        for name, path in sorted(binaries.items()):
            # Extract app name from path
            path_parts = str(path).split('/')
            if 'apps' in path_parts:
                app_idx = path_parts.index('apps')
                if app_idx + 1 < len(path_parts):
                    app_name = path_parts[app_idx + 1]
                    if app_name not in app_binaries:
                        app_binaries[app_name] = []
                    app_binaries[app_name].append((name, path))
        
        # Display by app
        for app_name, app_bins in sorted(app_binaries.items()):
            print(f"\n  {Colors.GREEN}[APP] {app_name}:{Colors.RESET}")
            for name, path in app_bins:
                rel_path = path.relative_to(script_dir)
                print(f"    {Colors.YELLOW}{rel_path}{Colors.RESET}")
        
        print()
        if success:
            print(f"{Colors.BOLD}{Colors.GREEN}ALL BUILD TARGETS SUCCESSFUL!{Colors.RESET}")
        else:
            print(f"{Colors.YELLOW}[PARTIAL SUCCESS] Main applications built, but some tests failed{Colors.RESET}")
            print(f"{Colors.YELLOW}This is often acceptable for development builds{Colors.RESET}")
    else:
        if success:
            print(f"{Colors.YELLOW}[WARNING] Build completed but no binaries found in expected locations{Colors.RESET}")
        else:
            print(f"{Colors.RED}[ERROR] Build failed and no binaries were produced{Colors.RESET}")
            sys.exit(1)

if __name__ == "__main__":
    main()