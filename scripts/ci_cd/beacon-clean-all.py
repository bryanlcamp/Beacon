#!/usr/bin/env python3
"""
Beacon CI/CD Clean Script
Removes build artifacts and temporary files
"""

import shutil
import os
from pathlib import Path

def clean_path(path_to_clean, description):
    """Clean a single path with error handling"""
    path_to_clean = Path(path_to_clean)
    try:
        if path_to_clean.exists():
            if path_to_clean.is_dir():
                shutil.rmtree(path_to_clean)
                print(f"[REMOVED] {description}: {path_to_clean}")
            else:
                path_to_clean.unlink()
                print(f"[REMOVED] {description}: {path_to_clean}")
        else:
            print(f"[SKIPPED] {description}: {path_to_clean} (not found)")
    except Exception as e:
        print(f"[ERROR] Failed to remove {description}: {e}")

def main():
    """Clean all build artifacts"""
    repo_root = Path(__file__).resolve().parents[2]
    print(f"[CI/CD] Cleaning Beacon Trading System")
    print(f"[CI/CD] Repository root: {repo_root}")
    
    # Change to repo root
    os.chdir(repo_root)
    
    # Clean unified build directories
    clean_path("build", "Main build directory")
    clean_path("build-test", "Test build directory")
    clean_path("build-release", "Release build directory")
    clean_path("build-fresh", "Fresh build directory")
    
    # Clean binary directories
    clean_path("bin/debug", "Debug binaries")
    clean_path("bin/release", "Release binaries")
    
    # Clean output directories  
    clean_path("outputs", "Generated outputs")
    
    # Clean log directories
    clean_path("logs", "Log files")
    clean_path("scripts/logs", "Script log files")
    
    # Clean any CMake cache files
    clean_path("CMakeCache.txt", "CMake cache")
    clean_path("cmake_install.cmake", "CMake install script")
    clean_path("Makefile", "Generated Makefile")
    
    # Clean generated data files
    clean_path("market_data.bin", "Generated market data")
    
    # Clean temp config files
    import glob
    for temp_file in glob.glob("outputs/temp_*.json"):
        clean_path(temp_file, "Temporary config file")
    
    # Recreate outputs directory with gitkeep
    outputs_dir = Path("outputs")
    outputs_dir.mkdir(exist_ok=True)
    gitkeep_file = outputs_dir / ".gitkeep"
    if not gitkeep_file.exists():
        with open(gitkeep_file, 'w') as f:
            f.write("# This file ensures the outputs directory is tracked by git\n")
        print(f"[CREATED] .gitkeep file in outputs/")
    
    print(f"[CI/CD] ✅ Clean complete!")

if __name__ == "__main__":
    main()