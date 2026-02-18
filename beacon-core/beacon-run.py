#!/usr/bin/env python3
"""
🚀 Beacon Trading System - Ultimate Single Command Launcher 🚀

Usage:
    python3 beacon-run.py -i config/system/startBeacon.json

The dream interface:
- ONE command
- ONE configuration file
- EVERYTHING just works

Configuration contains ALL components:
- Generator, Playback, Matching Engine, Client Algorithm
- Network settings, Protocol selection, Algorithm parameters
- Monitoring, Logging, Risk controls
"""

import argparse
import json
import os
import sys
import signal
import subprocess
import tempfile
import time
import threading
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional

class Colors:
    RESET = '\033[0m'
    BOLD = '\033[1m'
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    MAGENTA = '\033[95m'

class BeaconUnified:
    def __init__(self, config_file: str):
        self.config_file = config_file
        self.config = {}
        self.processes = {}
        self.temp_dir = None
        self.start_time = None

        # Setup paths
        self.beacon_root = Path(__file__).parent
        self.build_dir = self.beacon_root / "build"
        self.bin_dir = self.build_dir / "src" / "apps"

        # Required binaries for each component
        self.required_binaries = {
            'matching_engine': self.bin_dir / "matching_engine" / "matching_engine",
            'client_algorithm': self.bin_dir / "client_algorithm" / "client_algorithm",
            'playback': self.bin_dir / "playback" / "playback",
            'generator': self.bin_dir / "generator" / "generator"
        }

        # Signal handling
        signal.signal(signal.SIGINT, self._shutdown_handler)
        signal.signal(signal.SIGTERM, self._shutdown_handler)

    def _shutdown_handler(self, signum, frame):
        print(f"\n{Colors.YELLOW}[BEACON] Shutting down...{Colors.RESET}")
        self.shutdown()
        sys.exit(0)

    def _log(self, level: str, component: str, message: str):
        timestamp = datetime.now().strftime('%H:%M:%S.%f')[:-3]
        color = {'INFO': Colors.CYAN, 'SUCCESS': Colors.GREEN, 'ERROR': Colors.RED, 'WARN': Colors.YELLOW}.get(level, Colors.RESET)
        print(f"{color}[{timestamp}] [{level:7}] [{component:12}] {message}{Colors.RESET}")

    def load_config(self) -> bool:
        """Load the unified configuration file"""
        try:
            with open(self.config_file, 'r') as f:
                self.config = json.load(f)
            self._log("SUCCESS", "CONFIG", f"Loaded configuration from {self.config_file}")
            return True
        except Exception as e:
            self._log("ERROR", "CONFIG", f"Failed to load config: {e}")
            return False

    def ensure_system_built(self) -> bool:
        """Check if system is built, and build if necessary"""
        self._log("INFO", "BUILD", "🔍 Checking build status...")

        missing_binaries = []
        for component, binary_path in self.required_binaries.items():
            if not binary_path.exists():
                missing_binaries.append(component)

        if missing_binaries:
            self._log("WARN", "BUILD", f"Missing binaries: {', '.join(missing_binaries)}")
            return self.build_system()
        else:
            self._log("SUCCESS", "BUILD", "All binaries present")
            return True

    def build_system(self) -> bool:
        """Build the Beacon trading system"""
        try:
            self._log("INFO", "BUILD", "🔨 Building Beacon trading system...")

            build_script = self.beacon_root / "beacon-build.py"
            if not build_script.exists():
                self._log("ERROR", "BUILD", "Build script not found")
                return False

            # Run the build script
            result = subprocess.run([
                sys.executable, str(build_script), "--release"
            ], cwd=self.beacon_root, capture_output=True, text=True)

            if result.returncode == 0:
                self._log("SUCCESS", "BUILD", "Build completed successfully")
                return True
            else:
                self._log("ERROR", "BUILD", f"Build failed: {result.stderr}")
                return False

        except Exception as e:
            self._log("ERROR", "BUILD", f"Build error: {e}")
            return False

    def start_component(self, name: str, binary: str, args: List[str] = None) -> bool:
        """Start a single component"""
        try:
            cmd = [binary]
            if args:
                cmd.extend(args)

            self._log("INFO", name.upper(), f"Starting: {' '.join(cmd)}")

            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )

            self.processes[name] = process
            self._log("SUCCESS", name.upper(), f"Started (PID: {process.pid})")
            return True

        except Exception as e:
            self._log("ERROR", name.upper(), f"Failed to start: {e}")
            return False

    def start_system(self) -> bool:
        """Start all configured components"""
        self._log("INFO", "SYSTEM", "🚀 LAUNCHING BEACON TRADING SYSTEM")

        # For now, start a simple test sequence
        # TODO: Parse actual config and start components based on configuration
        success = True

        return success

    def monitor_system(self, duration: int):
        """Monitor running system"""
        self._log("INFO", "MONITOR", f"Monitoring system for {duration} seconds...")
        time.sleep(duration)

    def shutdown(self):
        """Shutdown all components"""
        self._log("INFO", "SHUTDOWN", "Stopping all components...")

        for name, process in self.processes.items():
            try:
                process.terminate()
                process.wait(timeout=5)
                self._log("SUCCESS", "SHUTDOWN", f"Stopped {name}")
            except:
                process.kill()
                self._log("WARN", "SHUTDOWN", f"Force killed {name}")

    def run(self, duration: Optional[int] = None) -> bool:
        """Main execution entrypoint"""
        self.start_time = datetime.now()

        # Load configuration
        if not self.load_config():
            return False

        # Ensure system is built
        if not self.ensure_system_built():
            return False

        # Start the system
        if not self.start_system():
            return False

        try:
            if duration:
                self.monitor_system(duration)
            else:
                # Run indefinitely until interrupted
                while True:
                    time.sleep(1)
        except KeyboardInterrupt:
            pass
        finally:
            self.shutdown()

        return True

def main():
    parser = argparse.ArgumentParser(description='🚀 Beacon Unified Trading System')
    parser.add_argument('-i', '--input', required=True, help='Unified configuration JSON file')
    parser.add_argument('-d', '--duration', type=int, help='Runtime duration (seconds)')

    args = parser.parse_args()

    if not os.path.exists(args.input):
        print(f"{Colors.RED}Error: Configuration file {args.input} not found{Colors.RESET}")
        return 1

    beacon = BeaconUnified(args.input)
    success = beacon.run(args.duration)

    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
