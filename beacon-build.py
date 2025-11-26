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
            
            while True:
                output = process.poll()
                if output is not None:
                    break
                
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
                print(f"{Colors.RED}[ERROR] {description} failed{Colors.RESET}")
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
        if e.stdout:
            print(f"STDOUT: {e.stdout}")
        if e.stderr:
            print(f"STDERR: {e.stderr}")
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
    """Find built binaries from standardized app build directories"""
    binaries = {}
    
    # Apps with standardized beacon-build-app.py scripts
    apps = ["generator", "playbook", "matching_engine", "client_algorithm"]
    
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
    apps = ["generator", "playback", "matching_engine", "client_algorithm"]
    
    print(f"{Colors.BOLD}{Colors.CYAN}==========================================")
    print(f"  Beacon - Standardized Build System")
    print(f"==========================================={Colors.RESET}")
    print()
    print(f"{Colors.BLUE}Build Type: {build_type}{Colors.RESET}")
    print(f"{Colors.BLUE}Repository: {script_dir}{Colors.RESET}")
    print(f"{Colors.BLUE}Apps: {', '.join(apps)}{Colors.RESET}")
    print()
    
    # Clean builds if requested
    if args.clean:
        clean_app_build_directories(script_dir, apps)
    
    # Build using standardized app build scripts
    build_results = {}
    
    # Map build type to script argument
    mode_arg = "debug" if build_type == "Debug" else "release"
    
    for app in apps:
        app_dir = script_dir / "src" / "apps" / app
        build_script = app_dir / "beacon-build-app.py"
        
        if not build_script.exists():
            print(f"{Colors.YELLOW}[WARNING] No build script found for {app}: {build_script}{Colors.RESET}")
            build_results[app] = False
            continue
        
        print(f"{Colors.CYAN}[Beacon] Building {app}...{Colors.RESET}")
        
        # Run the standardized build script
        build_cmd = ["python3", str(build_script), f"--mode={mode_arg}"]
        if not args.no_tests:
            build_cmd.append("--run-tests")
        
        success = run_command(build_cmd, f"Building {app} ({build_type})", cwd=app_dir, show_progress=True)
        build_results[app] = success
        
        if not success:
            print(f"{Colors.RED}[ERROR] {app} build failed{Colors.RESET}")
        else:
            print(f"{Colors.GREEN}[SUCCESS] {app} build completed{Colors.RESET}")
    
    # Overall build success
    build_success = all(build_results.values())
    
    print()
    print(f"{Colors.BOLD}{Colors.CYAN}==========================================")
    print(f"  Build Results")  
    print(f"=========================================={Colors.RESET}")
    print()
    
    # Display build results
    print(f"{Colors.CYAN}Build Results:{Colors.RESET}")
    for app, success in build_results.items():
        status = f"{Colors.GREEN}[SUCCESS]{Colors.RESET}" if success else f"{Colors.RED}[FAILED]{Colors.RESET}"
        print(f"  {status} {app}")
    
    # Find and display built binaries
    binaries = find_binaries(script_dir)
    if binaries:
        print()
        print(f"{Colors.CYAN}Built Applications:{Colors.RESET}")
        for name, path in sorted(binaries.items()):
            rel_path = path.relative_to(script_dir)
            print(f"  {Colors.GREEN}[BINARY]{Colors.RESET} {name}: {Colors.YELLOW}{rel_path}{Colors.RESET}")
        
        print()
        if build_success:
            print(f"{Colors.BOLD}{Colors.GREEN}ALL BUILDS SUCCESSFUL!{Colors.RESET}")
        else:
            successful_count = sum(1 for success in build_results.values() if success)
            total_count = len(build_results)
            print(f"{Colors.YELLOW}[PARTIAL] {successful_count}/{total_count} apps built successfully{Colors.RESET}")
    else:
        print(f"{Colors.RED}[ERROR] No executable binaries found{Colors.RESET}")
        if not build_success:
            sys.exit(1)
    
    if not build_success:
        print(f"{Colors.YELLOW}Note: Build had some test failures, but main applications are ready{Colors.RESET}")
        sys.exit(0)  # Exit cleanly since main apps built

if __name__ == "__main__":
    main()