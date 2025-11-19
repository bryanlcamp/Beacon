#!/usr/bin/env python3
"""
Beacon Playback System Orchestrator
Professional process management and monitoring for the Beacon playback system.
"""

import subprocess
import signal
import sys
import time
import os
from pathlib import Path
from datetime import datetime

class Colors:
    """ANSI color codes for terminal output"""
    RESET = '\033[0m'
    BOLD = '\033[1m'
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'

class PlaybackOrchestrator:
    def __init__(self, base_dir: Path):
        self.base_dir = base_dir
        self.playback = None
        self.start_time = None
        
        # Configuration
        self.mcast_addr = "239.255.0.1"
        self.mcast_port = 12345
        
        # Binary paths
        self.playback_bin = base_dir / "build/src/apps/playback/playback"
        
        # Data paths
        self.data_dir = base_dir / "data"
        self.config_dir = base_dir / "config/playback"
        
        # Default files
        self.default_config = self.config_dir / "default.json"
        self.default_binary = None  # Will be set by user input or discovery
        
        # Setup signal handlers
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
        
    def _signal_handler(self, signum, frame):
        """Handle Ctrl+C and termination signals"""
        print(f"\n{Colors.YELLOW}Received signal {signum}, shutting down...{Colors.RESET}")
        self.cleanup()
        sys.exit(0)
        
    def print_banner(self):
        """Print professional startup banner"""
        print()
        print("═" * 70)
        print("  BEACON PLAYBACK SYSTEM - MARKET DATA REPLAY")
        print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("═" * 70)
        print()
        
    def print_config(self, binary_file: str, config_file: str):
        """Print system configuration"""
        print("Configuration:")
        print(f"  Binary File:      {Path(binary_file).name}")
        print(f"  Config:           {Path(config_file).name}")
        print(f"  Multicast:        UDP {self.mcast_addr}:{self.mcast_port}")
        print(f"  Output:           Market data stream")
        print()
        
    def discover_binary_files(self) -> list:
        """Find available binary data files"""
        extensions = ['.bin', '.itch', '.dat']
        files = []
        
        # Check common locations
        search_paths = [
            self.base_dir / "data",
            self.base_dir / "src/apps/generator",
            self.base_dir / "Output.csv".parent,  # Same dir as Output.csv
            self.base_dir,  # Root directory
        ]
        
        for path in search_paths:
            if path.exists():
                for ext in extensions:
                    files.extend(path.glob(f"*{ext}"))
                    
        return sorted(list(set(files)))  # Remove duplicates and sort
        
    def discover_config_files(self) -> list:
        """Find available configuration files"""
        config_files = []
        
        if self.config_dir.exists():
            config_files.extend(self.config_dir.glob("*.json"))
            
        return sorted(config_files)
        
    def select_files(self, binary_file: str = None, config_file: str = None):
        """Interactive file selection or validation"""
        # Handle binary file
        if binary_file and Path(binary_file).exists():
            self.default_binary = Path(binary_file)
        else:
            binary_files = self.discover_binary_files()
            if not binary_files:
                print(f"{Colors.RED}✗ ERROR: No binary data files found{Colors.RESET}")
                print("Expected locations:")
                print("  - data/*.bin, *.itch, *.dat")
                print("  - src/apps/generator/*.bin, *.itch")
                print("  - *.bin, *.itch in root directory")
                return False
                
            if len(binary_files) == 1:
                self.default_binary = binary_files[0]
                print(f"Found binary file: {self.default_binary.name}")
            else:
                print("Available binary files:")
                for i, f in enumerate(binary_files):
                    size = f.stat().st_size if f.exists() else 0
                    size_mb = size / (1024 * 1024)
                    print(f"  {i+1}: {f.name} ({size_mb:.1f} MB)")
                    
                while True:
                    try:
                        choice = input("Select binary file (1-{len(binary_files)}): ").strip()
                        if not choice:  # Default to first
                            self.default_binary = binary_files[0]
                            break
                        idx = int(choice) - 1
                        if 0 <= idx < len(binary_files):
                            self.default_binary = binary_files[idx]
                            break
                    except (ValueError, IndexError):
                        print("Invalid selection")
                        
        # Handle config file  
        if config_file and Path(config_file).exists():
            self.default_config = Path(config_file)
        else:
            config_files = self.discover_config_files()
            if config_files and self.default_config not in config_files:
                print(f"Available configs: {[f.name for f in config_files]}")
                
        return True
        
    def verify_prerequisites(self) -> bool:
        """Verify all required files exist"""
        checks = [
            ("Playback Binary", self.playback_bin),
            ("Binary Data File", self.default_binary),
            ("Configuration", self.default_config),
        ]
        
        all_exist = True
        for name, path in checks:
            if not path or not path.exists():
                print(f"{Colors.RED}✗ ERROR: {name} not found: {path}{Colors.RESET}")
                all_exist = False
                
        if all_exist:
            # Show file info
            if self.default_binary:
                size = self.default_binary.stat().st_size
                messages = size // 33 if size > 0 else 0
                print(f"{Colors.GREEN}✓ Binary file: {self.default_binary.name} ({messages:,} messages){Colors.RESET}")
                
            print(f"{Colors.GREEN}✓ All prerequisites satisfied{Colors.RESET}")
            print()
            
        return all_exist
        
    def start_playback(self) -> bool:
        """Start the playback system"""
        step_start = time.time()
        print("═" * 70)
        print(f"  Starting Market Data Playback")
        print(f"  {datetime.now().strftime('%H:%M:%S')}")
        print("═" * 70)
        
        # Analyze the binary file
        if self.default_binary.exists():
            file_size = self.default_binary.stat().st_size
            num_messages = file_size // 33  # ITCH messages are 33 bytes
            
            print(f"* Loading binary file: {self.default_binary.name}")
            print(f"    Size:        {file_size:,} bytes")
            print(f"    Messages:    {num_messages:,}")
            print(f"    Format:      ITCH (33-byte messages)")
            print()
            
        print(f"* Configuration: {self.default_config.name}")
        print(f"* UDP Multicast: {self.mcast_addr}:{self.mcast_port}")
        print(f"* Mode:          Configurable (burst/wave/continuous)")
        print()
        
        try:
            print("* Initializing playback engine...")
            
            # Start playback with configuration
            cmd = [
                str(self.playback_bin),
                "--config", str(self.default_config),
                str(self.default_binary)
            ]
            
            print(f"* Command: {' '.join([str(c) for c in cmd])}")
            print()
            
            self.playback = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1  # Line buffered
            )
            
            # Give it a moment to initialize
            time.sleep(1)
            
            # Check if process started successfully
            if self.playback.poll() is not None:
                # Process has already terminated
                output, _ = self.playback.communicate()
                print(f"{Colors.RED}✗ Playback failed to start:{Colors.RESET}")
                if output:
                    print(output)
                return False
                
            print(f"* {Colors.GREEN}✓ Playback started (PID: {self.playback.pid}){Colors.RESET}")
            elapsed = int(time.time() - step_start)
            print(f"* {Colors.GREEN}✓ Initialization complete ({elapsed}s){Colors.RESET}")
            print()
            return True
            
        except Exception as e:
            print(f"{Colors.RED}✗ Failed to start playback: {e}{Colors.RESET}")
            return False
            
    def monitor_playback(self):
        """Monitor playback process and show live output"""
        print("═" * 70)
        print("  ✓✓✓ PLAYBACK ACTIVE ✓✓✓")
        total_startup = int(time.time() - self.start_time)
        print(f"  Total startup time: {total_startup}s")
        print("═" * 70)
        print()
        print("Monitoring playback output...")
        print("Press Ctrl+C to stop")
        print()
        print("-" * 70)
        
        try:
            # Stream output in real-time
            while self.playback and self.playback.poll() is None:
                output = self.playback.stdout.readline()
                if output:
                    print(output.rstrip())
                else:
                    time.sleep(0.1)
                    
        except KeyboardInterrupt:
            print(f"\n{Colors.YELLOW}Interrupt received, stopping playback...{Colors.RESET}")
            
        # Get any remaining output
        if self.playback:
            remaining_output, _ = self.playback.communicate()
            if remaining_output:
                for line in remaining_output.split('\n'):
                    if line.strip():
                        print(line)
                        
    def show_final_statistics(self):
        """Show final playback statistics"""
        print()
        print("-" * 70)
        print()
        print("═" * 70)
        print("  Playback Session Complete")
        print("═" * 70)
        
        if self.playback:
            return_code = self.playback.returncode
            if return_code == 0:
                print(f"{Colors.GREEN}✓ Playback completed successfully{Colors.RESET}")
            else:
                print(f"{Colors.YELLOW}⚠ Playback exited with code: {return_code}{Colors.RESET}")
        else:
            print("✓ Playback session ended")
            
        total_time = int(time.time() - self.start_time) if self.start_time else 0
        print(f"Total session time: {total_time}s")
        print()
        
    def cleanup(self):
        """Gracefully shutdown playback process"""
        if self.playback and self.playback.poll() is None:
            print("* Stopping playback...")
            self.playback.terminate()
            try:
                self.playback.wait(timeout=5)
            except subprocess.TimeoutExpired:
                print("* Force killing playback...")
                self.playback.kill()
                
    def run(self, binary_file: str = None, config_file: str = None):
        """Main orchestration flow"""
        self.start_time = time.time()
        
        # Print banner
        self.print_banner()
        
        # File selection/validation
        if not self.select_files(binary_file, config_file):
            return 1
            
        self.print_config(str(self.default_binary), str(self.default_config))
        
        # Verify prerequisites
        if not self.verify_prerequisites():
            return 1
            
        time.sleep(1)
        
        # Start playback
        if not self.start_playback():
            self.cleanup()
            return 1
            
        # Monitor execution
        try:
            self.monitor_playback()
        except Exception as e:
            print(f"{Colors.RED}Error during monitoring: {e}{Colors.RESET}")
            
        # Show results
        self.show_final_statistics()
        
        # Cleanup
        self.cleanup()
        return 0

def print_usage():
    """Print usage information"""
    print("Usage:")
    print("  python3 playback-run.py [binary_file] [config_file]")
    print()
    print("Examples:")
    print("  python3 playback-run.py")
    print("  python3 playback-run.py data/market_data.bin")
    print("  python3 playback-run.py output.itch config/playback/burst_mode.json")
    print()
    print("If files are not specified, interactive selection will be used.")

def main():
    """Entry point"""
    # Parse command line arguments
    if len(sys.argv) > 1 and sys.argv[1] in ['-h', '--help']:
        print_usage()
        return 0
        
    # Get base directory (scripts/beacon_run/ → root)
    script_dir = Path(__file__).resolve().parent
    base_dir = script_dir.parent.parent
    
    binary_file = sys.argv[1] if len(sys.argv) > 1 else None
    config_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    # Run orchestrator
    orchestrator = PlaybackOrchestrator(base_dir)
    return orchestrator.run(binary_file, config_file)

if __name__ == "__main__":
    sys.exit(main())