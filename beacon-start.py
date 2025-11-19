#!/usr/bin/env python3
"""
Beacon Trading System - Unified Startup Script

Single command to start the entire trading system with one configuration file.

Usage:
    python3 beacon-start.py -i startBeacon.json
    python3 beacon-start.py --input startBeacon.json --duration 120
    python3 beacon-start.py -i config/system/startBeacon.json --verbose

Features:
- Single JSON configuration for entire system
- Automatic component orchestration
- Protocol coordination (ITCH/OUCH, Pillar, CME)
- Built-in error handling and cleanup
- Real-time monitoring and statistics
"""

import sys
import json
import argparse
import subprocess
import signal
import time
import os
import tempfile
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional
import threading
import queue
from dataclasses import dataclass

class Colors:
    """Enhanced ANSI colors for beautiful terminal output"""
    RESET = '\033[0m'
    BOLD = '\033[1m'
    DIM = '\033[2m'
    
    # Standard colors
    BLACK = '\033[30m'
    RED = '\033[31m'
    GREEN = '\033[32m'
    YELLOW = '\033[33m'
    BLUE = '\033[34m'
    MAGENTA = '\033[35m'
    CYAN = '\033[36m'
    WHITE = '\033[37m'
    
    # Bright colors
    BRIGHT_RED = '\033[91m'
    BRIGHT_GREEN = '\033[92m'
    BRIGHT_YELLOW = '\033[93m'
    BRIGHT_BLUE = '\033[94m'
    BRIGHT_MAGENTA = '\033[95m'
    BRIGHT_CYAN = '\033[96m'
    
    # Background colors
    BG_RED = '\033[41m'
    BG_GREEN = '\033[42m'
    BG_YELLOW = '\033[43m'
    BG_BLUE = '\033[44m'

@dataclass
class ComponentConfig:
    """Configuration for a single system component"""
    name: str
    binary_path: str
    config_data: dict
    temp_config_path: str
    enabled: bool = True
    startup_delay: float = 0.0

