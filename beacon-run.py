#!/usr/bin/env python3
"""
🚀 Beacon Trading System - Ultimate Single Command Launcher 🚀

Usage:
    python3 beacon-unified.py -i config/system/startBeacon.json
    
The dream interface:
- ONE command
- ONE configuration file  
- EVERYTHING just works

Configuration contains ALL components:
- Generator, Playback, Matching Engine, Client Algorithm
- Network settings, Protocol selection, Algorithm parameters
- Monitoring, Logging, Risk controls
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
        self.build_required = False
        
        # Setup paths
        self.beacon_root = Path(__file__).parent
        self.build_dir = self.beacon_root / "build"
        self.bin_dir = self.build_dir / "src" / "apps"
        
        # Required binaries for each component
        self.required_binaries = {
            'matching_engine': self.bin_dir / "matching_engine" / "matching_engine",
            'client_algorithm': self.bin_dir / "client_algorithm" / "AlgoTwapProtocol", 
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
            self._log("INFO", "CONFIG", f"Loading {self.config_file}")
            with open(self.config_file, 'r') as f:
                self.config = json.load(f)
            
            # Check if this is a proper system config (accept both 'system' and 'system_config' keys)
            if 'system' not in self.config and 'system_config' not in self.config:
                self._log("ERROR", "CONFIG", "This appears to be a component config, not a system config!")
                self._log("INFO", "CONFIG", "Use one of these system configs instead:")
                self._log("INFO", "CONFIG", "  config/system/startBeacon.json")
                self._log("INFO", "CONFIG", "  config/system/startBeaconCME.json")
                self._log("INFO", "CONFIG", "  config/system/startBeaconNasdaq.json")
                return False
            
            # Log what we loaded (handle both system and system_config keys)
            system = self.config.get('system', self.config.get('system_config', {}))
            protocol = self.config.get('protocol', {})
            
            self._log("SUCCESS", "CONFIG", f"{system.get('name', 'Beacon')} v{system.get('version', '1.0')}")
            self._log("INFO", "CONFIG", f"Protocol: {protocol.get('type', 'unknown').upper()}")
            
            return True
        except Exception as e:
            self._log("ERROR", "CONFIG", f"Failed to load: {e}")
            return False

    def load_component_configs(self) -> bool:
        """Load component configurations (either from files or directly from system config)"""
        try:
            self._log("INFO", "CONFIG", "Loading component configurations...")
            
            # Check if we have the new format with component_configs section
            component_configs = self.config.get('component_configs', {})
            
            if component_configs:
                # New format: load from separate config files
                for component_name, component_info in component_configs.items():
                    # Skip _comment entries
                    if component_name.startswith('_'):
                        continue
                        
                    if isinstance(component_info, dict) and component_info.get('enabled', False):
                            config_file = self.beacon_root / component_info['config_file']
                            self._log("INFO", "CONFIG", f"Loading {component_name}: {config_file}")
                            
                            if config_file.exists():
                                with open(config_file, 'r') as f:
                                    config_data = json.load(f)
                                
                                # Apply quick_config overrides based on component type
                                self._apply_quick_config_overrides(component_name, config_data)
                                
                                # Apply legacy execution parameter overrides (backward compatibility)
                                if component_name == 'client_algorithm':
                                    self._apply_execution_overrides(config_data)
                                
                                # Store the loaded config
                                setattr(self, f"{component_name}_config", config_data)
                                self._log("SUCCESS", "CONFIG", f"✓ {component_name} config loaded")
                            else:
                                self._log("ERROR", "CONFIG", f"✗ Config file not found: {config_file}")
                                return False
            else:
                # Legacy format: components are direct sections in the system config
                self._log("INFO", "CONFIG", "Using legacy format - components are inline in system config")
                
                for component_name in ['generator', 'playback', 'matching_engine', 'client_algorithm']:
                    component_info = self.config.get(component_name, {})
                    
                    if component_info.get('enabled', False):
                        self._log("INFO", "CONFIG", f"Processing inline {component_name} config")
                        
                        # Apply conversions for the new simplified generator format
                        config_data = component_info.copy()
                        self._apply_quick_config_overrides(component_name, config_data)
                        
                        # Store the loaded config
                        setattr(self, f"{component_name}_config", config_data)
                        self._log("SUCCESS", "CONFIG", f"✓ {component_name} config processed")
            
            return True
            
        except Exception as e:
            self._log("ERROR", "CONFIG", f"Failed to load component configs: {e}")
            return False
    
    def _apply_quick_config_overrides(self, component_name: str, config_data: dict):
        """Apply quick_config overrides to any component configuration"""
        quick_config = self.config.get('quick_config', {})
        if not quick_config:
            return
            
        self._log("INFO", "CONFIG", f"Applying quick_config to {component_name}...")
        
        if component_name == 'client_algorithm':
            # Apply trading parameters
            trading = quick_config.get('trading', {})
            for param, value in trading.items():
                config_data[param] = value
                
        elif component_name == 'generator':
            # Convert to simple format that matches the new ConfigFileParser
            system_config = self.config.get('system', self.config.get('system_config', {}))
            
            # Get exchange from system protocol or generator protocol
            exchange = system_config.get('protocol', config_data.get('protocol', 'nasdaq')).lower()
            # Map protocol names to exchange names
            if exchange == 'itch' or exchange == 'itch_50':
                exchange = 'nasdaq'
            elif exchange == 'cme' or exchange == 'cme_mdp3':
                exchange = 'cme'
            
            # Get other parameters from generator config or defaults
            message_count = config_data.get('message_count', 10000)
            symbols_list = config_data.get('symbols', ['AAPL', 'MSFT', 'GOOGL'])
            trade_probability = config_data.get('trade_probability', 0.15)
            flush_interval = config_data.get('flush_interval', 1000)
            
            # Replace entire config with simple format
            config_data.clear()
            config_data.update({
                'exchange': exchange,
                'message_count': message_count, 
                'symbols': symbols_list,
                'trade_probability': trade_probability,
                'flush_interval': flush_interval
            })
                
        elif component_name == 'matching_engine':
            # Apply matching engine parameters
            me_config = quick_config.get('matching_engine', {})
            if 'execution' in config_data:
                for param, value in me_config.items():
                    config_data['execution'][param] = value
        
        # Apply networking to all components that have networking config
        networking = quick_config.get('networking', {})
        if networking and 'networking' in config_data:
            if component_name == 'client_algorithm':
                if 'order_entry_port' in networking:
                    config_data['networking']['order_entry']['port'] = networking['order_entry_port']
                if 'market_data_port' in networking:
                    config_data['networking']['market_data']['port'] = networking['market_data_port']
            elif component_name == 'matching_engine':
                if 'order_entry_port' in networking:
                    config_data['networking']['port'] = networking['order_entry_port']
            elif component_name == 'generator':
                if 'market_data_port' in networking:
                    config_data['network']['port'] = networking['market_data_port']

    def _apply_execution_overrides(self, algo_config: dict):
        """Apply legacy execution parameter overrides from master config to algorithm config"""
        exec_params = self.config.get('execution_parameters', {})
        if exec_params:
            self._log("INFO", "CONFIG", f"Applying legacy execution overrides: {exec_params}")
            for param, value in exec_params.items():
                if not param.startswith('_'):
                    algo_config[param] = value

    def check_build_status(self) -> dict:
        """Check which binaries exist and which need building"""
        status = {}
        
        # Check both new format (component_configs) and legacy format (direct components)
        component_configs = self.config.get('component_configs', {})
        
        if component_configs:
            # New format
            for component_name, component_info in component_configs.items():
                # Skip _comment entries
                if component_name.startswith('_'):
                    continue
                    
                if isinstance(component_info, dict) and component_info.get('enabled', False):
                    binary_path = self.required_binaries.get(component_name)
                    if binary_path:
                        exists = binary_path.exists()
                        status[component_name] = {
                            'binary_path': binary_path,
                            'exists': exists,
                            'enabled': True
                        }
                        if not exists:
                            self.build_required = True
        else:
            # Legacy format - check direct component sections
            for component_name in ['generator', 'playback', 'matching_engine', 'client_algorithm']:
                component_info = self.config.get(component_name, {})
                if component_info.get('enabled', False):
                    binary_path = self.required_binaries.get(component_name)
                    if binary_path:
                        exists = binary_path.exists()
                        status[component_name] = {
                            'binary_path': binary_path,
                            'exists': exists,
                            'enabled': True
                        }
                        if not exists:
                            self.build_required = True
        
        return status

    def ensure_system_built(self) -> bool:
        """Check if system is built, and build if necessary"""
        self._log("INFO", "BUILD", "🔍 Checking build status...")
        
        build_status = self.check_build_status()
        
        # Check if build directory exists
        if not self.build_dir.exists():
            self._log("INFO", "BUILD", "🏗️  Build directory not found - first time setup")
            self.build_required = True
        
        # Report status
        missing_binaries = []
        for component, status in build_status.items():
            if status['enabled']:
                if status['exists']:
                    self._log("SUCCESS", "BUILD", f"✓ {component} binary exists")
                else:
                    self._log("WARNING", "BUILD", f"✗ {component} binary missing: {status['binary_path']}")
                    missing_binaries.append(component)
        
        if self.build_required:
            self._log("INFO", "BUILD", f"🚀 Building system - Missing: {', '.join(missing_binaries)}")
            return self.build_system()
        else:
            self._log("SUCCESS", "BUILD", "✅ All required binaries exist - ready to start!")
            return True

    def clean_build_directories(self):
        """Clean build directories for fresh builds"""
        import shutil
        
        for build_path in [self.build_dir, self.beacon_root / "build-test"]:
            if build_path.exists():
                self._log("INFO", "CLEANUP", f"🧹 Removing {build_path.name}/")
                shutil.rmtree(build_path, ignore_errors=True)
    
    def build_system(self) -> bool:
        """Build the Beacon trading system with clean build"""
        try:
            # Always clean for fresh builds
            self.clean_build_directories()
            
            self._log("INFO", "BUILD", "🔨 Starting clean build process...")
            
            # Step 1: Configure CMake
            self._log("INFO", "BUILD", "⚙️  Configuring CMake...")
            configure_cmd = [
                "cmake", 
                "-B", str(self.build_dir),
                "-S", str(self.beacon_root)
            ]
            
            result = subprocess.run(configure_cmd, 
                                  capture_output=True, 
                                  text=True, 
                                  cwd=self.beacon_root)
            
            if result.returncode != 0:
                self._log("ERROR", "BUILD", f"CMake configure failed: {result.stderr}")
                return False
            
            self._log("SUCCESS", "BUILD", "✓ CMake configuration complete")
            
            # Step 2: Build required components
            build_status = self.check_build_status()
            targets_to_build = []
            
            for component, status in build_status.items():
                if status['enabled'] and not status['exists']:
                    # Map component names to CMake targets
                    target_map = {
                        'matching_engine': 'matching_engine',
                        'client_algorithm': 'AlgoTwapProtocol', 
                        'playback': 'playback',
                        'generator': 'generator'
                    }
                    
                    target = target_map.get(component)
                    if target:
                        targets_to_build.append(target)
            
            if targets_to_build:
                self._log("INFO", "BUILD", f"🔧 Building targets: {', '.join(targets_to_build)}")
                
                for target in targets_to_build:
                    self._log("INFO", "BUILD", f"🔨 Building {target}...")
                    
                    build_cmd = [
                        "cmake", 
                        "--build", str(self.build_dir),
                        "--target", target
                    ]
                    
                    result = subprocess.run(build_cmd,
                                          capture_output=True,
                                          text=True,
                                          cwd=self.beacon_root)
                    
                    if result.returncode != 0:
                        self._log("ERROR", "BUILD", f"Build failed for {target}: {result.stderr}")
                        return False
                    
                    self._log("SUCCESS", "BUILD", f"✓ {target} built successfully")
            
            # Step 3: Verify all binaries exist
            self._log("INFO", "BUILD", "🔍 Verifying build results...")
            final_status = self.check_build_status()
            
            all_built = True
            for component, status in final_status.items():
                if status['enabled']:
                    if status['exists']:
                        self._log("SUCCESS", "BUILD", f"✓ {component} ready")
                    else:
                        self._log("ERROR", "BUILD", f"✗ {component} still missing after build")
                        all_built = False
            
            if all_built:
                self._log("SUCCESS", "BUILD", "🎉 BUILD COMPLETE - All components ready!")
                return True
            else:
                self._log("ERROR", "BUILD", "❌ Build verification failed")
                return False
                
        except Exception as e:
            self._log("ERROR", "BUILD", f"Build process failed: {e}")
            return False

    def start_component(self, name: str, binary: str, args: List[str] = None) -> bool:
        """Start a single component"""
        try:
            cmd = [str(self.bin_dir / binary)]
            if args:
                cmd.extend(args)
            
            self._log("INFO", name.upper(), f"Starting: {' '.join(cmd)}")
            
            process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
            
            # Generator is a special case - it runs and completes, not a long-running service
            if name == "generator":
                stdout, _ = process.communicate()  # Wait for completion
                if process.returncode == 0:
                    self._log("SUCCESS", name.upper(), f"Completed successfully")
                    # Show the generator output
                    for line in stdout.strip().split('\n'):
                        if line.strip():
                            self._log("INFO", name.upper(), line)
                    return True
                else:
                    self._log("ERROR", name.upper(), f"Failed with exit code {process.returncode}: {stdout}")
                    return False
            else:
                # For long-running services, check if they started successfully
                time.sleep(1.5)  # Startup delay
                
                if process.poll() is None:
                    self.processes[name] = process
                    self._log("SUCCESS", name.upper(), f"Started (PID: {process.pid})")
                    return True
                else:
                    stdout, _ = process.communicate()
                    self._log("ERROR", name.upper(), f"Failed: {stdout}")
                    return False
                
        except Exception as e:
            self._log("ERROR", name.upper(), f"Exception: {e}")
            return False

    def start_system(self) -> bool:
        """Start all enabled components using their individual config files"""
        self._log("INFO", "SYSTEM", "🚀 LAUNCHING BEACON TRADING SYSTEM")
        
        component_configs = self.config.get('component_configs', {})
        system_config = self.config.get('system', self.config.get('system_config', {}))
        startup_order = system_config.get('startup_sequence', ['matching_engine', 'client_algorithm', 'playback'])
        
        # For legacy format, determine startup order from enabled components
        if not component_configs:
            startup_order = [name for name in ['generator', 'matching_engine', 'client_algorithm', 'playback'] 
                           if self.config.get(name, {}).get('enabled', False)]
        
        success = True
        
        # Start components in the specified order
        for component_name in startup_order:
            if component_configs:
                # New format: use component_configs
                component_info = component_configs.get(component_name, {})
                if component_info.get('enabled', False):
                    config_file_path = self.beacon_root / component_info['config_file']
                else:
                    continue
            else:
                # Legacy format: use direct component sections
                component_info = self.config.get(component_name, {})
                if not component_info.get('enabled', False):
                    continue
                # Create temporary config file from the component data
                import tempfile
                if not hasattr(self, f"{component_name}_config"):
                    continue
                config_data = getattr(self, f"{component_name}_config")
                
                # Create temp file for this component
                fd, config_file_path = tempfile.mkstemp(suffix=f'_{component_name}.json')
                try:
                    with os.fdopen(fd, 'w') as f:
                        json.dump(config_data, f, indent=2)
                    config_file_path = Path(config_file_path)  # Convert to Path object
                except:
                    os.close(fd)
                    raise
                
            if component_name == 'matching_engine':
                success &= self.start_component("matching_engine", "matching_engine/matching_engine", ["--config", str(config_file_path)])
                
            elif component_name == 'client_algorithm':
                # Get execution parameters from master config or algorithm config
                exec_params = self.config.get('execution_parameters', {})
                args = ["--config", str(config_file_path)]
                
                # Add execution parameters as command line args if specified
                if exec_params:
                    if 'symbol' in exec_params:
                        args.extend(["--symbol", exec_params['symbol']])
                    if 'side' in exec_params:
                        args.extend(["--side", exec_params['side']])
                    if 'shares' in exec_params:
                        args.extend(["--shares", str(exec_params['shares'])])
                    if 'price' in exec_params:
                        args.extend(["--price", str(exec_params['price'])])
                
                success &= self.start_component("algorithm", "client_algorithm/AlgoTwapProtocol", args)
                
            elif component_name == 'playback':
                success &= self.start_component("playback", "playback/playback", ["--config", str(config_file_path)])
                
            elif component_name == 'generator':
                # Generator uses -i for input and -o for output
                config_data = getattr(self, f"{component_name}_config")
                output_file = component_info.get('output_file', 'generated_data.bin') if component_configs else config_data.get('output_file', 'generated_data.bin')
                success &= self.start_component("generator", "generator/generator", ["-i", str(config_file_path), "-o", output_file])

        return success

    def monitor_system(self, duration: int):
        """Monitor running system"""
        self._log("INFO", "MONITOR", f"Monitoring for {duration} seconds...")
        
        for i in range(duration):
            time.sleep(1)
            alive = sum(1 for p in self.processes.values() if p.poll() is None)
            
            if i % 10 == 0:  # Status every 10s
                self._log("INFO", "MONITOR", f"Runtime: {i}s | Alive: {alive}/{len(self.processes)}")
            
            if alive == 0:
                self._log("WARN", "MONITOR", "All processes stopped")
                break

    def print_banner(self):
        """Epic startup banner"""
        system = self.config.get('system', {})
        print(f"\n{Colors.CYAN}{'='*70}")
        print(f"BEACON TRADING SYSTEM")
        print(f"{'='*70}{Colors.RESET}")
        print(f"{Colors.BOLD}Single Command. Single Config. Everything Just Works.{Colors.RESET}")
        
        # Safely get protocol
        protocol = system.get('protocol', 'unknown')
        if not protocol:
            protocol = self.config.get('protocol', {}).get('type', 'unknown')
        print(f"Protocol: {protocol.upper()}")
        
        # Get enabled components
        component_configs = self.config.get('component_configs', {})
        
        if component_configs:
            # New format
            enabled = [name for name, comp in component_configs.items() 
                      if not name.startswith('_') and isinstance(comp, dict) and comp.get('enabled', False)]
            print(f"Components: {', '.join(enabled)}")
            
            # Show config files being used
            print(f"{Colors.BOLD}Configuration Files:{Colors.RESET}")
            for name, comp in component_configs.items():
                if not name.startswith('_') and isinstance(comp, dict) and comp.get('enabled', False):
                    config_file = comp.get('config_file', 'unknown')
                    print(f"  {name}: {config_file}")
        else:
            # Legacy format
            enabled = [name for name in ['generator', 'playback', 'matching_engine', 'client_algorithm']
                      if self.config.get(name, {}).get('enabled', False)]
            print(f"Components: {', '.join(enabled)}")
            
            # Show that configs are inline
            print(f"{Colors.BOLD}Configuration:{Colors.RESET} Inline system config")
        print(f"{Colors.CYAN}{'='*70}{Colors.RESET}\n")

    def shutdown(self):
        """Clean shutdown"""
        if not self.processes:
            return
            
        self._log("INFO", "SHUTDOWN", "Stopping components...")
        
        for name, process in self.processes.items():
            if process.poll() is None:
                self._log("INFO", "SHUTDOWN", f"Stopping {name}")
                process.terminate()
                try:
                    process.wait(timeout=3)
                except subprocess.TimeoutExpired:
                    process.kill()
        
        # Cleanup
        if self.temp_dir:
            import shutil
            shutil.rmtree(self.temp_dir, ignore_errors=True)
            
        if self.start_time:
            runtime = time.time() - self.start_time
            self._log("SUCCESS", "SHUTDOWN", f"Complete - Runtime: {runtime:.1f}s")

    def validate_and_setup_only(self) -> bool:
        """Validate configuration and ensure system is ready without running it"""
        self._log("INFO", "VALIDATION", "DRY RUN: Validating system configuration and setup...")
        
        # Load and validate config
        if not self.load_config():
            self._log("ERROR", "VALIDATION", "Configuration validation failed")
            return False
        self._log("SUCCESS", "VALIDATION", "Configuration loaded and validated")
        
        # Check and build system if needed (but don't run)
        if not self.ensure_system_built():
            self._log("ERROR", "VALIDATION", "Build system validation failed") 
            return False
        self._log("SUCCESS", "VALIDATION", "Build system validated - all binaries ready")
        
        # Load component configs from individual files
        if not self.load_component_configs():
            self._log("ERROR", "VALIDATION", "Component configuration validation failed")
            return False
        self._log("SUCCESS", "VALIDATION", "Component configurations validated")
        
        # Validate that all required binaries exist
        required_binaries = self.get_required_binaries()
        for component, binary_path in required_binaries.items():
            if not binary_path.exists():
                self._log("ERROR", "VALIDATION", f"Required binary missing: {component} at {binary_path}")
                return False
            self._log("SUCCESS", "VALIDATION", f"Binary validated: {component}")
        
        self._log("SUCCESS", "VALIDATION", "DRY RUN COMPLETE: System is ready for deployment!")
        return True
    
    def get_required_binaries(self) -> Dict[str, Path]:
        """Get dictionary of required binaries for enabled components"""
        binaries = {}
        
        # Check which components are enabled
        for component in ['generator', 'matching_engine', 'client_algorithm', 'playback']:
            component_config = self.config.get('component_configs', {}).get(component, {})
            if component_config.get('enabled', False):
                if component == 'generator':
                    binaries['generator'] = self.build_dir / "src/apps/generator/generator"
                elif component == 'matching_engine':
                    binaries['matching_engine'] = self.build_dir / "src/apps/matching_engine/matching_engine" 
                elif component == 'client_algorithm':
                    binaries['client_algorithm'] = self.build_dir / "src/apps/client_algorithm/AlgoTwapProtocol"
                elif component == 'playback':
                    binaries['playback'] = self.build_dir / "src/apps/playback/playback"
        
        return binaries

    def run(self, duration: Optional[int] = None) -> bool:
        """Run the complete system"""
        self.start_time = time.time()
        
        # Load config
        if not self.load_config():
            return False
        
        # Check and build system if needed
        if not self.ensure_system_built():
            return False
        
        # Load component configs from individual files
        if not self.load_component_configs():
            return False
        
        # Print banner
        self.print_banner()
        
        # Start system
        if not self.start_system():
            self._log("ERROR", "SYSTEM", "Failed to start system")
            self.shutdown()
            return False
        
        # Monitor
        run_duration = duration or self.config['system'].get('duration_seconds', 60)
        self.monitor_system(run_duration)
        
        # Shutdown
        self.shutdown()
        return True

def main():
    parser = argparse.ArgumentParser(description='🚀 Beacon Unified Trading System')
    parser.add_argument('-i', '--input', required=True, help='Unified configuration JSON file')
    parser.add_argument('-d', '--duration', type=int, help='Runtime duration (seconds)')
    parser.add_argument('--dry-run', action='store_true', help='Validate configuration and setup without running system')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.input):
        print(f"{Colors.RED}ERROR: Config file not found: {args.input}{Colors.RESET}")
        return 1
    
    beacon = BeaconUnified(args.input)
    
    if args.dry_run:
        print(f"{Colors.CYAN}🧪 DRY RUN MODE - Validating configuration and setup{Colors.RESET}")
        success = beacon.validate_and_setup_only()
        print(f"{Colors.GREEN}✅ Dry run completed - System ready for deployment{Colors.RESET}" if success else f"{Colors.RED}❌ Dry run failed - Configuration issues detected{Colors.RESET}")
        return 0 if success else 1
    
    success = beacon.run(args.duration)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())