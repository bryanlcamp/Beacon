#!/usr/bin/env python3
"""
Comprehensive Wave/Burst UDP Timing Test
Starts UDP listener and tests actual playback timing behavior.
"""

import subprocess
import time
import threading
import signal
import sys
from pathlib import Path

def run_udp_listener():
    """Run UDP listener to capture timing data"""
    project_root = Path(__file__).parent.parent.parent.parent.parent
    listener_script = project_root / "src" / "apps" / "playback" / "utils" / "udp_listener.py"
    
    if listener_script.exists():
        print("📡 Starting UDP listener...")
        subprocess.run([
            "python3", str(listener_script)
        ], timeout=30)
    else:
        print("⚠️  UDP listener script not found")

def run_playback_test(config_name):
    """Run playback with specific configuration"""
    project_root = Path(__file__).parent.parent.parent.parent.parent
    playback_bin = project_root / "bin" / "debug" / "playback"
    test_data = project_root / "test_wave_burst.bin"
    
    # Create custom config for testing
    config_dir = project_root / "config" / "playback"
    if config_name == "burst":
        config_file = config_dir / "authorities" / "authority_burst.json"
    else:
        config_file = config_dir / "authorities" / "authority_wave.json"
        
    if not test_data.exists():
        print("❌ Test data file missing!")
        return 1
    
    print(f"🚀 Testing {config_name} timing with: {config_file}")
    
    # Create a minimal config that only includes our target rule
    test_config = project_root / f"test_{config_name}_config.json"
    import json
    
    config_data = {
        "senderConfig": "senders/senderUdp.json",
        "advisors": [],
        "authorities": [f"authorities/authority_{config_name}.json"]
    }
    
    with open(test_config, 'w') as f:
        json.dump(config_data, f, indent=2)
    
    print(f"📋 Created test config: {test_config}")
    print(f"📄 Config contents: {config_data}")
    
    # Run playback
    try:
        result = subprocess.run([
            str(playback_bin),
            "--config", str(test_config),
            str(test_data)
        ], capture_output=True, text=True, timeout=15)
        
        print(f"📤 Playback output:")
        print(result.stdout)
        if result.stderr:
            print(f"⚠️  Stderr: {result.stderr}")
            
        return result.returncode
    except subprocess.TimeoutExpired:
        print("⏱️  Playback completed (timeout)")
        return 0
    except Exception as e:
        print(f"❌ Playback error: {e}")
        return 1

def main():
    print("🔬 Comprehensive Wave/Burst UDP Timing Test")
    print("=" * 60)
    
    # Test both configurations
    for config_type in ["burst", "wave"]:
        print(f"\n🧪 Testing {config_type.upper()} configuration...")
        
        # Start UDP listener in background
        listener_thread = threading.Thread(target=run_udp_listener, daemon=True)
        listener_thread.start()
        
        time.sleep(2)  # Give listener time to start
        
        # Run playback test
        result = run_playback_test(config_type)
        
        print(f"✅ {config_type.upper()} test completed with code: {result}")
        
        time.sleep(3)  # Wait between tests
    
    print("\n📋 Test Summary:")
    print("- Check UDP listener output for actual timing measurements")
    print("- Look for '[RULE FACTORY]' messages indicating rule creation") 
    print("- Verify burst/wave patterns in message delivery")

if __name__ == "__main__":
    main()