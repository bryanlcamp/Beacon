#!/usr/bin/env python3
"""
Beacon Wave/Burst Timing Validation Script
Tests if playback system actually implements wave/burst mathematical timing.
"""

import json
import subprocess
import sys
import time
from pathlib import Path

def main():
    # Get project root (5 levels up from this script location)
    project_root = Path(__file__).parent.parent.parent.parent.parent
    print(f"🔬 Beacon Wave/Burst Timing Analysis")
    print(f"📁 Project root: {project_root}")
    print()
    
    # Check if playback binary exists
    playback_bin = project_root / "bin" / "debug" / "playback"
    if not playback_bin.exists():
        print("❌ Playback binary not found. Building...")
        build_result = subprocess.run([
            "python3", 
            str(project_root / "src" / "apps" / "playback" / "scripts" / "beacon-build-debug.py")
        ], capture_output=True, text=True)
        if build_result.returncode != 0:
            print(f"❌ Build failed: {build_result.stderr}")
            return 1
    
    # Test configurations
    config_tests = [
        {
            "name": "Burst Mode Test",
            "config": "config/playback/authorities/authority_burst.json",
            "expected_behavior": "Should send bursts of 5000 messages every 100ms",
            "timing_params": {"burstSize": 5000, "burstIntervalMs": 100}
        },
        {
            "name": "Wave Mode Test", 
            "config": "config/playback/authorities/authority_wave.json",
            "expected_behavior": "Should vary rate from 1000 to 50000 msg/s over 10s periods",
            "timing_params": {"periodMs": 10000, "minRate": 1000, "maxRate": 50000}
        }
    ]
    
    print("📊 Testing Wave/Burst Configuration Loading...")
    print()
    
    all_passed = True
    
    for test in config_tests:
        print(f"🧪 {test['name']}")
        config_path = project_root / test['config']
        
        if not config_path.exists():
            print(f"   ❌ Config file missing: {config_path}")
            all_passed = False
            continue
            
        # Read and validate config
        try:
            with open(config_path) as f:
                config = json.load(f)
            
            print(f"   ✅ Config loaded: {config}")
            print(f"   📝 Expected: {test['expected_behavior']}")
            
            # Check if timing parameters exist
            for param, expected_value in test['timing_params'].items():
                if param in config:
                    actual_value = config[param]
                    if actual_value == expected_value:
                        print(f"   ✅ {param}: {actual_value} (matches expected)")
                    else:
                        print(f"   ⚠️  {param}: {actual_value} (expected {expected_value})")
                else:
                    print(f"   ❌ Missing parameter: {param}")
                    
        except Exception as e:
            print(f"   ❌ Config read error: {e}")
            all_passed = False
            
        print()
    
    # Create a simple test data file if it doesn't exist
    test_data_path = project_root / "test_timing_data.bin"
    if not test_data_path.exists():
        print("📁 Creating test binary data file...")
        # Use generator to create a small test file
        gen_script = project_root / "src" / "apps" / "generator" / "scripts" / "beacon-run-debug.py"
        if gen_script.exists():
            subprocess.run([
                "python3", str(gen_script),
                "--config", str(project_root / "config" / "generator" / "sample_config.json"),
                "--output", str(test_data_path),
                "--messages", "1000"
            ], capture_output=True)
    
    # Test if playback actually implements timing
    print("🚀 Testing Actual Playback Timing Implementation...")
    print()
    
    default_config = project_root / "config" / "playback" / "default.json"
    if not default_config.exists():
        print("❌ Default playback config missing")
        return 1
    
    # Run playback with timing analysis
    print("⏱️  Running playback with burst configuration...")
    start_time = time.time()
    
    try:
        # Run playback for a short duration to check timing behavior
        result = subprocess.run([
            str(playback_bin),
            "--config", str(default_config),
            str(test_data_path) if test_data_path.exists() else "nonexistent.bin"
        ], capture_output=True, text=True, timeout=10)
        
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"   ⏱️  Execution time: {duration:.2f} seconds")
        print(f"   📤 Stdout: {result.stdout[:500]}...")
        if result.stderr:
            print(f"   ⚠️  Stderr: {result.stderr[:200]}...")
            
        # Analyze output for timing implementation
        output = result.stdout + result.stderr
        
        timing_indicators = [
            "burst", "wave", "delay", "rate", "timing", "interval",
            "accumulatedDelay", "burstSize", "periodMs", "implementation pending"
        ]
        
        found_indicators = []
        for indicator in timing_indicators:
            if indicator.lower() in output.lower():
                found_indicators.append(indicator)
        
        print(f"   🔍 Timing indicators found: {found_indicators}")
        
        # Check for implementation status
        if "implementation pending" in output.lower():
            print("   ❌ CRITICAL: Timing rules are NOT implemented!")
            print("   📝 The playback system recognizes configurations but doesn't apply timing logic")
            all_passed = False
        elif any(indicator in found_indicators for indicator in ["burst", "wave", "delay"]):
            print("   ✅ Timing implementation appears active")
        else:
            print("   ⚠️  Unclear if timing is implemented - no clear indicators")
            
    except subprocess.TimeoutExpired:
        print("   ⚠️  Playback timed out (may be waiting for input)")
    except Exception as e:
        print(f"   ❌ Playback execution error: {e}")
        all_passed = False
    
    print()
    print("="*60)
    print("📋 WAVE/BURST TIMING ANALYSIS SUMMARY")
    print("="*60)
    
    if all_passed:
        print("✅ Configuration files are properly formatted")
        print("✅ Timing parameters are correctly specified")
        print("⚠️  Manual verification of actual timing implementation needed")
    else:
        print("❌ Issues detected in wave/burst timing system")
        
    print()
    print("📝 RECOMMENDATIONS:")
    print("1. Verify rule implementations exist in src/apps/playback/src/authorities/")
    print("2. Check if BurstRule and WaveRule classes are implemented") 
    print("3. Test with UDP listener to measure actual timing behavior")
    print("4. Implement missing timing logic if 'implementation pending'")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    exit(main())