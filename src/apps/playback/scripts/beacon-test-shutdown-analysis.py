#!/usr/bin/env python3
"""
Comprehensive Test Shutdown Analysis
Verifies that all generator and playback tests shut down properly without conflicts.
"""

import subprocess
import time
import sys
from pathlib import Path

def run_tests_with_monitoring(test_type, script_path):
    """Run tests while monitoring for proper shutdown"""
    print(f"\n🧪 Testing {test_type.upper()} shutdown behavior...")
    
    # Record processes before test
    before_result = subprocess.run(["ps", "aux"], capture_output=True, text=True)
    before_processes = set(before_result.stdout.split('\n'))
    
    # Run the test
    start_time = time.time()
    try:
        result = subprocess.run([
            "python3", str(script_path)
        ], capture_output=True, text=True, timeout=30)
        
        duration = time.time() - start_time
        
        # Check processes after test
        time.sleep(1)  # Give processes time to shut down
        after_result = subprocess.run(["ps", "aux"], capture_output=True, text=True)
        after_processes = set(after_result.stdout.split('\n'))
        
        # Look for new processes
        new_processes = after_processes - before_processes
        beacon_processes = [p for p in new_processes if 'beacon' in p.lower() or 'playback' in p.lower() or 'generator' in p.lower()]
        
        # Analyze results
        passed_tests = result.stdout.count("PASSED")
        failed_tests = result.stdout.count("FAILED")
        
        print(f"   ⏱️  Duration: {duration:.1f}s")
        print(f"   ✅ Tests passed: {passed_tests}")
        print(f"   ❌ Tests failed: {failed_tests}")
        print(f"   🔄 Exit code: {result.returncode}")
        
        if beacon_processes:
            print(f"   ⚠️  {len(beacon_processes)} lingering beacon process(es)")
            for proc in beacon_processes[:3]:  # Show first 3
                print(f"      {proc[:80]}...")
        else:
            print(f"   ✅ No lingering processes detected")
            
        # Check ports
        port_result = subprocess.run(["lsof", "-i", ":12345"], capture_output=True, text=True)
        if port_result.returncode == 0:
            print(f"   ⚠️  Port 12345 still in use")
        else:
            print(f"   ✅ Network ports clean")
            
        return {
            'type': test_type,
            'passed': passed_tests,
            'failed': failed_tests,
            'duration': duration,
            'exit_code': result.returncode,
            'lingering_processes': len(beacon_processes),
            'clean_shutdown': len(beacon_processes) == 0 and port_result.returncode != 0
        }
        
    except subprocess.TimeoutExpired:
        print(f"   ❌ Tests timed out after 30s")
        return {
            'type': test_type,
            'passed': 0,
            'failed': 0,
            'duration': 30.0,
            'exit_code': -1,
            'lingering_processes': -1,
            'clean_shutdown': False
        }

def main():
    print("🔬 Comprehensive Test Shutdown Analysis")
    print("=" * 60)
    
    project_root = Path(__file__).parent.parent.parent.parent.parent
    
    # Test paths
    generator_tests = project_root / "src" / "apps" / "generator" / "scripts" / "beacon-run-tests.py"
    playback_tests = project_root / "src" / "apps" / "playback" / "scripts" / "beacon-run-tests.py"
    
    results = []
    
    # Test generator
    if generator_tests.exists():
        results.append(run_tests_with_monitoring("generator", generator_tests))
    else:
        print("⚠️  Generator tests not found")
    
    # Test playback
    if playback_tests.exists():
        results.append(run_tests_with_monitoring("playback", playback_tests))
    else:
        print("⚠️  Playback tests not found")
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 SHUTDOWN ANALYSIS SUMMARY")
    print("=" * 60)
    
    total_passed = sum(r['passed'] for r in results)
    total_failed = sum(r['failed'] for r in results)
    clean_shutdowns = sum(1 for r in results if r['clean_shutdown'])
    
    for result in results:
        status = "✅" if result['clean_shutdown'] else "⚠️ "
        print(f"{status} {result['type'].upper()}: {result['passed']} passed, {result['failed']} failed, "
              f"{result['duration']:.1f}s, clean shutdown: {result['clean_shutdown']}")
    
    print(f"\n📈 OVERALL: {total_passed} tests passed, {total_failed} tests failed")
    print(f"🧹 CLEANUP: {clean_shutdowns}/{len(results)} test suites had clean shutdowns")
    
    if clean_shutdowns == len(results):
        print("\n🎉 ALL TEST SUITES SHUT DOWN CLEANLY!")
        print("✅ No process leaks or port conflicts detected")
        return 0
    else:
        print(f"\n⚠️  {len(results) - clean_shutdowns} test suite(s) had shutdown issues")
        print("💡 Consider adding cleanup logic to ensure proper shutdown")
        return 1

if __name__ == "__main__":
    exit(main())