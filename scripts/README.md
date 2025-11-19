# Beacon Scripts

**Professional Python-based orchestration for the Beacon trading system.**

All system-level scripts use the `beacon-` prefix for easy identification and consistency.

## 🚀 Main Script

### `beacon-run.py` - **Primary Entry Point**
**The main way to run the entire trading system.**

Orchestrates startup of all components in the correct order with professional output.

```bash
# Run for 60 seconds (default)
python3 beacon-run.py

# Run for custom duration
python3 beacon-run.py 30    # 30 seconds
python3 beacon-run.py 300   # 5 minutes
```

**What it does:**
1. **Auto-cleanup** - Kills any existing Beacon processes
2. Starts OUCH matching engine
3. Starts your trading algorithm
4. Starts market data playback
5. Shows progress bar
6. Displays final statistics with tick-to-trade latency

**Output:**
- Market Data Received
- Orders Sent
- Fills Received
- Tick-to-Trade Latency (min, mean, p50, p95, p99, p99.9, max)

---

## 🎬 Playback System Scripts

### `beacon-playback.sh` - **Playback Control Center**
**Simple interface for the market data playback system.**

```bash
# Interactive file selection
./beacon-playback.sh run

# Use specific data file
./beacon-playback.sh run output.itch

# Use specific file and config
./beacon-playback.sh run data.bin config/playback/authorities/authority_burst.json

# Run test suite
./beacon-playback.sh test

# List available files
./beacon-playback.sh list

# Build playback system
./beacon-playback.sh build
```

### `beacon-playback-run.py` - **Advanced Playback Runner**
Professional playback orchestration with real-time monitoring.

```bash
# Interactive mode
python3 beacon-playback-run.py

# Specify files
python3 beacon-playback-run.py data/market_data.bin
python3 beacon-playback-run.py output.itch config/playback/burst_mode.json
```

**Features:**
- Auto-discovery of binary data files (*.bin, *.itch, *.dat)
- Interactive file selection if multiple files found
- Real-time output streaming from playback process
- Professional startup banners and progress monitoring
- Supports all playback modes (burst, wave, continuous, chaos)

### `beacon-playback-test.py` - **Playback Test Suite**
Comprehensive testing for playback configurations and functionality.

```bash
python3 beacon-playback-test.py
```

**Test Coverage:**
- Configuration file syntax validation
- JSON parsing and field validation
- Functionality tests with different authority configs
- Performance throughput measurements
- Error handling and process management

**Modes Tested:**
- Default configuration
- Burst mode (high-frequency bursts)
- Wave mode (variable rate patterns) 
- Continuous mode (steady throughput)
- Chaos mode (packet loss, jitter)

---

## 🔧 Utility Scripts

### `beacon-build.py` - Build Everything
Build all components from scratch.

```bash
python3 beacon-build.py
```

Builds:
- Matching engine
- Market data generator
- Market data playback
- Client algorithms

Shows progress and summary for each component.

---

### `beacon-previous-prices.py` - Fetch Previous Day's Market Data
Fetch previous trading day's high/low/close prices from Yahoo Finance to generate realistic market data.

```bash
# Fetch default symbols (AAPL, MSFT, TSLA, GOOGL, AMZN)
python3 beacon-previous-prices.py

# Fetch custom symbols
python3 beacon-previous-prices.py NVDA,AMD,INTC
```

**Features:**
- Fetches real previous day high/low/close prices
- Falls back to sensible defaults if API fails
- Automatically updates `src/apps/exchange_market_data_generator/sample_config.json`
- No external dependencies (uses built-in urllib)

**Output:**
- `src/apps/exchange_market_data_generator/price_ranges.json`
- Updated config files with realistic price ranges

---

### `beacon-kill.py` - Stop Everything
Kill all Beacon processes (matching engine, playback, algorithms).

```bash
python3 beacon-kill.py
```

**Features:**
- Finds and displays all Beacon processes
- Tries graceful SIGTERM first, then SIGKILL if needed
- Verifies cleanup was successful
- Checks for lingering sockets on ports 9000 and 12345
- Offers to clean up temporary log files
- Professional status reporting with detailed output

Use this to clean up after crashes or to stop a running system.

---

### `beacon-run-tests.py` - Run All Tests
Build and run the complete GoogleTest suite.

```bash
python3 beacon-run-tests.py
```

**What it tests:**
- Core components (ringbuffer, threading, latency tracking)
- Protocol implementations (ITCH, Pillar, MDP, OUCH)
- Matching engine
- Market data generation
- Client algorithms
- Integration tests

**Output:**
- Step-by-step progress (Configure → Build → Test)
- Detailed test results from ctest
- Professional formatting with summary

**Currently:** 37 tests passing (20 core + 17 protocols)

---

### `beacon-test-udp.py` - Test UDP Multicast
Listen to UDP multicast packets for debugging market data reception.

