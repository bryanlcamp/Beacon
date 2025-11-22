# Beacon Market Data Configuration

**Professional Market Data Generator for Independent Traders**

## Quick Start

### 1. Launch Beacon Web Interface
```bash
python3 start_beacon_web.py
```

### 2. Open Your Browser
Navigate to: **http://localhost:8080**

### 3. Start Trading!
- Configure symbols and percentages
- Set market parameters
- Generate professional market data

---

## What You Get

✅ **Self-Contained Operation** - No network setup required  
✅ **Professional UI** - Clean, fast web interface  
✅ **Multiple Exchange Formats** - NASDAQ, NYSE, CME, CSV  
✅ **Smart Validation** - Prevents configuration errors  
✅ **Workflow Management** - Save and reuse configurations  
✅ **Real-time Generation** - Start/stop market data on demand  

---

## System Requirements

- **Python 3.7+** (included on most systems)
- **Web Browser** (Chrome, Firefox, Safari, Edge)
- **2GB RAM** minimum
- **Works on:** macOS, Windows, Linux

---

## Features for Traders

### Symbol Configuration
- **Percentage Distribution** - Control message volume per symbol
- **Price Ranges** - Set realistic min/max prices
- **Quantity Ranges** - Configure order sizes
- **Spread Control** - Adjust bid/ask spreads
- **Volume Matching** - Historical volume integration

### Market Patterns
- **Wave Patterns** - Simulate market cycles
- **Burst Events** - Model high-frequency spikes
- **Multiple Exchanges** - NASDAQ ITCH, NYSE Pillar, CME MBO
- **CSV Export** - For analysis tools

### Professional Workflow
- **Save Configurations** - Reuse successful setups
- **Validation System** - Prevents invalid configurations
- **Real-time Control** - Start/stop generation instantly
- **Status Monitoring** - Track generator performance

---

## Troubleshooting

### Port Already in Use
If you see "port already in use":
```bash
# Kill existing processes on port 8080
sudo lsof -ti:8080 | xargs kill -9

# Restart Beacon
python3 start_beacon_web.py
```

### Generator Not Found
If generator executable is missing:
```bash
# Build Beacon generator first
cmake --build build --target generator
```

### Python Dependencies
If Flask is not installed:
```bash
pip3 install flask
```

---

## Security & Compliance

- **Localhost Only** - No external network access
- **Self-Contained** - All data stays on your machine
- **No Cloud Dependencies** - Complete offline operation
- **File-Based Storage** - Easy backup and version control

---

## Support

For technical support or feature requests:
- Check the troubleshooting section above
- Review the Beacon documentation in `/docs`
- Ensure your system meets requirements

---

**Beacon - Professional Market Data Tools for Independent Traders**

*Self-contained • Compliant • Professional*