#!/usr/bin/env python3
"""
Beacon Clean - Quick Cleanup Tool

Convenience wrapper for the full cleanup script.
Usage: python3 scripts/beacon-clean.py
"""

import subprocess
import sys
from pathlib import Path

def main():
    """Run the full cleanup script"""
    script_path = Path(__file__).parent / "ci_cd" / "beacon-clean-all.py"
    
    try:
        result = subprocess.run([sys.executable, str(script_path)], 
                              cwd=Path(__file__).parent)
        sys.exit(result.returncode)
    except KeyboardInterrupt:
        print("\n🛑 Cleanup cancelled")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error running cleanup: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()