# Beacon Trading System

**The Ultimate Simple High-Frequency Trading Platform**

Beacon is a professional-grade trading system that implements TWAP (Time-Weighted Average Price) algorithms with protocol-aware execution for NASDAQ OUCH v5.0, NYSE Pillar v3.2, and CME iLink 3 protocols.

## The Professional Interface

**One Command. One Config File. That's it.**

```bash
python3 beacon-run.py -i config/system/startBeacon.json
```

## Quick Start

### 1. **Run the System** (First Time)
```bash
python3 beacon-run.py -i config/system/startBeacon.json
```

The system will:
- Automatically detect if you need to build (first run)
- Compile all required components using professional build system
- Use professional system configuration
- Run your first TWAP trade simulation

### 2. **Customize Your Trading** 
Edit the system config files in `config/system/` or use the configuration management tool:

```bash
python3 beacon-config.py  # Interactive configuration editor
```

**Quick config editing** - Main settings in `config/system/startBeacon.json`:

```json
{
  "system": {
    "name": "Beacon Professional Trading System",
    "protocol": "nasdaq_ouch",
    "duration_seconds": 60
  },
  "execution_parameters": {
    "symbol": "AAPL",
    "side": "B",
    "shares": 1000,
    "price": 150.25
  },
  "component_configs": {
    "matching_engine": {"enabled": true, "config_file": "config/matching_engine/ouch_matching_engine.json"},
    "client_algorithm": {"enabled": true, "config_file": "config/client_algorithm/twap_aapl_buy.json"},
    "playback": {"enabled": true, "config_file": "config/playback/nasdaq_itch_playback.json"}
  }
}
```

### 3. **Run Again**
```bash
python3 beacon-run.py -i config/system/startBeacon.json
```

That's it!

## Sample Output

```
BEACON TRADING SYSTEM
Protocol: CME | Duration: 30s

TRADE: AAPL | BUY 1,000 @ $150.00 | 2min window
COMPONENTS: DATA-GEN + MATCH-ENG + ALGO

[16:07:14.611] [SUCCESS] [BUILD    ] All required binaries ready!
[16:07:14.611] [INFO   ] [SYSTEM   ] Starting components...
[16:07:15.118] [SUCCESS] [GENERATOR] Data generation complete
[16:07:17.632] [SUCCESS] [MATCH-ENG] Ready on port 9002 (PID: 35947)
[16:07:19.149] [SUCCESS] [ALGORITHM] Connected to matching engine (PID: 35964)
[16:07:21.153] [SUCCESS] [SYSTEM   ] All components started!
[16:07:21.154] [INFO   ] [ALGORITHM] Executing TWAP: BUY 1,000 AAPL over 2 minutes
[16:07:21.154] [INFO   ] [MONITOR  ] Monitoring session for 30 seconds (settlement & trade tracking)...
[16:07:51.843] [SUCCESS] [SYSTEM   ] Trading session complete - Runtime: 30s
[16:07:51.843] [INFO   ] [SYSTEM   ] Trade report: ./outputs/trade_report.log
```

## What Just Happened?

1. **Data Generation** - Created realistic market data for your symbols
2. **Matching Engine** - Started a CME-protocol matching engine on port 9002  
3. **TWAP Algorithm** - Connected and executed time-weighted average price strategy
4. **Trade Execution** - Split 1,000 AAPL shares into 6 orders over 2 minutes
5. **Settlement** - Monitored for 30 seconds to track fills and confirmations
6. **Trade Report** - Detailed activity saved to `outputs/trade_report.log`

## 📖 Documentation

### **Getting Started**
- **[Documentation Hub](docs/index.md)** - Complete navigation and overview
- **[Getting Started Guide](docs/getting-started.md)** - Step-by-step tutorial
- **[Configuration Guide](docs/configuration.md)** - All settings explained
- **[Troubleshooting](docs/troubleshooting.md)** - Common issues & solutions

### **Advanced Usage**  
- **[Advanced Features](docs/advanced-usage.md)** - Power user features (`beacon-run.py`)
- **[Architecture Guide](docs/architecture.md)** - How Beacon works internally
- **[Build System](docs/building.md)** - Professional Python build system
- **[CI/CD Pipeline](docs/ci-cd.md)** - Automated deployment system

