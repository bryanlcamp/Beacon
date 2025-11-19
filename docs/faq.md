# ❓ Frequently Asked Questions

Common questions and answers about Beacon Trading System.

## 🚀 Getting Started

### **Q: What's the fastest way to get Beacon running?**
**A**: Just run `python3 beacon-simple.py` - it handles everything automatically:
- Builds the system on first run
- Creates default configuration  
- Generates sample market data
- Executes a demo TWAP algorithm

### **Q: What are the system requirements?**
**A**: Minimal requirements:
- **OS**: macOS, Linux, or WSL
- **Python**: 3.6 or newer
- **CMake**: 3.20 or newer  
- **Compiler**: GCC 7+ or Clang 5+
- **Memory**: 2GB RAM minimum
- **Disk**: 1GB free space

### **Q: Do I need trading experience to use Beacon?**
**A**: Not for basic usage! The simple interface is designed for developers to understand algorithmic trading concepts. However, for real trading you should understand:
- Market microstructure
- Order types and protocols
- Risk management principles

## 📊 Trading & Algorithms

### **Q: What's the difference between TWAP and VWAP?**
**A**: 
- **TWAP (Time-Weighted Average Price)**: Spreads orders evenly across time
  - Example: 600 shares over 60 minutes = 10 shares every minute
  - Good for: Large orders, reducing market impact
  
- **VWAP (Volume-Weighted Average Price)**: Spreads orders based on historical volume patterns
  - Example: More shares during high-volume periods (market open/close)
  - Good for: Matching market trading patterns

### **Q: How does TWAP slice calculation work?**
**A**: Given your configuration:
```json
{
    "shares": 100,
    "time_window_minutes": 2, 
    "slice_count": 6
}
```

Beacon calculates:
- **Total time**: 2 minutes = 120 seconds
- **Slice interval**: 120 ÷ 6 = 20 seconds between orders
- **Slice size**: 100 ÷ 6 = 16-17 shares per order
- **Execution**: Order every 20 seconds for 2 minutes

### **Q: Can I trade real stocks?**
**A**: Beacon is a **simulation system** designed for:
- Algorithm development and testing
- Learning market microstructure
- Protocol implementation research

For real trading, you'd need:
- Broker API integration
- Real market data feeds  
- Proper regulatory compliance
- Risk management systems

### **Q: What exchanges/protocols are supported?**
**A**: Built-in support for:
- **NASDAQ OUCH v5.0**: Binary protocol for NASDAQ trading
- **NYSE Pillar v3.2**: NYSE's high-performance protocol
- **CME iLink 3**: Futures trading protocol

