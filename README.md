# 🚀 Beacon Trading System

**The Ultimate Simple High-Frequency Trading Platform**

Beacon is a professional-grade trading system that implements TWAP (Time-Weighted Average Price) algorithms with protocol-aware execution for NASDAQ OUCH v5.0, NYSE Pillar v3.2, and CME iLink 3 protocols.

## ✨ The Dream Interface

**One Command. One Config File. That's it.**

```bash
python3 beacon-simple.py
```

## 🚀 Quick Start

### 1. **Run the System** (First Time)
```bash
python3 beacon-simple.py
```

The system will:
- ✅ Automatically detect if you need to build (first run)
- ✅ Compile all required components 
- ✅ Create a default `beacon-config.json` for you
- ✅ Run your first TWAP trade simulation

### 2. **Customize Your Trading** 
Edit `beacon-config.json` - it contains **only** the settings you'll actually change:

```json
{
  "_comment": "🚀 BEACON TRADING SYSTEM - USER CONFIG 🚀",
  "_description": "Edit the values marked #change_me",

  "symbol": "AAPL",           "#change_me - Stock to trade"
  "side": "B",               "B=Buy, S=Sell"  
  "shares": 1000,            "#change_me - Total shares"
  "price": 150.0,            "#change_me - Limit price"
  "time_window_minutes": 2,   "#change_me - How long to spread order"
  "slice_count": 6,          "Break into 6 smaller orders"
  
  "protocol": "cme",         "#change_me - nasdaq, cme, nyse"
  "duration_seconds": 30
}
```

### 3. **Run Again**
```bash
python3 beacon-simple.py
```

That's it! 🎉

## 📊 Sample Output

```
🚀 BEACON TRADING SYSTEM 🚀
Protocol: CME | Duration: 30s

TRADE: AAPL | BUY 1,000 @ $150.00 | 2min window
COMPONENTS: DATA-GEN + MATCH-ENG + ALGO

[16:07:14.611] [SUCCESS] [BUILD    ] ✅ All required binaries ready!
[16:07:14.611] [INFO   ] [SYSTEM   ] 🚀 Starting components...
[16:07:15.118] [SUCCESS] [GENERATOR] Data generation complete
[16:07:17.632] [SUCCESS] [MATCH-ENG] Ready on port 9002 (PID: 35947)
[16:07:19.149] [SUCCESS] [ALGORITHM] Connected to matching engine (PID: 35964)
[16:07:21.153] [SUCCESS] [SYSTEM   ] 🎉 All components started!
[16:07:21.154] [INFO   ] [ALGORITHM] 🎯 Executing TWAP: BUY 1,000 AAPL over 2 minutes
[16:07:21.154] [INFO   ] [MONITOR  ] Monitoring session for 30 seconds (settlement & trade tracking)...
[16:07:51.843] [SUCCESS] [SYSTEM   ] ✅ Trading session complete - Runtime: 30s
[16:07:51.843] [INFO   ] [SYSTEM   ] 📋 Trade report: ./outputs/trade_report.log
```

## 🎯 What Just Happened?

1. **Data Generation** - Created realistic market data for your symbols
2. **Matching Engine** - Started a CME-protocol matching engine on port 9002  
3. **TWAP Algorithm** - Connected and executed time-weighted average price strategy
4. **Trade Execution** - Split 1,000 AAPL shares into 6 orders over 2 minutes
5. **Settlement** - Monitored for 30 seconds to track fills and confirmations
6. **Trade Report** - Detailed activity saved to `outputs/trade_report.log`

## 📖 Documentation

- 🚀 **[Full Documentation Hub](docs/)** - Complete guides and references
- ⚙️ **[Advanced Usage](docs/advanced-usage.md)** - Power user features (`beacon-unified.py`)
- 🔧 **[Configuration Reference](docs/configuration.md)** - All settings explained
- 🏗️ **[Architecture Guide](docs/architecture.md)** - How Beacon works internally
- 🚨 **[Troubleshooting](docs/troubleshooting.md)** - Common issues & solutions

## ⚙️ Advanced Configuration

Want more control? Beacon also supports advanced system configurations:

```bash
# Use main system config
python3 beacon-unified.py -i config/system/startBeacon.json

# Or use exchange-specific configs
python3 beacon-unified.py -i config/system/startBeaconCME.json
python3 beacon-unified.py -i config/system/startBeaconNYSE.json
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

## 🔧 Supported Protocols

- **NASDAQ OUCH v5.0** - NASDAQ's native binary protocol
- **NYSE Pillar v3.2** - NYSE's high-performance protocol  
- **CME iLink 3** - CME Group's ultra-low latency protocol

All protocols use proper binary message formatting over TCP connections.

## 📈 TWAP Algorithm Features

- **Time-Weighted Execution** - Spreads orders evenly across time window
- **Configurable Slicing** - Control how many child orders to create
- **Protocol Aware** - Sends native binary messages for each exchange
- **Risk Controls** - Price tolerance and participation rate limits
- **Real-time Monitoring** - Track execution progress and fills

## 🛠️ Requirements

- **C++17** compiler (g++, clang++)
- **CMake 3.15+** 
- **Python 3.6+**
- **macOS/Linux** (tested on macOS, should work on Linux)

## 📋 Configuration Reference

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

## 🚨 Troubleshooting

**Port 9002 permission denied (-13 error)?**
```bash
sudo lsof -i :9002  # Check what's using the port
```

**Build issues?**
The system auto-detects and builds on first run. For manual build:
```bash
cmake -B build -S .
cmake --build build
```

**Config file corrupted?**
```bash
python3 beacon-reset-config.py  # Restores default config
```

## 📝 Trade Reports

Detailed execution logs are saved to `trade_report.log`:
- Order submissions and acknowledgments
- Fill confirmations with prices and quantities  
- Protocol-specific message details
- Timing and performance metrics

## 🎯 Use Cases

- **Algorithm Development** - Test TWAP strategies safely
- **Protocol Testing** - Validate binary message formatting
- **Performance Analysis** - Measure latency and throughput
- **Education** - Learn HFT system architecture
- **Research** - Market microstructure studies

---

## 💡 Philosophy

**Trading systems should be simple to use, not simple to build.**

Beacon hides the complexity of:
- Multi-protocol binary messaging
- Component orchestration  
- Build system management
- Configuration coordination
- Process lifecycle management

So you can focus on what matters: **your trading strategy**.

---

*Built with ❤️ for algorithmic traders who value both power and simplicity.*