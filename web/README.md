# Beacon Web Interface

**Professional Market Data Configuration for Independent Traders**

This directory contains the complete web-based interface for Beacon market data generation.

## Quick Start

### 1. Install & Setup
```bash
./install_beacon_web.sh
```

### 2. Launch Web Interface
```bash
./start_beacon_web.py
```

### 3. Open Browser
Navigate to: **http://localhost:8080**

## Files

- **`beacon_web_server.py`** - Flask web server backend
- **`start_beacon_web.py`** - Smart launcher script  
- **`market-data-config.html`** - Main web interface
- **`install_beacon_web.sh`** - One-click installer
- **`TRADER_README.md`** - Complete trader documentation

## Architecture

```
Beacon/
├── web/                    # Web interface (this directory)
│   ├── beacon_web_server.py      # Flask API server
│   ├── market-data-config.html   # Frontend UI
│   └── start_beacon_web.py       # Launcher
├── config/                 # Configuration storage
├── build/bin/generator     # C++ market data generator
└── outputs/               # Generated market data
```

**Completely Self-Contained**
- Runs on `localhost:8080` only
- No external network dependencies  
- All data stays on trader's machine
- Zero IT infrastructure required

Perfect for independent traders and startups!