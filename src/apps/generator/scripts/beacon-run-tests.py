#!/usr/bin/env python3
"""
Beacon Generator Test Runner Script
Runs generator-specific tests only (TestConfigProvider, TestStatsManager, etc.)
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
    
    # Generator-specific test executables in the generator_tests directory
    generator_test_dir = build_dir / "tests" / "generator_tests"
    
    if not generator_test_dir.exists():
        print("❌ Generator tests directory not found.")
        print("   Generator tests may not be built yet.")
        return 1
    
    # Look for generator test executables (Test*)
    test_executables = list(generator_test_dir.glob("Test*"))
    
    if not test_executables:
        print("⚠️  No generator test executables found.")
        print("   Generator tests may need to be built first.")
        print("   Try: cmake --build build --target TestConfigProvider")
        return 0
    
    print(f"🔍 Found {len(test_executables)} generator test executable(s)")
    
    failed_tests = 0
    passed_tests = 0
    
    # Generator test names for better output
    generator_tests = ["TestConfigProvider", "TestStatsManager", "TestCsvSerializer", 
                      "TestMessageGenerator", "TestGeneratorIntegration"]
    
    for test_exe in test_executables:
        if test_exe.is_file() and test_exe.stat().st_mode & 0o111:  # Check if executable
            test_name = test_exe.name
            print(f"🧪 Running: {test_name}")
            try:
                result = subprocess.run([str(test_exe)], 
                                      capture_output=True, 
                                      text=True, 
                                      cwd=project_root,
                                      timeout=120)  # 2 minute timeout
                if result.returncode == 0:
                    # Count actual tests passed from GoogleTest output
                    test_output = result.stdout
                    test_count = "unknown"
                    
                    # Look for pattern like "[  PASSED  ] 14 tests."
                    lines = test_output.split('\n')
                    for line in lines:
                        if "[  PASSED  ]" in line and "tests." in line:
                            parts = line.strip().split()
                            for i, part in enumerate(parts):
                                if part == "PASSED" and i + 2 < len(parts) and parts[i + 2] == "tests.":
                                    test_count = parts[i + 1]
                                    break
                            break
                    
                    if test_count != "unknown":
                        print(f"✅ {test_name} PASSED ({test_count} individual tests)")
                    else:
                        print(f"✅ {test_name} PASSED")
                    passed_tests += 1
                else:
                    print(f"❌ {test_name} FAILED")
                    if result.stdout:
                        print(f"   stdout: {result.stdout[:500]}...")  # Truncate long output
                    if result.stderr:
                        print(f"   stderr: {result.stderr[:500]}...")
                    failed_tests += 1
            except subprocess.TimeoutExpired:
                print(f"⏱️  {test_name} TIMEOUT (exceeded 2 minutes)")
                failed_tests += 1
            except Exception as e:
                print(f"💥 Error running {test_name}: {e}")
                failed_tests += 1
    
    print(f"\n📊 Generator Test Summary: {passed_tests} passed, {failed_tests} failed")
    
    if failed_tests > 0:
        print("❌ Some generator tests failed!")
        return 1
    else:
        print("🎉 All generator tests passed!")
        return 0

if __name__ == "__main__":
    exit(main())