### **Trading & Protocols**
- **[Exchange Protocols](docs/exchange_protocols/)** - NASDAQ, CME, NYSE protocol documentation
- **[UDP/TCP Guide](docs/UDP_TCP_LOOPBACK_GUIDE.md)** - Network configuration and testing
- **[FAQ](docs/faq.md)** - Frequently asked questions

### **Planning & Development**
- **[TODO & Roadmap](docs/TODO.md)** - Project planning and future enhancements  
- **[Documentation Summary](docs/DOCUMENTATION_SUMMARY.md)** - Complete docs overview (~53,000 words)

## Advanced Configuration

Want more control? Beacon also supports advanced system configurations:

```bash
# Use main system config
python3 beacon-run.py -i config/system/startBeacon.json

# Or use exchange-specific configs
python3 beacon-run.py -i config/system/startBeaconCME.json
python3 beacon-run.py -i config/system/startBeaconNYSE.json
```

This uses comprehensive system configurations for power users who need fine-grained control over multiple components. **[Learn more →](docs/advanced-usage.md)**

## 🏗️ Architecture 

```
Market Data Generator → UDP → Algorithm
                              ↓ (TWAP Orders)
Algorithm ← TCP ← Matching Engine
```

- **Generator**: Creates realistic market data (AAPL, MSFT, GOOGL)
- **Matching Engine**: Protocol-aware order matching (OUCH/Pillar/CME)  
- **Algorithm**: TWAP execution with binary protocol messaging
- **Monitoring**: Real-time progress tracking and settlement

## Supported Protocols

- **NASDAQ OUCH v5.0** - NASDAQ's native binary protocol
- **NYSE Pillar v3.2** - NYSE's high-performance protocol  
- **CME iLink 3** - CME Group's ultra-low latency protocol

All protocols use proper binary message formatting over TCP connections.

## TWAP Algorithm Features

- **Time-Weighted Execution** - Spreads orders evenly across time window
- **Configurable Slicing** - Control how many child orders to create
- **Protocol Aware** - Sends native binary messages for each exchange
- **Risk Controls** - Price tolerance and participation rate limits
- **Real-time Monitoring** - Track execution progress and fills

## Requirements

- **C++17** compiler (g++, clang++)
- **CMake 3.15+** 
- **Python 3.6+**
- **macOS/Linux** (tested on macOS, should work on Linux)

## Configuration Reference

### Trading Settings
- `symbol` - Stock symbol (AAPL, MSFT, etc.)
- `side` - B=Buy, S=Sell  
- `shares` - Total shares to execute
- `price` - Limit price per share
- `time_window_minutes` - TWAP execution window
- `slice_count` - Number of child orders

### System Settings  
- `protocol` - Exchange protocol (nasdaq, cme, nyse)
- `duration_seconds` - Total session runtime
- `market_data_port` - UDP port for market data (default: 8002)
- `order_entry_port` - TCP port for orders (default: 9002)

## Troubleshooting

**Port 9002 permission denied (-13 error)?**
```bash
sudo lsof -i :9002  # Check what's using the port
```

**Build issues?**
The system auto-detects and builds on first run. For manual build:
```bash
python3 beacon-build.py         # Clean build (recommended)
python3 beacon-build.py --debug # Debug build with symbols
```

**Config file corrupted?**
```bash
python3 beacon-config.py  # Restores default config
```

## Trade Reports

Detailed execution logs are saved to `trade_report.log`:
- Order submissions and acknowledgments
- Fill confirmations with prices and quantities  
- Protocol-specific message details
- Timing and performance metrics

## Use Cases

- **Algorithm Development** - Test TWAP strategies safely
- **Protocol Testing** - Validate binary message formatting
- **Performance Analysis** - Measure latency and throughput
- **Education** - Learn HFT system architecture
- **Research** - Market microstructure studies

---

## Philosophy

**Trading systems should be simple to use, not simple to build.**

Beacon hides the complexity of:
- Multi-protocol binary messaging
- Component orchestration  
- Build system management
- Configuration coordination
- Process lifecycle management

So you can focus on what matters: **your trading strategy**.

---

*Built for algorithmic traders who value both power and simplicity.*