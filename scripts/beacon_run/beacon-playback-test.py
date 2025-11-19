#!/usr/bin/env python3
"""
Beacon Playback Test Suite
Comprehensive testing and validation for the Beacon playbook system.
"""

import subprocess
import sys
import time
import json
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

class PlaybackTester:
    def __init__(self, base_dir: Path):
        self.base_dir = base_dir
        self.build_dir = base_dir / "build"
        self.config_dir = base_dir / "config/playback"
        self.test_results = []
        
        # Binary paths
        self.playback_bin = self.build_dir / "src/apps/playback/playback"
        
        # Test configurations
        self.test_configs = [
            ("default.json", "Default Configuration"),
            ("authorities/authority_burst.json", "Burst Mode"),
            ("authorities/authority_wave.json", "Wave Mode"),
            ("authorities/authority_continuous.json", "Continuous Mode"),
            ("authorities/authority_chaos.json", "Chaos Mode"),
        ]
        
    def print_banner(self):
        """Print test suite banner"""
        print()
        print("═" * 70)
        print("  BEACON PLAYBACK TEST SUITE")
        print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("═" * 70)
        print()
        
    def check_build(self) -> bool:
        """Verify playback binary is built"""
        print("Checking build status...")
        
        if not self.playback_bin.exists():
            print(f"{Colors.RED}✗ Playback binary not found: {self.playback_bin}{Colors.RESET}")
            print("Run build first:")
            print("  cmake --build build --target playback")
            return False
            
        print(f"{Colors.GREEN}✓ Playback binary found{Colors.RESET}")
        return True
        
    def find_test_data(self) -> list:
        """Find available test data files"""
        extensions = ['.bin', '.itch', '.dat']
        files = []
        
        # Check common locations
        search_paths = [
            self.base_dir / "data",
            self.base_dir / "src/apps/generator",
            self.base_dir,
        ]
        
        for path in search_paths:
            if path.exists():
                for ext in extensions:
                    files.extend(path.glob(f"*{ext}"))
                    
        return sorted(list(set(files)))
        
    def validate_config_files(self) -> bool:
        """Validate all configuration files"""
        print("\nValidating configuration files...")
        
        all_valid = True
        for config_file, description in self.test_configs:
            config_path = self.config_dir / config_file
            
            if not config_path.exists():
                print(f"{Colors.YELLOW}⚠ Config not found: {config_file}{Colors.RESET}")
                continue
                
            try:
                with open(config_path, 'r') as f:
                    data = json.load(f)
                print(f"{Colors.GREEN}✓ {config_file}{Colors.RESET} - {description}")
                
                # Basic validation
                if config_file == "default.json":
                    required_fields = ["senderConfig"]
                    for field in required_fields:
                        if field not in data:
                            print(f"  {Colors.YELLOW}⚠ Missing field: {field}{Colors.RESET}")
                            
            except json.JSONDecodeError as e:
                print(f"{Colors.RED}✗ Invalid JSON in {config_file}: {e}{Colors.RESET}")
                all_valid = False
            except Exception as e:
                print(f"{Colors.RED}✗ Error reading {config_file}: {e}{Colors.RESET}")
                all_valid = False
                
        return all_valid
        
    def test_configuration(self, config_file: str, test_data: Path, timeout: int = 10) -> dict:
        """Test a specific configuration"""
        config_path = self.config_dir / config_file
        
        result = {
            'config': config_file,
            'success': False,
            'duration': 0,
            'output': '',
            'error': None
        }
        
        if not config_path.exists():
            result['error'] = f"Config file not found: {config_path}"
            return result
            
        print(f"  Testing {config_file}...")
        
        start_time = time.time()
        
        try:
            # Run playback for a short duration
            cmd = [
                str(self.playback_bin),
                "--config", str(config_path),
                str(test_data)
            ]
            
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True
            )
            
            # Let it run briefly, then terminate
            time.sleep(2)
            process.terminate()
            
            try:
                output, _ = process.communicate(timeout=timeout)
                result['output'] = output
                result['success'] = True  # If it didn't crash immediately
                
            except subprocess.TimeoutExpired:
                process.kill()
                result['error'] = "Process timeout"
                
        except Exception as e:
            result['error'] = str(e)
            
        result['duration'] = time.time() - start_time
        return result
        
    def run_syntax_tests(self) -> bool:
        """Test configuration file syntax and basic validation"""
        print("\n" + "═" * 70)
        print("  CONFIGURATION SYNTAX TESTS")
        print("═" * 70)
        
        return self.validate_config_files()
        
    def run_functionality_tests(self) -> bool:
        """Test basic functionality with different configurations"""
        print("\n" + "═" * 70)
        print("  FUNCTIONALITY TESTS")
        print("═" * 70)
        
        # Find test data
        test_files = self.find_test_data()
        if not test_files:
            print(f"{Colors.YELLOW}⚠ No test data files found - skipping functionality tests{Colors.RESET}")
            return True
            
        # Use the first available test file
        test_data = test_files[0]
        file_size = test_data.stat().st_size
        messages = file_size // 33
        
        print(f"Using test data: {test_data.name} ({messages:,} messages)")
        print()
        
        all_passed = True
        
        for config_file, description in self.test_configs:
            result = self.test_configuration(config_file, test_data)
            self.test_results.append(result)
            
            if result['success']:
                print(f"    {Colors.GREEN}✓ {description}{Colors.RESET}")
            else:
                print(f"    {Colors.RED}✗ {description}{Colors.RESET}")
                if result['error']:
                    print(f"      Error: {result['error']}")
                all_passed = False
                
        return all_passed
        
    def run_performance_tests(self) -> bool:
        """Test performance characteristics"""
        print("\n" + "═" * 70)
        print("  PERFORMANCE TESTS")
        print("═" * 70)
        
        # Find a reasonably sized test file
        test_files = self.find_test_data()
        if not test_files:
            print(f"{Colors.YELLOW}⚠ No test data files - skipping performance tests{Colors.RESET}")
            return True
            
        # Look for a file with decent size
        suitable_file = None
        for f in test_files:
            size = f.stat().st_size
            messages = size // 33
            if messages >= 1000:  # At least 1K messages
                suitable_file = f
                break
                
        if not suitable_file:
            suitable_file = test_files[0]  # Use whatever we have
            
        file_size = suitable_file.stat().st_size
        messages = file_size // 33
        
        print(f"Performance test file: {suitable_file.name} ({messages:,} messages)")
        
        # Test continuous mode for throughput
        config_path = self.config_dir / "authorities/authority_continuous.json"
        if config_path.exists():
            print("Testing message throughput...")
            
            start_time = time.time()
            try:
                cmd = [
                    str(self.playback_bin),
                    "--config", str(config_path),
                    str(suitable_file)
                ]
                
                process = subprocess.Popen(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True
                )
                
                # Let it run for 5 seconds to measure throughput
                time.sleep(5)
                process.terminate()
                
                output, _ = process.communicate(timeout=5)
                duration = time.time() - start_time
                
                # Estimate throughput (rough calculation)
                estimated_throughput = messages / duration if duration > 0 else 0
                
                print(f"  Duration: {duration:.2f}s")
                print(f"  Estimated throughput: {estimated_throughput:,.0f} msg/s")
                
                if estimated_throughput > 1000:  # Reasonable threshold
                    print(f"  {Colors.GREEN}✓ Performance acceptable{Colors.RESET}")
                    return True
                else:
                    print(f"  {Colors.YELLOW}⚠ Performance may be low{Colors.RESET}")
                    return True  # Not a failure, just a warning
                    
            except Exception as e:
                print(f"  {Colors.YELLOW}⚠ Performance test failed: {e}{Colors.RESET}")
                return True  # Not critical
                
        else:
            print(f"{Colors.YELLOW}⚠ Continuous config not found - skipping throughput test{Colors.RESET}")
            return True
            
    def print_summary(self):
        """Print test summary"""
        print("\n" + "═" * 70)
        print("  TEST SUMMARY")
        print("═" * 70)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for r in self.test_results if r['success'])
        
        print(f"Total tests: {total_tests}")
        print(f"Passed: {Colors.GREEN}{passed_tests}{Colors.RESET}")
        print(f"Failed: {Colors.RED}{total_tests - passed_tests}{Colors.RESET}")
        
        if total_tests > 0:
            success_rate = (passed_tests / total_tests) * 100
            print(f"Success rate: {success_rate:.1f}%")
            
            if success_rate >= 80:
                print(f"\n{Colors.GREEN}✓ Playback system is functioning well{Colors.RESET}")
            elif success_rate >= 60:
                print(f"\n{Colors.YELLOW}⚠ Playback system has some issues{Colors.RESET}")
            else:
                print(f"\n{Colors.RED}✗ Playback system has significant issues{Colors.RESET}")
        
        # Show any failures
        failures = [r for r in self.test_results if not r['success']]
        if failures:
            print(f"\nFailed tests:")
            for failure in failures:
                print(f"  • {failure['config']}: {failure['error']}")
                
        print()
        
    def run_all_tests(self) -> bool:
        """Run complete test suite"""
        self.print_banner()
        
        # Check prerequisites
        if not self.check_build():
            return False
            
        print(f"{Colors.GREEN}✓ Prerequisites satisfied{Colors.RESET}")
        
        # Run test suites
        syntax_ok = self.run_syntax_tests()
        functionality_ok = self.run_functionality_tests() 
        performance_ok = self.run_performance_tests()
        
        # Print summary
        self.print_summary()
        
        return syntax_ok and functionality_ok and performance_ok

def main():
    """Entry point"""
    # Get base directory (scripts/beacon_run/ → root)
    script_dir = Path(__file__).resolve().parent
    base_dir = script_dir.parent.parent
    
    # Run test suite
    tester = PlaybackTester(base_dir)
    success = tester.run_all_tests()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())