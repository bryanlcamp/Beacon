#!/usr/bin/env python3
"""
Beacon Test Runner Script
Runs all tests for the Beacon generator application.
"""

import subprocess
import sys
from pathlib import Path

def main():
    # Get project root (4 levels up from this script: scripts -> generator -> apps -> src -> root)
    project_root = Path(__file__).parent.parent.parent.parent.parent
    build_dir = project_root / "build"
    
    if not build_dir.exists():
        print("❌ Build directory not found. Please build the project first.")
        print("   Run: python3 beacon-build-debug.py")
        return 1
    
    print("🧪 Running Beacon generator tests...")
    
    # Check if there are any test executables
    test_executables = list(build_dir.glob("**/test_*"))
    test_executables.extend(list(build_dir.glob("**/*_test")))
    test_executables.extend(list(build_dir.glob("**/tests")))
    
    if not test_executables:
        print("⚠️  No test executables found in build directory.")
        print("   If tests exist, they may need to be built separately.")
        return 0
    
    print(f"🔍 Found {len(test_executables)} test executable(s)")
    
    failed_tests = 0
    passed_tests = 0
    
    for test_exe in test_executables:
        if test_exe.is_file() and test_exe.stat().st_mode & 0o111:  # Check if executable
            print(f"🏃 Running: {test_exe.name}")
            try:
                result = subprocess.run([str(test_exe)], 
                                      capture_output=True, 
                                      text=True, 
                                      cwd=project_root)
                if result.returncode == 0:
                    print(f"✅ {test_exe.name} PASSED")
                    passed_tests += 1
                else:
                    print(f"❌ {test_exe.name} FAILED")
                    print(f"   stdout: {result.stdout}")
                    print(f"   stderr: {result.stderr}")
                    failed_tests += 1
            except Exception as e:
                print(f"💥 Error running {test_exe.name}: {e}")
                failed_tests += 1
    
    print(f"\n📊 Test Summary: {passed_tests} passed, {failed_tests} failed")
    
    if failed_tests > 0:
        print("❌ Some tests failed!")
        return 1
    else:
        print("🎉 All tests passed!")
        return 0

if __name__ == "__main__":
    exit(main())