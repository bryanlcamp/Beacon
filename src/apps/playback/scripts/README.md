# Beacon Playback Scripts

**App-specific build, run, and test scripts for the Beacon playback system.**

All scripts use the `beacon-` prefix and are designed for playback-specific functionality only.

---

## 🏗️ Build Scripts

### `beacon-build-debug.py` - Debug Build
Build the playbook system with debug symbols and no optimizations.

```bash
python3 beacon-build-debug.py
```

**Features:**
- Debug symbols included (`-g`)
- No optimizations (`-O0`) 
- Debug preprocessor flags (`-DDEBUG`)
- Frame pointer preserved for better debugging
- Output: `bin/debug/playback`

### `beacon-build-release.py` - Release Build  
Build the playback system with maximum optimizations.

```bash
python3 beacon-build-release.py
```

**Features:**
- Maximum optimizations (`-O3`)
- Native architecture targeting (`-march=native`)
- Link-time optimization (`-flto`)
- Release preprocessor flags (`-DNDEBUG`)
- Output: `bin/release/playback`

---

## 🚀 Run Scripts

### `beacon-run-debug.py` - Debug Runner
Run the debug build with full argument support.

```bash
# Basic usage
python3 beacon-run-debug.py --config ../../config/playback/default.json ../../data/output.bin

# With custom config
python3 beacon-run-debug.py --config burst_mode.json market_data.itch

# Show help
python3 beacon-run-debug.py --help
```

### `beacon-run-release.py` - Release Runner
Run the release build for maximum performance.

```bash
# Production playback
python3 beacon-run-release.py --config production.json large_dataset.bin

# Performance testing
python3 beacon-run-release.py --config continuous.json test_data.itch
```

---

## 🧪 Test Scripts

### `beacon-run-tests.py` - Playback Test Suite
Run all playback-specific tests (GoogleTest framework).

```bash
python3 beacon-run-tests.py
```

**Tests Included:**
- `TestPlaybackState` - State management and encapsulation
- `TestRulesEngine` - Authority and decision logic 
- `TestBinaryInputFileReader` - File loading and parsing
- `TestMessageSenders` - UDP/TCP/Console senders
- `TestPlaybackIntegration` - End-to-end functionality
- `TestConfigValidation` - Configuration file validation

**Output:**
```
🧪 Running Beacon playback tests...
🔍 Found 6 playback test executable(s)
🧪 Running: TestPlaybackState
✅ TestPlaybackState PASSED (12 individual tests)
🧪 Running: TestRulesEngine  
✅ TestRulesEngine PASSED (8 individual tests)
...
📊 Playback Test Summary: 6 passed, 0 failed
🎉 All playback tests passed!
```

---

## 🧹 Utility Scripts

### `beacon-clean-all.py` - Clean Build Artifacts
Remove all playback build artifacts and binaries.

```bash
python3 beacon-clean-all.py
```

**Cleans:**
- `build/src/apps/playback/` - Build artifacts
- `bin/debug/playback` - Debug binary
- `bin/release/playback` - Release binary

### `beacon-kill-all.py` - Stop Playback Processes
Kill all running playback processes.

```bash  
python3 beacon-kill-all.py
```

**Features:**
- Finds playback processes automatically
- Shows process details before killing
- Graceful termination (SIGTERM) first
- Force kill (SIGKILL) if needed
- Interactive confirmation

### `beacon-validate-configs.py` - Configuration Validation
Validate all playback configuration files for syntax and compatibility.

```bash
python3 beacon-validate-configs.py
```

**Features:**
- JSON syntax validation for all config files
- Required field checking by config type
- File reference validation (checks if referenced files exist)
- Detailed error reporting with line numbers
- Warning system for missing recommended fields

---

## 📁 Directory Structure

```
src/apps/playback/scripts/
├── beacon-build-debug.py     # Debug build
├── beacon-build-release.py   # Release build
├── beacon-run-debug.py       # Run debug binary
├── beacon-run-release.py     # Run release binary
├── beacon-run-tests.py       # Test suite runner
├── beacon-clean-all.py       # Clean artifacts
├── beacon-kill-all.py        # Kill processes
├── beacon-validate-configs.py # Config validation
└── README.md                 # This file
```

---

## 🔄 Common Workflows

### **Development Workflow:**
```bash
# 1. Build debug version
python3 beacon-build-debug.py

# 2. Run tests to verify
python3 beacon-run-tests.py

# 3. Test with sample data
python3 beacon-run-debug.py --config ../../config/playback/default.json ../../data/test.bin

# 4. Debug issues
python3 beacon-run-debug.py --config debug.json problematic_data.itch
```

### **Performance Testing:**
```bash
# 1. Build optimized version
python3 beacon-build-release.py

# 2. Run performance tests
python3 beacon-run-release.py --config continuous.json large_dataset.bin

# 3. Monitor throughput and latency
python3 beacon-run-release.py --config burst_mode.json stress_test.itch
```

### **Clean Build:**
```bash
# 1. Clean everything  
python3 beacon-clean-all.py

# 2. Fresh debug build
python3 beacon-build-debug.py

# 3. Run tests
python3 beacon-run-tests.py
```

---

## 🐛 Troubleshooting

**Build Issues:**
```bash
# Clean and rebuild
python3 beacon-clean-all.py
python3 beacon-build-debug.py
```

**Process Issues:**
```bash
# Kill stuck processes
python3 beacon-kill-all.py

# Check for remaining processes
ps aux | grep playback
```

**Test Failures:**
```bash
# Run individual test categories
python3 beacon-run-tests.py  # Shows which tests failed

# Run with verbose output
cd ../../../build/src/apps/playback/tests
./TestPlaybackState --gtest_verbose
```

---

## 🔗 Related Scripts

- **Root level**: `/scripts/beacon_run/beacon-playback-*.py` - System-wide orchestration
- **Generator**: `/src/apps/generator/scripts/` - Generator-specific scripts
- **Main system**: `/scripts/beacon-run.py` - Full trading system

---

## 📝 Adding New Scripts

To add a new playback-specific script:

1. Create in this directory with `beacon-` prefix
2. Make executable: `chmod +x beacon-new-script.py` 
3. Add shebang: `#!/usr/bin/env python3`
4. Document in this README
5. Follow existing patterns for project root detection

**All scripts are playback-specific and independent of other system components.**