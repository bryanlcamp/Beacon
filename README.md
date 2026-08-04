# Beacon Platform - Web UI

**Financial Trading Platform Frontend** - Modern web interface for the Beacon trading system built with HTML, CSS, and JavaScript.

## Quick Start

1. **Open Local Server**: Run the "Open Beacon Web (Local)" task
2. **View Issues**: Check the terminal for your current GitHub issues
3. **Start Development**: Edit files and refresh browser to see changes

## 📁 Project Structure

```
beacon-web/
├── index.html                 # Main dashboard
├── apps/                      # Trading applications
│   ├── author/                # Strategy authoring tool
│   ├── match/                 # Order matching visualization
│   ├── pulse/                 # Market pulse monitor
│   └── strategy/              # Strategy development
├── demos/                     # Alternative layouts & experiments
│   └── smart-panels.html      # Alternative dashboard layout
├── api/                       # Backend API integration
│   └── flask-app/             # Python Flask API
├── datasets/                  # Static resources
    ├── css/                   # Stylesheets
    ├── js/                    # JavaScript modules
    └── images/                # Graphics
```

## Development Tasks

| Task | Description |
|------|-------------|
| Open Beacon Web (Local) | Start local development server on port 8080 |
| List My Issues | Show your assigned GitHub issues |
| Create Bug Issue (Web) | Create new frontend bug report |

## C++ Back-end Processes.

| orchestrator | Coordinates startup of the Beacon ecosystem components.
| author       | Creates user datasets.
| pulse        | Broadcasts user datasets via UDP Multicast.
| strategy     | Consumes market data from pulse and forwards to the user's strategy.
| match        | The matching engines for each product contained in pulse.

Bug Issue (Web) | Create new frontend bug report |

- **beacon-platform**: C++ back-end: author, pulse, strategy, match
- **D**: Market data feeds (CME, NASDAQ, NYSE, ICE)

## Key Features

- **Real-time Trading Dashboard**
- **Strategy Development Tools**
- **Order Matching Visualization**
- **Market Pulse Monitoring**
- **Performance Analytics**

---
