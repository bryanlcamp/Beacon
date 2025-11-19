#!/usr/bin/env python3
"""
🚀 Beacon Trading System - Ultimate Simple Launcher 🚀

THE DREAM INTERFACE:
    python3 beacon-simple.py

That's it. One command. One config file (beacon-config.json).
Everything else is handled automatically.
"""

import json
import os
import sys
import subprocess
import signal
import time
import socket
from pathlib import Path
from datetime import datetime
from typing import Dict, Optional

class Colors:
    RESET = '\033[0m'
    BOLD = '\033[1m'
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    MAGENTA = '\033[95m'

class BeaconSimple:
    def __init__(self):
        self.beacon_root = Path.cwd()
        self.config_file = self.beacon_root / "beacon-config.json"
        self.build_dir = self.beacon_root / "build"
        self.processes = []
        self.config = {}
        self.running = False
        
        # Set up signal handlers for clean shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
        
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals gracefully"""
        self._log("INFO", "SHUTDOWN", "Shutdown signal received")
        self.shutdown()
        sys.exit(0)
        
    def _get_short_component_name(self, name: str) -> str:
        """Get consistent shortened component name for logging"""
        name_map = {
            'generator': 'GENERATOR',
            'matching_engine': 'MATCH-ENG',
            'algorithm': 'ALGORITHM',
            'playback': 'PLAYBACK '
        }
        result = name_map.get(name, name.upper()[:9])
        return result.ljust(9)[:9]  # Ensure exactly 9 characters
        
    def _log(self, level: str, component: str, message: str):
        """Clean, simple logging"""
        timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
        
        colors = {
            "INFO": Colors.CYAN,
            "SUCCESS": Colors.GREEN, 
            "WARNING": Colors.YELLOW,
            "ERROR": Colors.RED
        }
        
        color = colors.get(level, Colors.RESET)
        print(f"[{timestamp}] [{color}{level:<7}{Colors.RESET}] [{component:<9}] {message}")

    def create_default_config(self):
        """Create a fresh beacon-config.json with default values"""
        default_config = {
            "_comment": "🚀 BEACON TRADING SYSTEM - USER CONFIG 🚀",
            "_description": "This file contains ONLY the settings you'll actually change. Edit the values marked #change_me",
            
            "_trading_comment": "📈 TRADING SETTINGS - Your main trading parameters #change_me",
            "symbol": "AAPL",
            "_symbol_note": "#change_me - Stock symbol to trade (AAPL, MSFT, etc.)",
            "side": "B",
            "_side_note": "B=Buy, S=Sell",
            "shares": 1000,
            "_shares_note": "#change_me - Total shares to trade",
            "price": 150.00,
            "_price_note": "#change_me - Limit price per share",
            "time_window_minutes": 5,
            "_time_window_note": "#change_me - How long to spread the order over",
            "slice_count": 10,
            "_slice_note": "How many smaller orders to break this into",
            
            "_data_comment": "📊 MARKET DATA SETTINGS #change_me", 
            "data_source": "generator",
            "_data_source_note": "generator=create new data, playback=use existing file",
            "symbols_list": ["AAPL", "MSFT", "GOOGL"],
            "_symbols_list_note": "#change_me - Symbols for market data generation",
            "message_count": 5000,
            "_message_count_note": "#change_me - How many market data messages", 
            "data_file": "outputs/market_data.bin",
            "_data_file_note": "#change_me - Output file name",
            
            "_system_comment": "⚙️ SYSTEM SETTINGS - Usually don't change",
            "protocol": "nasdaq",
            "_protocol_note": "nasdaq, cme, nyse",
            "duration_seconds": 30,
            "market_data_port": 8002,
            "order_entry_port": 9002,
            
            "_matching_comment": "🎯 MATCHING ENGINE",
            "match_type": "fifo",
            "fill_probability": 1.0,
            "partial_fills": True,
            
            "_advanced_comment": "🔧 ADVANCED - Don't change unless you know what you're doing",
            "enable_generator": True,
            "enable_playback": False,
            "enable_matching_engine": True,
            "enable_algorithm": True,
            "startup_delay_seconds": 2
        }
        
        with open(self.config_file, 'w') as f:
            json.dump(default_config, f, indent=2)
        
        self._log("SUCCESS", "CONFIG", f"✓ Created fresh config: {self.config_file}")
        return default_config

    def load_config(self) -> bool:
        """Load the user config file, create default if missing"""
        try:
            if not self.config_file.exists():
                self._log("WARNING", "CONFIG", "beacon-config.json not found - creating default")
                self.config = self.create_default_config()
                return True
                
            with open(self.config_file, 'r') as f:
                self.config = json.load(f)
            
            self._log("SUCCESS", "CONFIG", "✓ Config loaded")
            return True
            
        except Exception as e:
            self._log("ERROR", "CONFIG", f"Config error: {e}")
            self._log("INFO", "CONFIG", "Creating fresh config file...")
            self.config = self.create_default_config()
            return True

    def validate_config(self) -> bool:
        """Basic config validation with helpful error messages"""
        required_fields = ["symbol", "side", "shares", "price"]
        
        for field in required_fields:
            if field not in self.config:
                self._log("ERROR", "CONFIG", f"Missing required field: {field}")
                return False
        
        # Validate side
        if self.config["side"] not in ["B", "S"]:
            self._log("ERROR", "CONFIG", "side must be 'B' (Buy) or 'S' (Sell)")
            return False
            
        # Validate positive numbers
        for field in ["shares", "price"]:
            if self.config[field] <= 0:
                self._log("ERROR", "CONFIG", f"{field} must be positive")
                return False
        
        self._log("SUCCESS", "CONFIG", "✓ Config validation passed")
        return True

    def print_banner(self):
        """Show what we're about to do"""
        protocol_name = self.config.get('protocol', 'nasdaq').upper()
        
        print(f"\n{Colors.CYAN}🚀 BEACON TRADING SYSTEM 🚀{Colors.RESET}")
        print(f"{Colors.BOLD}Protocol: {protocol_name} | Duration: {self.config.get('duration_seconds', 30)}s{Colors.RESET}")
        
        print(f"\n{Colors.YELLOW}TRADE:{Colors.RESET} {self.config['symbol']} | {'BUY' if self.config['side'] == 'B' else 'SELL'} {self.config['shares']:,} @ ${self.config['price']:.2f} | {self.config['time_window_minutes']}min window")
        
        enabled_components = []
        if self.config.get('enable_generator', False):
            enabled_components.append('DATA-GEN')
        if self.config.get('enable_playback', False): 
            enabled_components.append('PLAYBACK')
        if self.config.get('enable_matching_engine', False):
            enabled_components.append('MATCH-ENG')
        if self.config.get('enable_algorithm', False):
            enabled_components.append('ALGO')
            
        print(f"{Colors.YELLOW}COMPONENTS:{Colors.RESET} {' + '.join(enabled_components)}\n")

    def ensure_built(self) -> bool:
        """Make sure all required binaries are built"""
        self._log("INFO", "BUILD    ", "🔍 Checking if system is built...")
        
        # Check for required binaries based on enabled components
        required_binaries = {}
        if self.config.get('enable_generator', False):
            required_binaries['generator'] = self.build_dir / "src/apps/generator/generator"
        if self.config.get('enable_matching_engine', False):
            required_binaries['matching_engine'] = self.build_dir / "src/apps/matching_engine/matching_engine"
        if self.config.get('enable_algorithm', False):
            required_binaries['algorithm'] = self.build_dir / "src/apps/client_algorithm/AlgoTwapProtocol"
        if self.config.get('enable_playback', False):
            required_binaries['playback'] = self.build_dir / "src/apps/playback/playback"
        
        # Check which ones exist
        missing = []
        for name, path in required_binaries.items():
            if path.exists():
                self._log("SUCCESS", "BUILD    ", f"✓ {name} binary exists")
            else:
                self._log("WARNING", "BUILD    ", f"✗ {name} binary missing")
                missing.append(name)
        
        # Build if needed
        if missing:
            self._log("INFO", "BUILD", f"🔨 Building missing components: {', '.join(missing)}")
            return self.build_system()
        else:
            self._log("SUCCESS", "BUILD    ", "✅ All required binaries ready!")
            return True
    
    def build_system(self) -> bool:
        """Build the system using CMake"""
        try:
            # Configure CMake
            self._log("INFO", "BUILD", "⚙️ Configuring CMake...")
            result = subprocess.run([
                "cmake", "-B", str(self.build_dir), "-S", str(self.beacon_root)
            ], capture_output=True, text=True)
            
            if result.returncode != 0:
                self._log("ERROR", "BUILD", f"CMake configure failed: {result.stderr}")
                return False
            
            # Build all targets
            self._log("INFO", "BUILD", "🔨 Building system...")
            result = subprocess.run([
                "cmake", "--build", str(self.build_dir)
            ], capture_output=True, text=True)
            
            if result.returncode != 0:
                self._log("ERROR", "BUILD", f"Build failed: {result.stderr}")
                return False
            
            self._log("SUCCESS", "BUILD", "🎉 Build complete!")
            return True
            
        except Exception as e:
            self._log("ERROR", "BUILD", f"Build error: {e}")
            return False

    def start_component(self, name: str, binary_path: Path, args: list) -> Optional[subprocess.Popen]:
        """Start a component and return the process"""
        try:
            cmd = [str(binary_path)] + args
            # Show clean, concise start message
            if name == 'generator':
                output_file = self.config.get('data_file', 'outputs/market_data.bin')
                protocol = output_file.split('.')[-1] if '.' in output_file else 'bin'
                self._log("INFO", "GENERATOR", f"Creating {protocol} data: {output_file}")
            elif name == 'matching_engine':
                port = self.config.get('order_entry_port', 9002)
                self._log("INFO", "MATCH-ENG", f"Starting on port {port}")
            elif name == 'algorithm':
                self._log("INFO", "ALGORITHM", "Starting TWAP algorithm...")
            else:
                self._log("INFO", name.upper().ljust(12), "Starting...")
            
            # For matching engine, redirect output to file for trade reports
            if name == "matching_engine":
                log_file = self.beacon_root / "outputs" / "trade_report.log"
                # Write header to file
                with open(log_file, 'w') as f:
                    f.write(f"=== BEACON TRADE REPORT - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ===\n\n")
                
                # Open file for process output
                log_handle = open(log_file, 'a')
                process = subprocess.Popen(cmd, 
                                         stdout=log_handle, 
                                         stderr=subprocess.STDOUT,
                                         text=True)
                # Store file handle to close later
                process._log_handle = log_handle
            else:
                # Other components: capture output for error reporting while keeping logs clean
                process = subprocess.Popen(cmd, 
                                         stdout=subprocess.PIPE, 
                                         stderr=subprocess.STDOUT,  # Combine stderr into stdout
                                         text=True)
            
            # Give it a moment to start
            time.sleep(0.5)
            
            # Check if it's still running or completed successfully
            poll_result = process.poll()
            if poll_result is None:
                # Still running - this is expected for long-running components
                if name == 'matching_engine':
                    port = self.config.get('order_entry_port', 9002)
                    self._log("SUCCESS", "MATCH-ENG", f"Ready on port {port} (PID: {process.pid})")
                elif name == 'algorithm':
                    self._log("SUCCESS", "ALGORITHM", f"Connected to matching engine (PID: {process.pid})")
                else:
                    self._log("SUCCESS", name.upper().ljust(12), f"Started (PID: {process.pid})")
                self.processes.append((name, process))
                return process
            elif poll_result == 0:
                # Completed successfully - this is expected for generator
                if name == 'generator':
                    self._log("SUCCESS", "GENERATOR", "Data generation complete")
                elif name == 'algorithm':
                    self._log("SUCCESS", "ALGORITHM", "Trading session complete")
                else:
                    self._log("SUCCESS", name.upper().ljust(12), "Completed successfully")
                return process
            else:
                # Failed with error
                try:
                    stdout, stderr = process.communicate(timeout=2)
                    component_name = self._get_short_component_name(name)
                    if stderr and stderr.strip():
                        self._log("ERROR", component_name, f"Failed: {stderr.strip()}")
                    elif stdout and stdout.strip():
                        self._log("ERROR", component_name, f"Failed: {stdout.strip()}")
                    else:
                        self._log("ERROR", component_name, f"Process exited with code {poll_result}")
                except subprocess.TimeoutExpired:
                    component_name = self._get_short_component_name(name)
                    self._log("ERROR", component_name, "Process failed to start (timeout)")
                    process.kill()
                    process.wait()
                return None
                
        except Exception as e:
            self._log("ERROR", name.upper(), f"Start error: {e}")
            return None

    def create_temp_configs(self) -> bool:
        """Create temporary config files based on user settings"""
        try:
            # Create temp config for matching engine (using NetworkSettings.json structure)
            order_port = self.config.get('order_entry_port', 9002)
            md_port = self.config.get('market_data_port', 8002)
            
            me_config = {
                "system": {
                    "name": "Beacon Simple Trading System",
                    "architecture": "beacon-simple generated config"
                },
                "matching_engine": {
                    "server": {
                        "protocol": "tcp",
                        "host": "127.0.0.1", 
                        "port": order_port
                    },
                    "exchange": {
                        "protocol_mode": "auto",
                        "protocols": ["ouch", "pillar", "cme"],
                        "auto_detect": True
                    },
                    "performance": {
                        "max_connections": 10
                    }
                },
                "client_algorithm": {
                    "market_data": {
                        "protocol": "udp",
                        "host": "127.0.0.1",
                        "port": md_port
                    },
                    "exchange": {
                        "protocol": "tcp",
                        "host": "127.0.0.1",
                        "port": order_port
                    }
                },
                "_protocol_override": "cme"
            }
            
            os.makedirs('outputs', exist_ok=True)
            with open('outputs/temp_matching_engine.json', 'w') as f:
                json.dump(me_config, f, indent=2)
                
            # Create temp config for algorithm
            algo_config = {
                "networking": {
                    "market_data": {
                        "host": "127.0.0.1",
                        "port": md_port,
                        "protocol": "UDP"
                    },
                    "order_entry": {
                        "host": "127.0.0.1",
                        "port": order_port,
                        "protocol": "TCP"
                    }
                },
                "protocol_config": {
                    "market_data_protocol": "cme_30",
                    "order_entry_protocol": "cme_30"
                },
                "twap_algorithm": {
                    "time_window_minutes": self.config.get('time_window_minutes', 2),
                    "slice_count": self.config.get('slice_count', 6),
                    "slice_interval_seconds": int((self.config.get('time_window_minutes', 2) * 60) / self.config.get('slice_count', 6)),
                    "participation_rate": 0.15,
                    "price_tolerance_bps": 10,
                    "minimum_slice_size": 100
                }
            }
            
            with open('outputs/temp_algorithm.json', 'w') as f:
                json.dump(algo_config, f, indent=2)
                
            # Create temp config for generator (proper structure)
            symbols = self.config.get('symbols_list', ['AAPL', 'MSFT', 'GOOGL'])
            message_count = self.config.get('message_count', 5000)
            
            gen_config = {
                "Global": {
                    "NumMessages": message_count,
                    "Exchange": "cme"
                },
                "Wave": {
                    "WaveDurationMs": 5000,
                    "WaveAmplitudePercent": 100.0
                },
                "Burst": {
                    "Enabled": False
                },
                "Symbols": []
            }
            
            # Add each symbol with reasonable defaults
            percent_per_symbol = 100.0 / len(symbols) if symbols else 100.0
            for symbol in symbols:
                symbol_config = {
                    "SymbolName": symbol,
                    "PercentTotalMessages": percent_per_symbol,
                    "SpreadPercentage": 0.5,
                    "PriceRange": {
                        "MinPrice": 100.0,
                        "MaxPrice": 200.0,
                        "Weight": 1.0
                    },
                    "QuantityRange": {
                        "MinQuantity": 100,
                        "MaxQuantity": 1000,
                        "Weight": 1.0
                    },
                    "PrevDay": {
                        "OpenPrice": 150.0,
                        "HighPrice": 160.0,
                        "LowPrice": 140.0,
                        "ClosePrice": 155.0,
                        "Volume": 10000
                    }
                }
                gen_config["Symbols"].append(symbol_config)
            
            with open('outputs/temp_generator.json', 'w') as f:
                json.dump(gen_config, f, indent=2)
            
            return True
            
        except Exception as e:
            self._log("ERROR", "CONFIG", f"Failed to create temp configs: {e}")
            return False

    def start_system(self) -> bool:
        """Start all enabled components in the right order"""
        self._log("INFO", "SYSTEM   ", "🚀 Starting components...")
        
        # Create temporary config files
        if not self.create_temp_configs():
            return False
        
        startup_delay = self.config.get('startup_delay_seconds', 2)
        
        # 1. Start Generator (if enabled)
        if self.config.get('enable_generator', False):
            generator_path = self.build_dir / "src/apps/generator/generator"
            output_file = self.config.get('data_file', 'market_data.bin')
            args = [
                '-i', 'outputs/temp_generator.json',
                '-o', output_file
            ]
            
            if not self.start_component('generator', generator_path, args):
                return False
            time.sleep(startup_delay)
        
        # 2. Start Matching Engine (if enabled)
        if self.config.get('enable_matching_engine', False):
            me_path = self.build_dir / "src/apps/matching_engine/matching_engine"
            args = ['--config', 'outputs/temp_matching_engine.json']
            
            if not self.start_component('matching_engine', me_path, args):
                return False
            
            # Wait for matching engine port to be ready
            port = self.config.get('order_entry_port', 9002)
            self._log("INFO", "SYSTEM   ", f"⏳ Waiting for port {port}...")
            
            for attempt in range(15):  # Try for up to 15 seconds
                try:
                    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    sock.settimeout(1)
                    result = sock.connect_ex(('127.0.0.1', port))
                    sock.close()
                    
                    if result == 0:
                        self._log("SUCCESS", "SYSTEM   ", f"✓ Port {port} ready!")
                        break
                    else:
                        if attempt % 3 == 0:  # Log every 3 seconds
                            self._log("INFO", "SYSTEM   ", f"Still waiting for port {port}... (attempt {attempt+1})")
                        time.sleep(1)
                        
                except Exception:
                    time.sleep(1)
            else:
                self._log("WARNING", "SYSTEM", f"Matching engine port {port} not responding after 15s, proceeding anyway...")
            
            time.sleep(1)  # Extra buffer
        
        # 3. Start Algorithm (if enabled) 
        if self.config.get('enable_algorithm', False):
            algo_path = self.build_dir / "src/apps/client_algorithm/AlgoTwapProtocol"
            args = [
                '--config', 'outputs/temp_algorithm.json',
                '--symbol', self.config.get('symbol', 'AAPL'),
                '--side', self.config.get('side', 'B'),
                '--shares', str(self.config.get('shares', 1000)),
                '--price', str(self.config.get('price', 150.0))
            ]
            
            if not self.start_component('algorithm', algo_path, args):
                return False
            time.sleep(startup_delay)
        
        # 4. Start Playback (if enabled and we have a data file)
        if self.config.get('enable_playback', False):
            data_file = Path(self.config.get('data_file', 'outputs/market_data.bin'))
            if data_file.exists():
                playback_path = self.build_dir / "src/apps/playback/playback"
                args = [str(data_file)]
                
                if not self.start_component('playback', playback_path, args):
                    return False
            else:
                self._log("WARNING", "PLAYBACK", f"Data file not found: {data_file}")
        
        self._log("SUCCESS", "SYSTEM   ", "🎉 All components started!")
        
        # Now announce trading execution plan
        if self.config.get('enable_algorithm', False):
            symbol = self.config.get('symbol', 'AAPL')
            side = 'BUY' if self.config.get('side', 'B') == 'B' else 'SELL'
            shares = self.config.get('shares', 1000)
            time_window = self.config.get('time_window_minutes', 2)
            self._log("INFO", "ALGORITHM", f"🎯 Executing TWAP: {side} {shares:,} {symbol} over {time_window} minutes")
        
        return True

    def monitor_system(self):
        """Monitor running components and handle their lifecycle"""
        duration = self.config.get('duration_seconds', 30)
        self._log("INFO", "MONITOR  ", f"Monitoring session for {duration} seconds (settlement & trade tracking)...")
        
        self.running = True
        start_time = time.time()
        last_progress = 0
        
        try:
            while self.running and (time.time() - start_time) < duration:
                # Check if any process has died
                for name, process in self.processes[:]:
                    if process.poll() is not None:
                        stdout, stderr = process.communicate()
                        component_name = self._get_short_component_name(name)
                        if process.returncode == 0:
                            # Close log file if it exists
                            if hasattr(process, '_log_handle'):
                                process._log_handle.close()
                                self._log("INFO", component_name, "Trade report saved to outputs/trade_report.log")
                            else:
                                # Different messages for different components
                                if name == "algorithm":
                                    self._log("INFO", component_name, "TWAP execution complete - orders sent")
                                elif name == "generator":
                                    self._log("SUCCESS", component_name, "Data generation complete")
                                else:
                                    self._log("INFO", component_name, "Completed successfully")
                        else:
                            # Close log file if it exists
                            if hasattr(process, '_log_handle'):
                                process._log_handle.close()
                            # Interpret common error codes
                            error_messages = {
                                -13: "Permission denied (EACCES) - check port 9002 permissions or if another process is using it",
                                -9: "Process killed (SIGKILL)",
                                -15: "Process terminated (SIGTERM)",
                                -2: "Process interrupted (SIGINT)",
                                1: "General error", 
                                127: "Command not found"
                            }
                            
                            error_hint = error_messages.get(process.returncode, "")
                            
                            if stderr and stderr.strip():
                                self._log("ERROR", component_name, f"Failed: {stderr.strip()}")
                            elif stdout and stdout.strip():
                                self._log("ERROR", component_name, f"Failed: {stdout.strip()}")
                            else:
                                if error_hint:
                                    self._log("ERROR", component_name, f"Exited with code {process.returncode}: {error_hint}")
                                else:
                                    self._log("ERROR", component_name, f"Exited with code {process.returncode}")
                            
                            # If matching engine dies, stop the entire system
                            if name == "matching_engine":
                                if process.returncode == -13:
                                    self._log("ERROR", "SYSTEM   ", "🚨 Port 9002 permission issue - try running 'sudo lsof -i :9002' to check")
                                self._log("ERROR", "SYSTEM   ", "🚨 Matching engine failed - stopping all trading")
                                self.running = False
                                return False  # Indicate failure
                        
                        self.processes.remove((name, process))
                
                # Show progress every 10 seconds
                elapsed = time.time() - start_time
                progress_marker = int(elapsed // 10)
                if progress_marker > last_progress:
                    remaining = duration - elapsed
                    if remaining > 0:
                        self._log("INFO", "MONITOR  ", f"⏱️  {elapsed:.0f}s monitoring elapsed, {remaining:.0f}s remaining (settlement period)...")
                    last_progress = progress_marker
                
                time.sleep(0.5)
                
        except KeyboardInterrupt:
            self._log("INFO", "MONITOR  ", "Interrupted by user")
            return False
        
        self.running = False
        return True  # Completed successfully

    def shutdown(self):
        """Gracefully shutdown all components"""
        if not self.processes:
            return
            
        self._log("INFO", "SHUTDOWN ", "Stopping components...")
        
        for name, process in self.processes:
            try:
                if process.poll() is None:  # Still running
                    component_name = self._get_short_component_name(name).strip()
                    self._log("INFO", "SHUTDOWN ", f"Stopping {component_name}")
                    process.terminate()
                    
                    # Give it 3 seconds to terminate gracefully
                    try:
                        process.wait(timeout=3)
                    except subprocess.TimeoutExpired:
                        component_name = self._get_short_component_name(name).strip()
                        self._log("WARNING", "SHUTDOWN ", f"Force killing {component_name}")
                        process.kill()
                        process.wait()
                        
            except Exception as e:
                component_name = self._get_short_component_name(name).strip()
                self._log("ERROR", "SHUTDOWN ", f"Error stopping {component_name}: {e}")
        
        self.processes.clear()
        self._log("SUCCESS", "SHUTDOWN ", "✅ All components stopped")

    def run(self) -> bool:
        """Run the complete system"""
        self._log("INFO", "SYSTEM", "🚀 Starting Beacon Trading System")
        
        if not self.load_config():
            return False
            
        if not self.validate_config():
            self._log("ERROR", "SYSTEM", "Config validation failed - fix beacon-config.json")
            return False
            
        self.print_banner()
        
        # Build system if needed
        if not self.ensure_built():
            self._log("ERROR", "SYSTEM", "Build failed")
            return False
        
        # Start all components
        if not self.start_system():
            self._log("ERROR", "SYSTEM", "Failed to start system")
            self.shutdown()
            return False
        
        # Monitor and run
        success = self.monitor_system()
        
        # Clean shutdown
        self.shutdown()
        
        # Show appropriate completion message
        if success:
            runtime = self.config.get('duration_seconds', 30)
            self._log("SUCCESS", "SYSTEM   ", f"✅ Trading session complete - Runtime: {runtime}s")
            self._log("INFO", "SYSTEM   ", f"📋 Trade report: ./outputs/trade_report.log")
        else:
            self._log("ERROR", "SYSTEM   ", "❌ Trading session failed - Critical component failure")
        
        return success

def main():
    """The dream interface - just run it"""
    beacon = BeaconSimple()
    
    try:
        success = beacon.run()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Shutting down...{Colors.RESET}")
        sys.exit(0)
    except Exception as e:
        print(f"{Colors.RED}ERROR: {e}{Colors.RESET}")
        sys.exit(1)

if __name__ == "__main__":
    main()