#!/usr/bin/env python3
"""
Beacon Release Runner Script
Runs the release build of the Beacon generator with provided arguments.
"""

import subprocess
import sys
from pathlib import Path

def main():
    # Get project root (4 levels up from this script: scripts -> generator -> apps -> src -> root)
    project_root = Path(__file__).parent.parent.parent.parent.parent
    release_binary = project_root / "bin" / "release" / "generator"
    
    if not release_binary.exists():
        print("❌ Release binary not found!")
        print("   Run: python3 beacon-build-release.py")
        return 1
    
    # Pass all command line arguments to the generator
    args = sys.argv[1:]  # Skip script name
    
    print(f"🚀 Running release generator: {release_binary}")
    if args:
        print(f"📝 Arguments: {' '.join(args)}")
    else:
        print("📝 No arguments provided")
        print("   Usage: python3 beacon-run-release.py <config_file> <output_file>")
        print("   Example: python3 beacon-run-release.py ../../config/generator/sample_config.json output.data")
    
    try:
        # Run with all arguments and inherit stdout/stderr for real-time output
        result = subprocess.run([str(release_binary)] + args, cwd=project_root)
        return result.returncode
    except KeyboardInterrupt:
        print("\n⚠️  Interrupted by user")
        return 130
    except Exception as e:
        print(f"💥 Error running generator: {e}")
        return 1

if __name__ == "__main__":
    exit(main())