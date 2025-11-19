# 🚀 Getting Started

A step-by-step tutorial for new users of the Beacon Trading System.

## ✅ Prerequisites

Before you begin, ensure you have:

- **macOS, Linux, or WSL** (Windows Subsystem for Linux)
- **Python 3.6+** with pip
- **CMake 3.20+** for building
- **C++ compiler** (GCC 7+ or Clang 5+)
- **Git** for version control

**Quick check**:
```bash
python3 --version   # Should be 3.6+
cmake --version     # Should be 3.20+
g++ --version       # Or clang++ --version
```

## 🎯 Quick Start (2 minutes)

The simplest way to get trading:

### 1. **Clone and Enter Directory**
```bash
git clone <repository-url> beacon
cd beacon
```

### 2. **Run the Dream Interface**
```bash
python3 beacon-simple.py
```

That's it! The system will:
- Auto-build all components on first run
- Create a default configuration
- Generate sample market data
- Start all trading components  
- Execute a sample TWAP algorithm
- Show you the results

**Expected output**:
```
[SUCCESS] [BUILD    ] ✅ All required binaries ready!
[SUCCESS] [GENERATOR] Data generation complete  
[SUCCESS] [MATCH-ENG] Ready on port 9002 (PID: 12345)
[SUCCESS] [ALGORITHM] Connected to matching engine (PID: 12346)
[SUCCESS] [SYSTEM   ] 🎉 All components started!
[SUCCESS] [TRADING  ] 🎯 TWAP algorithm execution begins
[SUCCESS] [ALGORITHM] Slice 1/6: 17 shares @ $150.25 → FILLED
[SUCCESS] [ALGORITHM] Slice 2/6: 17 shares @ $150.30 → FILLED  
[SUCCESS] [ALGORITHM] Slice 3/6: 17 shares @ $150.35 → FILLED
[SUCCESS] [ALGORITHM] Slice 4/6: 17 shares @ $150.28 → FILLED
[SUCCESS] [ALGORITHM] Slice 5/6: 16 shares @ $150.42 → FILLED
[SUCCESS] [ALGORITHM] Slice 6/6: 16 shares @ $150.38 → FILLED
[SUCCESS] [TRADING  ] ✅ TWAP execution complete
[SUCCESS] [SYSTEM   ] 📊 Trade report: trade_report.log
```

## 🛠️ Step-by-Step Setup

### Step 1: System Dependencies

**macOS (with Homebrew)**:
```bash
brew install cmake python3 gcc
```

**Ubuntu/Debian**:
```bash
sudo apt update
sudo apt install cmake python3 python3-pip build-essential
```

**CentOS/RHEL**:
```bash
sudo yum install cmake3 python3 gcc-c++ make
```

### Step 2: Build System

**Option A: Automatic Build**
```bash
python3 beacon-simple.py  # Builds automatically on first run
```

**Option B: Manual Build** 
```bash
cmake -B build -S .
cmake --build build
```

**Verify build success**:
```bash
ls build/src/apps/*/
# Should see: generator, matching_engine, AlgoTwapProtocol binaries
```

### Step 3: Configuration

**View default config**:
```bash
cat beacon-config.json
```

**Key settings to customize**:
```json
{
    "symbol": "AAPL",           // ← Change to your stock  
    "side": "B",                // B=Buy, S=Sell
    "shares": 100,              // ← Total shares to trade
    "price": 150.0,             // ← Target price
    "time_window_minutes": 2,   // ← TWAP duration 
    "slice_count": 6            // ← Number of smaller orders
}
```

**Reset to defaults anytime**:
```bash
python3 beacon-reset-config.py
```

## 🎮 Your First Trade

### Scenario: Buy 500 TSLA shares over 5 minutes

**1. Update configuration**:
```bash
# Edit beacon-config.json
{
    "symbol": "TSLA",              // #change_me
    "side": "B",                   // Buy side
    "shares": 500,                 // #change_me  
    "price": 250.0,                // #change_me
    "time_window_minutes": 5,      // #change_me
    "slice_count": 10              // #change_me
}
```

**2. Execute the trade**:
```bash
python3 beacon-simple.py
```

**3. View results**:
```bash
# See live progress in terminal
# Check detailed report
cat trade_report.log
```

The system will break your 500 shares into 10 slices of 50 shares each, executing one slice every 30 seconds over 5 minutes.

## 📊 Understanding Output

### **Component Status**
```
[SUCCESS] [BUILD    ] ✅ All required binaries ready!
[SUCCESS] [GENERATOR] Data generation complete  
[SUCCESS] [MATCH-ENG] Ready on port 9002 (PID: 12345)
[SUCCESS] [ALGORITHM] Connected to matching engine (PID: 12346)
```
Each component starts and reports its status. All must show `SUCCESS` before trading begins.