class BeaconUnifiedOrchestrator:
    def __init__(self, config_file: Path):
        self.config_file = config_file
        self.config = {}
        self.components = {}
        self.processes = {}
        self.temp_dir = Path("temp_configs")
        self.log_dir = Path("logs")
        self.start_time = None
        self.running = False
        
        # Component order for startup
        self.startup_order = ["generator", "matching_engine", "playback", "client_algorithm"]
        
        # Binary paths
        self.bin_dir = Path("bin/debug")
        
        # Setup signal handlers
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        print(f"\n{Colors.BRIGHT_YELLOW}[BEACON] Received signal {signum}, shutting down gracefully...{Colors.RESET}")
        self.shutdown()
        sys.exit(0)
    
    def _print_banner(self):
        """Print epic startup banner"""
        system_name = self.config.get("system_config", {}).get("name", "Beacon Trading System")
        protocol = self.config.get("system_config", {}).get("protocol", "unknown").upper()
        algorithm = self.config.get("system_config", {}).get("algorithm", "unknown").upper()
        
        print(f"\n{Colors.BRIGHT_CYAN}{'='*80}")
        print(f"{'='*80}")
        print(f"    ██████  ███████  █████   ██████  ██████  ███    ██")
        print(f"    ██   ██ ██      ██   ██ ██      ██    ██ ████   ██") 
        print(f"    ██████  █████   ███████ ██      ██    ██ ██ ██  ██")
        print(f"    ██   ██ ██      ██   ██ ██      ██    ██ ██  ██ ██")
        print(f"    ██████  ███████ ██   ██  ██████  ██████  ██   ████")
        print(f"")
        print(f"           🚀 UNIFIED TRADING SYSTEM ORCHESTRATOR 🚀")
        print(f"{'='*80}")
        print(f"{'='*80}{Colors.RESET}")
        print(f"{Colors.BRIGHT_WHITE}{Colors.BOLD}System:{Colors.RESET} {system_name}")
        print(f"{Colors.BRIGHT_WHITE}{Colors.BOLD}Protocol:{Colors.RESET} {protocol}")
        print(f"{Colors.BRIGHT_WHITE}{Colors.BOLD}Algorithm:{Colors.RESET} {algorithm}")
        print(f"{Colors.BRIGHT_WHITE}{Colors.BOLD}Config File:{Colors.RESET} {self.config_file}")
        print(f"{Colors.BRIGHT_WHITE}{Colors.BOLD}Timestamp:{Colors.RESET} {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{Colors.BRIGHT_CYAN}{'='*80}{Colors.RESET}\n")
    
    def load_configuration(self) -> bool:
        """Load and validate the unified configuration file"""
        print(f"{Colors.BRIGHT_BLUE}[CONFIG]{Colors.RESET} Loading unified configuration from {self.config_file}...")
        
        try:
            with open(self.config_file, 'r') as f:
                self.config = json.load(f)
            
            # Validate required sections
            required_sections = ["system_config"]
            for section in required_sections:
                if section not in self.config:
                    raise ValueError(f"Missing required section: {section}")
            
            print(f"{Colors.BRIGHT_GREEN}[CONFIG]{Colors.RESET} ✓ Configuration loaded successfully")
            return True
            
        except Exception as e:
            print(f"{Colors.BRIGHT_RED}[CONFIG ERROR]{Colors.RESET} Failed to load configuration: {e}")
            return False
    
    def setup_directories(self):
        """Create necessary directories"""
        print(f"{Colors.BRIGHT_BLUE}[SETUP]{Colors.RESET} Creating directories...")
        
        # Create temp directories
        self.temp_dir.mkdir(exist_ok=True)
        (self.temp_dir / "data").mkdir(exist_ok=True)
        
        # Create log directory with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        log_output_dir = self.config.get("system_monitoring", {}).get("output_directory", f"logs/session_{timestamp}")
        log_output_dir = log_output_dir.replace("$(timestamp)", timestamp)
        self.log_dir = Path(log_output_dir)
        self.log_dir.mkdir(parents=True, exist_ok=True)
        
        print(f"{Colors.BRIGHT_GREEN}[SETUP]{Colors.RESET} ✓ Directories created")
        print(f"  Temp configs: {self.temp_dir}")
        print(f"  Logs: {self.log_dir}")
    
    def generate_component_configs(self):
        """Generate individual component configuration files from unified config"""
        print(f"{Colors.BRIGHT_BLUE}[CONFIGS]{Colors.RESET} Generating component configurations...")
        
        component_configs = {}
        
        # Generator configuration
        if self.config.get("generator", {}).get("enabled", False):
            gen_config = self.config["generator"]
            component_configs["Generator.json"] = {
                "output_file": gen_config["output_file"],
                "message_count": gen_config["message_count"], 
                "symbols": gen_config["symbols"],
                "protocol": gen_config["protocol"],
                "wave_config": gen_config.get("wave_config", {})
            }
        
        # Playbook configuration
        if self.config.get("playback", {}).get("enabled", False):
            playback_config = self.config["playback"]
            component_configs["Playback.json"] = {
                "networking": playback_config["networking"],
                "playback_config": playback_config["playback_config"]
            }
        
        # Matching Engine configuration
        if self.config.get("matching_engine", {}).get("enabled", False):
            me_config = self.config["matching_engine"]
            component_configs["MatchingEngine.json"] = {
                "networking": me_config["networking"],
                "protocol": me_config["protocol"],
                "execution": me_config["execution"]
            }
        
        # Client Algorithm configuration
        if self.config.get("client_algorithm", {}).get("enabled", False):
            algo_config = self.config["client_algorithm"]
            algorithm_type = algo_config["type"]
            
            client_config = {
                "networking": algo_config["networking"],
                "protocol_config": algo_config["protocol_config"],
                "execution_config": algo_config["execution_config"]
            }
            
            # Add algorithm-specific config
            if f"{algorithm_type}_algorithm" in algo_config:
                client_config[f"{algorithm_type}_algorithm"] = algo_config[f"{algorithm_type}_algorithm"]
            
            component_configs[f"ClientAlgorithm.{algorithm_type.title()}.json"] = client_config
        
        # Write configuration files
        for filename, config_data in component_configs.items():
            config_path = self.temp_dir / filename
            with open(config_path, 'w') as f:
                json.dump(config_data, f, indent=2)
            print(f"  ✓ Generated {filename}")
        
        print(f"{Colors.BRIGHT_GREEN}[CONFIGS]{Colors.RESET} ✓ Component configurations generated")
    
    def start_component(self, component_name: str, binary_name: str, config_file: str, 
                       startup_delay: float = 0.0, extra_args: List[str] = None) -> Optional[subprocess.Popen]:
        """Start a single component"""
        
        if startup_delay > 0:
            print(f"{Colors.YELLOW}[{component_name.upper()}]{Colors.RESET} Waiting {startup_delay}s before startup...")
            time.sleep(startup_delay)
        
        try:
            binary_path = self.bin_dir / binary_name
            cmd = [str(binary_path), "--config", str(self.temp_dir / config_file)]
            
            if extra_args:
                cmd.extend(extra_args)
            
            print(f"{Colors.BRIGHT_MAGENTA}[{component_name.upper()}]{Colors.RESET} Starting...")
            print(f"  Command: {' '.join(cmd)}")
            
            # Redirect output to log files
            log_file = self.log_dir / f"{component_name.lower()}.log"
            with open(log_file, 'w') as log:
                process = subprocess.Popen(
                    cmd,
                    stdout=log,
                    stderr=subprocess.STDOUT,
                    text=True
                )
            
            time.sleep(1.0)  # Allow startup
            
            if process.poll() is None:
                print(f"{Colors.BRIGHT_GREEN}[{component_name.upper()}]{Colors.RESET} ✓ Started (PID: {process.pid})")
                return process
            else:
                print(f"{Colors.BRIGHT_RED}[{component_name.upper()}]{Colors.RESET} ✗ Failed to start")
                return None
                
        except Exception as e:
            print(f"{Colors.BRIGHT_RED}[{component_name.upper()} ERROR]{Colors.RESET} {e}")
            return None
    
    def start_all_components(self) -> bool:
        """Start all enabled components in correct order"""
        print(f"{Colors.BRIGHT_BLUE}[STARTUP]{Colors.RESET} Starting components in sequence...")
        
        success_count = 0
        
        # Start Generator first (if enabled)
        if self.config.get("generator", {}).get("enabled", False):
            print(f"\n{Colors.BRIGHT_YELLOW}[STEP 1]{Colors.RESET} Market Data Generator")
            gen_config = self.config["generator"]
            extra_args = [
                "--symbols", ",".join(gen_config["symbols"]),
                "--count", str(gen_config["message_count"]),
                "--output", gen_config["output_file"]
            ]
            process = self.start_component("Generator", "generator", "Generator.json", 0.0, extra_args)
            if process:
                self.processes["generator"] = process
                success_count += 1
                # Wait for generation to complete
                print(f"{Colors.YELLOW}[GENERATOR]{Colors.RESET} Waiting for market data generation...")
                process.wait()
                print(f"{Colors.BRIGHT_GREEN}[GENERATOR]{Colors.RESET} ✓ Market data generation complete")
        
        # Start Matching Engine
        if self.config.get("matching_engine", {}).get("enabled", False):
            print(f"\n{Colors.BRIGHT_YELLOW}[STEP 2]{Colors.RESET} Matching Engine")
            process = self.start_component("MatchingEngine", "matching_engine", "MatchingEngine.json", 1.0)
            if process:
                self.processes["matching_engine"] = process
                success_count += 1
        
        # Start Playbook 
        if self.config.get("playback", {}).get("enabled", False):
            print(f"\n{Colors.BRIGHT_YELLOW}[STEP 3]{Colors.RESET} Market Data Playbook")
            process = self.start_component("Playbook", "playbook", "Playbook.json", 2.0)
            if process:
                self.processes["playbook"] = process
                success_count += 1
        
        # Start Client Algorithm
        if self.config.get("client_algorithm", {}).get("enabled", False):
            print(f"\n{Colors.BRIGHT_YELLOW}[STEP 4]{Colors.RESET} Client Algorithm")
            algo_config = self.config["client_algorithm"]
            algorithm_type = algo_config["type"]
            exec_config = algo_config["execution_config"]
            
            extra_args = [
                "--symbol", exec_config["symbol"],
                "--side", exec_config["side"],
                "--shares", str(exec_config["shares"]),
                "--price", str(exec_config["limit_price"])
            ]
            
            config_file = f"ClientAlgorithm.{algorithm_type.title()}.json"
            binary_name = f"AlgoTwapProtocol"  # For now, use TWAP binary
            
            process = self.start_component("Algorithm", binary_name, config_file, 3.0, extra_args)
            if process:
                self.processes["algorithm"] = process
                success_count += 1
        
        enabled_count = sum(1 for component in ["generator", "playback", "matching_engine", "client_algorithm"] 
                          if self.config.get(component, {}).get("enabled", False))
        
        if success_count == enabled_count:
            print(f"\n{Colors.BRIGHT_GREEN}[STARTUP]{Colors.RESET} ✓ All {success_count} components started successfully")
            return True
        else:
            print(f"\n{Colors.BRIGHT_RED}[STARTUP]{Colors.RESET} ✗ Only {success_count}/{enabled_count} components started")
            return False
    
    def monitor_execution(self):
        """Monitor system execution with real-time updates"""
        duration = self.config.get("system_config", {}).get("duration_seconds", 60)
        
        print(f"\n{Colors.BRIGHT_CYAN}[MONITORING]{Colors.RESET} System running for {duration} seconds...")
        print(f"Real-time logs available in: {self.log_dir}")
        print(f"Press Ctrl+C to stop early\n")
        
        try:
            for i in range(duration):
                time.sleep(1)
                
                # Check process health
                alive_count = 0
                for name, process in self.processes.items():
                    if process and process.poll() is None:
                        alive_count += 1
                
                # Status display every 10 seconds
                if i % 10 == 0:
                    print(f"{Colors.BRIGHT_BLUE}[STATUS]{Colors.RESET} Runtime: {i:3d}s | "
                          f"Components alive: {alive_count}/{len(self.processes)} | "
                          f"Remaining: {duration-i}s")
                
                if alive_count == 0:
                    print(f"{Colors.BRIGHT_RED}[ERROR]{Colors.RESET} All components stopped unexpectedly")
                    break
            
            print(f"\n{Colors.BRIGHT_GREEN}[COMPLETE]{Colors.RESET} Execution completed successfully")
            
        except KeyboardInterrupt:
            print(f"\n{Colors.BRIGHT_YELLOW}[INTERRUPTED]{Colors.RESET} Stopping early...")
    
    def shutdown(self):
        """Shutdown all components gracefully"""
        print(f"\n{Colors.BRIGHT_YELLOW}[SHUTDOWN]{Colors.RESET} Stopping all components...")
        
        shutdown_order = ["algorithm", "playbook", "matching_engine", "generator"]
        
        for component_name in shutdown_order:
            if component_name in self.processes:
                process = self.processes[component_name]
                if process and process.poll() is None:
                    print(f"  Stopping {component_name}...")
                    process.terminate()
                    try:
                        process.wait(timeout=3)
                    except subprocess.TimeoutExpired:
                        process.kill()
                        process.wait()
        
        self.running = False
        
        if self.start_time:
            runtime = time.time() - self.start_time
            print(f"{Colors.BRIGHT_GREEN}[SHUTDOWN]{Colors.RESET} Complete - Total runtime: {runtime:.1f}s")
    
    def run(self) -> bool:
        """Main orchestration flow"""
        self.start_time = time.time()
        self.running = True
        
        try:
            self._print_banner()
            
            if not self.load_configuration():
                return False
            
            self.setup_directories()
            self.generate_component_configs()
            
            if not self.start_all_components():
                return False
            
            self.monitor_execution()
            
            return True
            
        except Exception as e:
            print(f"{Colors.BRIGHT_RED}[FATAL ERROR]{Colors.RESET} {e}")
            return False
        finally:
            self.shutdown()

def main():
    parser = argparse.ArgumentParser(
        description="Beacon Unified Trading System Orchestrator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 beacon-start.py -i config/system/startBeacon.json
  python3 beacon-start.py -i config/system/startBeaconNasdaq.json
  
Configuration file should contain all system settings in unified JSON format.
        """
    )
    
    parser.add_argument('-i', '--input', required=True, metavar='CONFIG_FILE',
                       help='Unified configuration JSON file')
    
    args = parser.parse_args()
    
    config_file = Path(args.input)
    if not config_file.exists():
        print(f"{Colors.BRIGHT_RED}[ERROR]{Colors.RESET} Configuration file not found: {config_file}")
        return 1
    
    orchestrator = BeaconUnifiedOrchestrator(config_file)
    success = orchestrator.run()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())