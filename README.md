# Beacon's User Interface

- **An intuitive way to interact with the Beacon ecosystem. Index.html navigates you everywhere.**<br>
- **Built with HTML, CSS, JavaScript. Communicates with back-end processes using Python Flask.**<br>
- **Intended to run on your localhost or behind a firewall. No internet connection required.**<br>

## Project Structure

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

## C++ Back-end Processes

* ⚙️ `orchestrator` &mdash; Coordinates startup of the Beacon ecosystem components.
* 📝 `author` &mdash;&mdash;&mdash;&mdash; Creates user datasets.
* 📡 `pulse` &mdash;&mdash;&mdash;&mdash;&mdash; Broadcasts user datasets via UDP Multicast.
* 📈 `strategy` &mdash;&mdash; Consumes market data from pulse and forwards to the user's strategy.
* 🎯 `match` &mdash;&mdash;&mdash;&mdash;&mdash; The matching engines for each product contained in pulse.
  
## Key Features

* 🗃️ **Granular Dataset Creation:** Build highly customizable datasets persisted in native exchange formats, with configurations saved for future editing.
* 🖥️ **Real-Time Dashboards:** Monitor live market data and order execution dashboards through an intuitive visual interface.
* 🔌 **Low-Code Strategy Integration:** Plug in your trading strategy instantly using minimal code to leverage Beacon's high-frequency trading (HFT) infrastructure.
* 🔍 **Market Data Diagnostics:** Play back and monitor market data streams with automated detection for dropped, out-of-order, or malformed packets.
* 📊 **Performance Analytics:** Track real-time profitability and exposure using interactive PnL, risk, and latency charts.
* 🔀 **True Bidirectional Architecture:** Process high-performance buy and sell orders natively through a deterministic matching engine pipeline.



## C++ Back-end Processes

* ⚙️ `orchestrator` — Coordinates startup of the Beacon ecosystem components.
* 📝 `author` — Creates user datasets.
* 📡 `pulse` — Broadcasts user datasets via UDP Multicast.
* 📈 `strategy` — Consumes market data from pulse and forwards to the user's strategy.
* 🎯 `match` — The matching engines for each product contained in pulse.
  
## Key Features

- **Create datasets with highly granular settings, persisted in native exchange format. Save dataset creation settings and edit later.
- **Real-time Market Data and Execution Dashboards.**
- **Easily plug in your trading strategy with minimal coding. Take advantage of Beacon's provided HFT infrastructure.**
- **Market data playback monitoring, including dropped, out of order, and malformed packets.**
- **Performance Analytics, including PnL, Risk, and Latency charts.**
- **A true bidirectional matching engine.**

---