### **Trade Execution**  
```
[SUCCESS] [ALGORITHM] Slice 1/10: 50 shares @ $250.15 → FILLED
[SUCCESS] [ALGORITHM] Slice 2/10: 50 shares @ $250.22 → FILLED
```
Shows each TWAP slice execution with:
- Slice number and total count
- Share quantity for this slice
- Actual fill price
- Order status (FILLED/PARTIAL/REJECTED)

### **Final Summary**
```
[SUCCESS] [TRADING  ] ✅ TWAP execution complete  
[SUCCESS] [SYSTEM   ] 📊 Trade report: trade_report.log
```
Points you to the detailed trade report file.

## 🔧 Common Customizations

### **Change Trading Parameters**

**Faster execution** (30 seconds total):
```json
"time_window_minutes": 0.5,
"slice_count": 3
```

**Slower execution** (10 minutes):  
```json
"time_window_minutes": 10,
"slice_count": 20
```

**Different stock**:
```json
"symbol": "GOOGL",
"price": 2800.0  
```

### **Change Protocols**

The system supports multiple exchange protocols:

**NASDAQ (OUCH v5.0)**:
```json
"protocol": "ouch"
```

**NYSE (Pillar v3.2)**:
```json  
"protocol": "pillar"
```

**CME (iLink 3)**:
```json
"protocol": "cme"  
```

### **Adjust Market Data**

**More realistic data**:
```json
"message_count": 10000,        // More market updates
"price_volatility": 0.02       // 2% price swings  
```

**Calmer market**:
```json
"message_count": 1000,
"price_volatility": 0.005      // 0.5% price swings
```

## 🚨 Troubleshooting

### **"Permission denied" errors**
```bash
# Check port availability  
lsof -i :9002

# Kill conflicting processes
sudo kill <PID>

# Or change port in config
"order_entry_port": 9003
```

### **"Build failed" errors**
```bash
# Clean and rebuild
rm -rf build/
cmake -B build -S .
cmake --build build
```

### **"Config file not found"**
```bash
# Reset configuration
python3 beacon-reset-config.py
```

**Need more help?** See **[Troubleshooting Guide](troubleshooting.md)**

## 🎓 Next Steps

Once you're comfortable with the basics:

### **1. Learn Advanced Features**
- **[Configuration Reference](configuration.md)** - All settings explained
- **[Advanced Usage](advanced-usage.md)** - Power user features  

### **2. Understand the Architecture**
- **[Architecture Guide](architecture.md)** - How components work together
- **[Protocol Details](../docs/exchange_protocols/)** - Binary message formats

### **3. Extend the System**
- Add new algorithms
- Integrate different exchanges  
- Build custom protocols

### **4. Real Trading Considerations**
- Risk management systems
- Order management integration
- Market data vendor connections
- Regulatory compliance

## 💡 Tips for Success

### **Start Simple**
- Use the default configuration first
- Run small test trades (10-100 shares)  
- Understand the output before scaling up

### **Iterate Gradually**
- Change one parameter at a time
- Test each change thoroughly
- Keep working configurations backed up

### **Monitor Performance**
- Watch the live progress output
- Check trade_report.log for details
- Analyze execution quality metrics

### **Stay Organized**
- Keep different configs for different scenarios
- Document your customizations
- Version control your configuration changes

## 🎯 Example Scenarios

### **Scenario 1: Large Order Execution**
**Goal**: Buy 5,000 AAPL shares over 30 minutes

```json
{
    "symbol": "AAPL",
    "side": "B", 
    "shares": 5000,
    "price": 150.0,
    "time_window_minutes": 30,
    "slice_count": 30,
    "protocol": "ouch"
}
```

### **Scenario 2: Quick Scalping**  
**Goal**: Buy 100 shares in 10 seconds

```json
{
    "symbol": "SPY",
    "side": "B",
    "shares": 100, 
    "price": 400.0,
    "time_window_minutes": 0.167,  // 10 seconds
    "slice_count": 1,
    "protocol": "pillar"
}
```

### **Scenario 3: Careful Accumulation**
**Goal**: Build 1,000 share position over 2 hours  

```json
{
    "symbol": "MSFT",
    "side": "B",
    "shares": 1000,
    "price": 300.0, 
    "time_window_minutes": 120,
    "slice_count": 60,
    "protocol": "cme"
}
```

---

## 🔗 What's Next?

- **[Configuration Reference](configuration.md)** - Master all settings
- **[Architecture Guide](architecture.md)** - Understand the system design  
- **[Troubleshooting](troubleshooting.md)** - Fix common issues
- **[Advanced Usage](advanced-usage.md)** - Power user features

---

**[← Back to Documentation Hub](index.md)**