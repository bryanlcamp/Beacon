#!/usr/bin/env python3
"""
Beacon Protocol Orchestrator
Coordinates protocol-specific components: playback -> client_algorithm -> matching_engine

This orchestrator ensures:
1. All components use the same protocol (CME, ITCH, Pillar)
2. Port coordination between components
3. Proper startup sequence and configuration
4. Protocol-specific binary message handling
"""

import subprocess
import signal
import sys
import time
import os
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, Optional, List
from dataclasses import dataclass

@dataclass
class ProtocolConfig:
    """Configuration for a specific protocol setup"""
    name: str
    playback_port: int
    matching_engine_port: int
    market_data_protocol: str
    order_entry_protocol: str
    algorithm_type: str  # "twap", "vwap", "hft"

class Colors:
    """ANSI color codes for terminal output"""
    RESET = '\033[0m'
    BOLD = '\033[1m'
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    MAGENTA = '\033[95m'

class ProtocolOrchestrator:
    def __init__(self, base_dir: Path):
        self.base_dir = base_dir
        self.processes = {}
        self.start_time = None
        
        # Protocol configurations
        self.protocols = {
            "cme": ProtocolConfig(
                name="CME",
                playback_port=8001,
                matching_engine_port=9001,
                market_data_protocol="cme_mdp3",
                order_entry_protocol="cme_ilink3",
                algorithm_type="twap"
            ),
            "itch": ProtocolConfig(
                name="NASDAQ ITCH",
                playback_port=8002,
                matching_engine_port=9002,
                market_data_protocol="itch_50",
                order_entry_protocol="ouch_50",
                algorithm_type="twap"
            ),
            "pillar": ProtocolConfig(
                name="NYSE Pillar",
                playback_port=8003,
                matching_engine_port=9003,
                market_data_protocol="pillar_md",
                order_entry_protocol="pillar_oe",
                algorithm_type="vwap"
            )
        }
        
        # Binary paths
        self.bin_dir = base_dir / "bin" / "debug"
        self.config_dir = base_dir / "src" / "apps" / "common" / "configuration"
        
        # Setup signal handlers
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        print(f"\n{Colors.YELLOW}[ORCHESTRATOR] Received signal {signum}, shutting down...{Colors.RESET}")
        self.shutdown()
        sys.exit(0)
    
    def _print_banner(self, protocol_name: str, algorithm_type: str):
        """Print startup banner"""
        print(f"\n{Colors.CYAN}{'='*70}")
        print(f"  BEACON PROTOCOL ORCHESTRATOR - {protocol_name.upper()} SETUP")
        print(f"{'='*70}{Colors.RESET}")
        print(f"{Colors.BOLD}Protocol:{Colors.RESET} {protocol_name}")
        print(f"{Colors.BOLD}Algorithm:{Colors.RESET} {algorithm_type.upper()}")
        print(f"{Colors.BOLD}Architecture:{Colors.RESET} playbook (UDP) -> client_algorithm (TCP) -> matching_engine")
        print(f"{Colors.BOLD}Network:{Colors.RESET} Loopback only (127.0.0.1)")
        print(f"{Colors.BOLD}Timestamp:{Colors.RESET} {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{Colors.CYAN}{'='*70}{Colors.RESET}\n")
    
    def _generate_protocol_configs(self, protocol: ProtocolConfig) -> Dict[str, Path]:
        """Generate protocol-specific configuration files"""
        configs = {}
        
        # Playbook configuration
        playbook_config = {
            "networking": {
                "host": "127.0.0.1",
                "port": protocol.playbook_port,
                "protocol": "UDP"
            },
            "playbook": {
                "protocol": protocol.market_data_protocol,
                "binary_format": True,
                "rate_limit_mbps": 100,
                "burst_mode": False
            }
        }
        
        # Client Algorithm configuration
        if protocol.algorithm_type == "twap":
            algo_config_file = "ClientAlgorithm.Twap.json"
        elif protocol.algorithm_type == "vwap":
            algo_config_file = "ClientAlgorithm.Vwap.json"  # We'll create this
        else:
            algo_config_file = "ClientAlgorithm.Hft.json"
        
        # Load base algorithm config and enhance with protocol-specific networking
        base_algo_config = self._load_config(self.config_dir / algo_config_file)
        base_algo_config["networking"] = {
            "market_data": {
                "host": "127.0.0.1",
                "port": protocol.playbook_port,
                "protocol": "UDP"
            },
            "order_entry": {
                "host": "127.0.0.1", 
                "port": protocol.matching_engine_port,
                "protocol": "TCP"
            }
        }
        base_algo_config["protocol_config"] = {
            "market_data_protocol": protocol.market_data_protocol,
            "order_entry_protocol": protocol.order_entry_protocol
        }
        
        # Matching Engine configuration
        matching_engine_config = {
            "networking": {
                "host": "127.0.0.1",
                "port": protocol.matching_engine_port,
                "protocol": "TCP"
            },
            "protocol": {
                "order_entry": protocol.order_entry_protocol,
                "auto_detect": False,
                "strict_validation": True
            },
            "execution": {
                "immediate_fill": True,
                "partial_fills": True,
                "price_improvement": 0.001
            }
        }
        
        # Write temporary configuration files
        temp_dir = self.base_dir / "temp_configs" / protocol.name.lower()
        temp_dir.mkdir(parents=True, exist_ok=True)
        
        configs["playbook"] = temp_dir / "playbook_config.json"
        configs["algorithm"] = temp_dir / "algorithm_config.json" 
        configs["matching_engine"] = temp_dir / "matching_engine_config.json"
        
        with open(configs["playbook"], 'w') as f:
            json.dump(playbook_config, f, indent=2)
        
        with open(configs["algorithm"], 'w') as f:
            json.dump(base_algo_config, f, indent=2)
            
        with open(configs["matching_engine"], 'w') as f:
            json.dump(matching_engine_config, f, indent=2)
        
        return configs
    
    def _load_config(self, config_path: Path) -> dict:
        """Load JSON configuration file"""
        try:
            with open(config_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"{Colors.RED}[ERROR] Failed to load config {config_path}: {e}{Colors.RESET}")
            return {}
    
    def start_component(self, name: str, cmd: List[str], color: str) -> Optional[subprocess.Popen]:
        """Start a component process"""
        try:
            print(f"{color}[STARTING] {name}...{Colors.RESET}")
            print(f"  Command: {' '.join(cmd)}")
            
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                universal_newlines=True
            )
            
            time.sleep(1)  # Allow startup
            
            if process.poll() is None:
                print(f"{Colors.GREEN}✓ {name} started (PID: {process.pid}){Colors.RESET}")
                return process
            else:
                stdout, _ = process.communicate()
                print(f"{Colors.RED}✗ {name} failed to start{Colors.RESET}")
                print(f"Output: {stdout}")
                return None
                
        except Exception as e:
            print(f"{Colors.RED}[ERROR] Failed to start {name}: {e}{Colors.RESET}")
            return None
    
    def run_protocol_setup(self, protocol_key: str, algorithm_type: str = None, duration: int = 30) -> bool:
        """Run a complete protocol setup"""
        
        if protocol_key not in self.protocols:
            print(f"{Colors.RED}[ERROR] Unknown protocol: {protocol_key}{Colors.RESET}")
            print(f"Available protocols: {', '.join(self.protocols.keys())}")
            return False
        
        protocol = self.protocols[protocol_key]
        if algorithm_type:
            protocol.algorithm_type = algorithm_type
        
        self._print_banner(protocol.name, protocol.algorithm_type)
        self.start_time = time.time()
        
        # Generate protocol-specific configurations
        print(f"{Colors.YELLOW}[CONFIG] Generating protocol-specific configurations...{Colors.RESET}")
        configs = self._generate_protocol_configs(protocol)
        
        # Start components in sequence
        print(f"{Colors.YELLOW}[STARTUP] Starting components in sequence...{Colors.RESET}")
        
        # 1. Start Matching Engine first
        me_cmd = [
            str(self.bin_dir / "matching_engine"),
            "--config", str(configs["matching_engine"])
        ]
        self.processes["matching_engine"] = self.start_component(
            f"Matching Engine ({protocol.order_entry_protocol})",
            me_cmd,
            Colors.BLUE
        )
        
        if not self.processes["matching_engine"]:
            print(f"{Colors.RED}[FATAL] Could not start Matching Engine{Colors.RESET}")
            return False
        
        # 2. Start Client Algorithm
        if protocol.algorithm_type == "twap":
            algo_binary = "algo_twap"
        elif protocol.algorithm_type == "vwap":
            algo_binary = "algo_vwap"  # We'll create this
        else:
            algo_binary = "client_algorithm_hft"
        
        algo_cmd = [
            str(self.bin_dir / algo_binary),
            "--config", str(configs["algorithm"])
        ]
        self.processes["algorithm"] = self.start_component(
            f"Algorithm ({protocol.algorithm_type.upper()})",
            algo_cmd,
            Colors.GREEN
        )
        
        if not self.processes["algorithm"]:
            print(f"{Colors.RED}[FATAL] Could not start Algorithm{Colors.RESET}")
            return False
        
        # 3. Start Playbook (market data source)
        playbook_cmd = [
            str(self.bin_dir / "playbook"),
            "--config", str(configs["playbook"]),
            "--protocol", protocol.market_data_protocol
        ]
        self.processes["playbook"] = self.start_component(
            f"Market Data Playbook ({protocol.market_data_protocol})",
            playbook_cmd,
            Colors.MAGENTA
        )
        
        if not self.processes["playbook"]:
            print(f"{Colors.RED}[FATAL] Could not start Playbook{Colors.RESET}")
            return False
        
        # Monitor execution
        print(f"\n{Colors.CYAN}[RUNNING] All components started - Running for {duration} seconds...{Colors.RESET}")
        print(f"Protocol: {protocol.name} | Algorithm: {protocol.algorithm_type.upper()}")
        print(f"Market Data: UDP:{protocol.playbook_port} -> TCP:{protocol.matching_engine_port}")
        print(f"\nPress Ctrl+C to stop early...\n")
        
        try:
            for i in range(duration):
                time.sleep(1)
                alive_count = sum(1 for p in self.processes.values() if p and p.poll() is None)
                print(f"\rRuntime: {i+1:3d}s | Components alive: {alive_count}/3", end='', flush=True)
                
                if alive_count == 0:
                    print(f"\n{Colors.RED}[ERROR] All components stopped unexpectedly{Colors.RESET}")
                    break
            
            print(f"\n\n{Colors.GREEN}[COMPLETE] Protocol test completed successfully{Colors.RESET}")
            return True
            
        except KeyboardInterrupt:
            print(f"\n{Colors.YELLOW}[INTERRUPTED] Stopping early...{Colors.RESET}")
            return True
        finally:
            self.shutdown()
    
    def shutdown(self):
        """Shutdown all processes"""
        print(f"\n{Colors.YELLOW}[SHUTDOWN] Stopping all components...{Colors.RESET}")
        
        for name, process in self.processes.items():
            if process and process.poll() is None:
                print(f"  Stopping {name}...")
                process.terminate()
                try:
                    process.wait(timeout=3)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait()
        
        if self.start_time:
            runtime = time.time() - self.start_time
            print(f"{Colors.GREEN}[SHUTDOWN] Complete - Total runtime: {runtime:.1f}s{Colors.RESET}")

def main():
    if len(sys.argv) < 2:
        print("Usage: protocol_orchestrator.py <protocol> [algorithm] [duration]")
        print("Protocols: cme, itch, pillar")
        print("Algorithms: twap, vwap, hft (default: twap)")
        print("Duration: seconds to run (default: 30)")
        print("\nExamples:")
        print("  ./protocol_orchestrator.py cme twap 60")
        print("  ./protocol_orchestrator.py itch vwap")
        print("  ./protocol_orchestrator.py pillar hft 120")
        sys.exit(1)
    
    base_dir = Path(__file__).parent.parent.parent.parent
    orchestrator = ProtocolOrchestrator(base_dir)
    
    protocol = sys.argv[1].lower()
    algorithm = sys.argv[2].lower() if len(sys.argv) > 2 else "twap"
    duration = int(sys.argv[3]) if len(sys.argv) > 3 else 30
    
    success = orchestrator.run_protocol_setup(protocol, algorithm, duration)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()