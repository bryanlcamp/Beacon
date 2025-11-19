#!/usr/bin/env python3
"""
Beacon Playback Debug Runner Script
Runs the debug build of the Beacon playback with provided arguments.
"""

import subprocess
import sys
from pathlib import Path

def main():
    # Get project root (4 levels up from this script: scripts -> playback -> apps -> src -> root)
    project_root = Path(__file__).parent.parent.parent.parent.parent
    debug_binary = project_root / "bin" / "debug" / "playback"
    
    if not debug_binary.exists():
        print("❌ Debug binary not found!")
        print("   Run: python3 beacon-build-debug.py")
        return 1
    
    # Pass all command line arguments to the playback
    args = sys.argv[1:]  # Skip script name
    
    print(f"🐛 Running debug playback: {debug_binary}")
    if args:
        print(f"📝 Arguments: {' '.join(args)}")
    else:
        print("📝 No arguments provided")
        print("   Usage: python3 beacon-run-debug.py [--config <config_file>] <binary_file>")
        print("   Example: python3 beacon-run-debug.py --config ../../config/playback/default.json output.bin")
    
    try:
        # Run with all arguments and inherit stdout/stderr for real-time output
        result = subprocess.run([str(debug_binary)] + args, cwd=project_root)
        return result.returncode
    except KeyboardInterrupt:
        print("\n⚠️  Interrupted by user")
        return 130
    except Exception as e:
        print(f"💥 Error running playback: {e}")
        return 1

if __name__ == "__main__":
    exit(main())