You can add new protocols - see [Advanced Usage](advanced-usage.md#custom-protocol-implementation).

## ⚙️ Configuration & Customization

### **Q: How do I change the stock symbol?**
**A**: Edit `beacon-config.json`:
```json
{
    "symbol": "TSLA",        // Change from AAPL to TSLA
    "price": 250.0          // Update price accordingly
}
```

### **Q: How do I make orders execute faster/slower?**
**A**: Adjust the timing parameters:

**Faster execution (30 seconds total)**:
```json
{
    "time_window_minutes": 0.5,
    "slice_count": 3
}
```

**Slower execution (10 minutes)**:
```json
{
    "time_window_minutes": 10, 
    "slice_count": 20
}
```

### **Q: What do the #change_me comments mean?**
**A**: These mark the fields users typically customize:
```json
{
    "symbol": "AAPL",              // #change_me - Your stock
    "side": "B",                   // B=Buy, S=Sell
    "shares": 100,                 // #change_me - Quantity
    "price": 150.0,                // #change_me - Target price
    "time_window_minutes": 2,      // #change_me - Duration
    "slice_count": 6               // #change_me - # of orders
}
```

### **Q: How do I reset to default configuration?**
**A**: Run the reset script:
```bash
python3 beacon-reset-config.py
```
This restores the original `beacon-config.json`.

## 🔧 Technical Issues

### **Q: I get "Permission denied" errors. What's wrong?**
**A**: Usually port binding issues. Try:
```bash
# Check what's using port 9002
sudo lsof -i :9002

# Kill conflicting processes
sudo kill <PID>

# Or change port in beacon-config.json
"order_entry_port": 9003
```

### **Q: Build fails with compiler errors**
**A**: Check your compiler version:
```bash
g++ --version    # Need GCC 7+
clang++ --version # Or Clang 5+

# On older systems, install newer compiler:
# Ubuntu: sudo apt install gcc-9 g++-9
# macOS: xcode-select --install
```

### **Q: Components start but algorithm fails to connect**
**A**: Usually a timing issue. The algorithm tries to connect before the matching engine is ready. Solutions:
- **Automatic retry**: The system retries connections automatically
- **Manual restart**: Run `python3 beacon-simple.py` again
- **Increase delays**: Edit timing in the configuration

### **Q: System builds but no output appears**
**A**: Check that all components started successfully:
```bash
# Look for success messages:
[SUCCESS] [BUILD    ] ✅ All required binaries ready!
[SUCCESS] [GENERATOR] Data generation complete
[SUCCESS] [MATCH-ENG] Ready on port 9002 (PID: 12345)
[SUCCESS] [ALGORITHM] Connected to matching engine (PID: 12346)
```

If any component shows `[ERROR]`, check the [Troubleshooting Guide](troubleshooting.md).

## 📊 Output & Results

### **Q: What do the log messages mean?**
**A**: Key message types:
- `[SUCCESS]` - Component ready/operation completed
- `[INFO   ]` - Normal status updates  
- `[WARNING]` - Non-critical issues
- `[ERROR  ]` - Problems needing attention

**Component abbreviations**:
- `[BUILD    ]` - Build system
- `[GENERATOR]` - Market data generator
- `[MATCH-ENG]` - Matching engine  
- `[ALGORITHM]` - TWAP executor
- `[TRADING  ]` - Overall trading status
- `[SYSTEM   ]` - System coordination

### **Q: Where are the detailed results?**
**A**: Check `trade_report.log` for complete execution details:
```bash
cat trade_report.log
```

This includes:
- Execution summary
- Per-slice details with timestamps
- Performance metrics
- Price analysis

### **Q: Why do fill prices vary from my target price?**
**A**: This simulates real market behavior:
- **Market impact**: Large orders move prices
- **Bid-ask spread**: Orders execute at bid/ask, not mid-price
- **Market movement**: Prices change during execution
- **Realistic simulation**: The generator creates price volatility

### **Q: How do I interpret slippage?**
**A**: Slippage = Execution Price - Target Price
- **Negative slippage**: Better than expected (saved money)
  - Example: Target $150.00, executed at $149.95 → -$0.05 slippage
- **Positive slippage**: Worse than expected (cost money)
  - Example: Target $150.00, executed at $150.10 → +$0.10 slippage

## 🎯 Use Cases & Applications

### **Q: What can I learn from Beacon?**
**A**: Educational value includes:
- **Algorithmic trading concepts**: TWAP, VWAP, market impact
- **Market microstructure**: Order books, protocols, latency
- **System architecture**: Component design, communication patterns
- **Risk management**: Position limits, circuit breakers
- **Protocol implementation**: Binary message formats

### **Q: Can I extend Beacon for research?**
**A**: Absolutely! Extension possibilities:
- **New algorithms**: Implement VWAP, Implementation Shortfall, etc.
- **Machine learning**: Add predictive market impact models
- **New protocols**: Integrate different exchange APIs
- **Analytics**: Enhanced performance measurement
- **Risk systems**: Advanced position and P&L tracking

See [Advanced Usage](advanced-usage.md) for implementation details.

### **Q: Is Beacon suitable for academic research?**
**A**: Yes! Common research applications:
- **Algorithm comparison**: TWAP vs VWAP vs custom strategies
- **Market impact studies**: How order size affects execution
- **Protocol analysis**: Latency and throughput comparisons  
- **Risk management**: Testing circuit breakers and limits
- **Machine learning**: Training execution optimization models

### **Q: Can Beacon simulate different market conditions?**
**A**: Yes, through configuration:

**High volatility market**:
```json
{
    "price_volatility": 0.05,    // 5% price swings
    "message_count": 10000       // Lots of market activity  
}
```

**Calm market**:
```json
{
    "price_volatility": 0.001,   // 0.1% price swings
    "message_count": 100         // Less market activity
}
```

## 🚀 Performance & Scaling

### **Q: How fast is Beacon?**
**A**: Performance characteristics:
- **Order latency**: < 200 microseconds end-to-end
- **Throughput**: 10,000+ orders/second
- **Market data**: 100,000+ ticks/second
- **Memory usage**: < 100MB per component

For production HFT, see [Advanced Usage](advanced-usage.md#performance-optimization).

### **Q: Can I run multiple algorithms simultaneously?**
**A**: Yes, with the advanced interface:
```bash
# Use beacon-unified.py for multi-algorithm support
python3 beacon-unified.py --parallel
```

Configure multiple algorithms in `startBeacon.json`. See [Advanced Usage](advanced-usage.md#multi-algorithm-execution).

### **Q: Does Beacon support real-time market data?**
**A**: The current version uses simulated data, but the architecture supports real feeds:
- **Built-in**: Realistic simulation with configurable parameters
- **External**: Can integrate real market data vendors
- **Hybrid**: Replay historical data with live characteristics

## 🔐 Security & Risk

### **Q: What risk controls does Beacon have?**
**A**: Built-in protections include:
- **Position limits**: Maximum shares per symbol
- **Price collars**: Prevent orders far from market
- **Order size limits**: Cap individual order sizes
- **Rate limiting**: Prevent excessive order flow

For advanced risk management, see [Advanced Usage](advanced-usage.md#advanced-risk-management).

### **Q: Is Beacon secure for production use?**
**A**: Beacon is designed for **development and research**. For production trading:
- Add authentication and encryption
- Implement comprehensive audit logging  
- Add regulatory compliance features
- Integrate with certified risk systems

### **Q: How does Beacon handle errors?**
**A**: Multi-level error handling:
- **Graceful degradation**: Components restart automatically
- **Error reporting**: Clear diagnostic messages
- **Recovery procedures**: Automatic retry logic
- **Circuit breakers**: Emergency stop capabilities

## 📚 Documentation & Support

### **Q: Where can I find more documentation?**
**A**: Complete documentation set:
- **[Getting Started](getting-started.md)** - Step-by-step tutorial
- **[Configuration Reference](configuration.md)** - All settings explained
- **[Architecture Guide](architecture.md)** - System design details
- **[Advanced Usage](advanced-usage.md)** - Power user features
- **[Troubleshooting](troubleshooting.md)** - Common issues and solutions

### **Q: How do I report bugs or request features?**
**A**: For issues or suggestions:
1. Check the [Troubleshooting Guide](troubleshooting.md) first
2. Search existing documentation
3. Include complete error messages and configuration
4. Provide system information (OS, Python version, etc.)

### **Q: Can I contribute to Beacon?**
**A**: Contributions welcome! Areas of interest:
- **New algorithms**: VWAP, Implementation Shortfall, etc.
- **Protocol support**: Additional exchange protocols
- **Performance improvements**: Optimization and profiling
- **Documentation**: Tutorials, examples, guides
- **Testing**: Unit tests, integration tests, benchmarks

## 🎓 Learning Resources

### **Q: I'm new to algorithmic trading. Where should I start?**
**A**: Learning path:
1. **Start simple**: Run `python3 beacon-simple.py` and observe
2. **Understand TWAP**: Read about time-weighted average price
3. **Experiment**: Change parameters and see effects
4. **Study output**: Analyze `trade_report.log` results
5. **Read documentation**: [Architecture Guide](architecture.md) for deeper understanding

### **Q: What books/resources complement Beacon?**
**A**: Recommended reading:
- **"Algorithmic Trading" by Ernie Chan** - Practical strategies
- **"Dark Pools" by Scott Patterson** - Market structure
- **"Flash Boys" by Michael Lewis** - HFT landscape  
- **"Trading and Electronic Markets" by Larry Harris** - Market microstructure

### **Q: How does Beacon compare to commercial platforms?**
**A**: 
**Beacon advantages**:
- Open source and free
- Educational focus
- Simplified for learning
- Full source code access

**Commercial platforms**:
- Production-ready features
- Real market connectivity  
- Regulatory compliance
- Professional support

Beacon is perfect for learning and development; commercial platforms for real trading.

---

## 🔗 Related Documentation

- **[Getting Started](getting-started.md)** - Quick start tutorial
- **[Configuration Reference](configuration.md)** - All settings explained
- **[Architecture Guide](architecture.md)** - System design details
- **[Advanced Usage](advanced-usage.md)** - Power user features  
- **[Troubleshooting](troubleshooting.md)** - Common issues and solutions

---

**[← Back to Documentation Hub](index.md)**