```bash
# Listen to default address/port
python3 beacon-test-udp.py 239.255.0.1 12345
```

**Use case:**
- Verify market data is being sent
- Debug multicast issues
- Test network connectivity
- Count packets received

---

## 📁 Per-App Scripts

Each application has its own `build.sh` and `run.sh` in its directory:

```
src/apps/exchange_matching_engine/
├── build.sh        # Build just the matching engine
└── (no run.sh - started by run_system.py)

src/apps/exchange_market_data_generator/
├── build.sh        # Build the generator
└── run.sh          # Generate market data file

src/apps/exchange_market_data_playback/
├── build.sh        # Build the playback
└── run.sh          # Play market data via UDP

src/apps/client_algorithm/
├── build.sh        # Build all algorithm variants
└── (algorithms started by run_system.py)
```

---

## 🎯 Quick Start

**First time setup:**
```bash
# 1. Build everything
cd scripts
python3 beacon-build.py

# 2. Generate market data (one-time)
cd ../src/apps/exchange_market_data_generator
./build.sh
./run.sh

# 3. Run the system!
cd ../../..
python3 scripts/beacon-run.py 30
```

**Daily workflow:**
```bash
# Optional: Fetch fresh price ranges from yesterday
python3 scripts/beacon-previous-prices.py

# Run the system
python3 scripts/beacon-run.py 60
```

---

## 🐛 Troubleshooting

**System won't start:**
```bash
# Kill any stuck processes
python3 scripts/beacon-kill.py

# Rebuild everything
python3 scripts/beacon-build.py

# Try again
python3 scripts/beacon-run.py
```

**No market data received:**
```bash
# Test UDP multicast
python3 scripts/beacon-test-udp.py 239.255.0.1 12345

# In another terminal, run playback
cd src/apps/exchange_market_data_playback
./run.sh
```

**Want to build just one component:**
```bash
cd src/apps/client_algorithm
./build.sh
```

---

## 📊 Understanding the Output

When you run `run_system.py`, you'll see:

```
═══════════════════════════════════════════════════════════════
  BEACON TRADING SYSTEM - ORCHESTRATED STARTUP
  2025-11-06 15:25:45
═══════════════════════════════════════════════════════════════

Configuration:
  Duration:         30 seconds
  Exchange:         127.0.0.1:9000
  Market Data:      UDP 239.255.0.1:12345
  MD File:          src/apps/exchange_market_data_generator/output.itch

...

═══════════════════════════════════════════════════════════════
  Final Statistics
═══════════════════════════════════════════════════════════════

=============================================================================
                         FINAL STATISTICS
=============================================================================
Market Data Received:  98,323      # Messages received
Orders Sent:           983          # Orders your algorithm sent
Fills Received:        1,586        # Executions from matching engine
=============================================================================

═══════════════════════════════════════════════════════════════════════════
                    TICK-TO-TRADE LATENCY STATISTICS
═══════════════════════════════════════════════════════════════════════════
  Samples:        983 / 983
───────────────────────────────────────────────────────────────────────────
  Min:            1.958 μs         # Best case
  Mean:           4.365 μs         # Average
  Median (p50):   3.875 μs         # 50th percentile
  p95:            7.500 μs         # 95th percentile
  p99:            12.250 μs        # 99th percentile (important!)
  p99.9:          73.375 μs        # 99.9th percentile
  Max:            73.375 μs        # Worst case
═══════════════════════════════════════════════════════════════════════════
```

**Key Metrics:**
- **Mean latency ~4 μs** - Very fast (competitive HFT performance on a laptop!)
- **p99 < 15 μs** - Consistent performance
- **Market Data Received** - Should be > 50,000 for 30-60 second runs
- **Orders : Fills ratio** - Usually ~1:1.5 (multiple fills per order)

---

## 🎓 Script Details

### Why Python for orchestration?
- Easy process management (subprocess)
- Clean output formatting
- Cross-platform compatibility
- Easy to modify

### Why keep build.sh in each app?
- Self-contained components
- Can build/test individually
- Clear dependencies per app
- Easier for new developers

### Why consolidate utilities here?
- Single place to find tools
- Avoid duplication
- Easy to add new scripts
- Clear project structure

---

## 📝 Adding New Scripts

To add a new utility script:

1. Create it in this `scripts/` directory as `beacon-<name>.py`
2. Make it executable: `chmod +x beacon-<name>.py`
3. Add shebang: `#!/usr/bin/env python3`
4. Document it in this README
5. Follow naming: `beacon-` prefix with hyphens for multi-word names

**All scripts use Python and the `beacon-` prefix for consistency.**

---

## 🔗 Related Documentation

- **Project README:** `../README.md`
- **Quick Reference:** `../QUICK_REFERENCE.md`
- **Market Data Testing:** `../MARKET_DATA_TESTING_GUIDE.md`
- **System Architecture:** `../README_SYSTEM.md`
