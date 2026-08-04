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

| Component | Responsibility |
| :--- | :--- |
| <nobr>⚙️ `orchestrator`</nobr> | Coordinates startup of the Beacon ecosystem components. |
| <nobr>📝 `author`</nobr> | Creates user datasets. |
| <nobr>📡 `pulse`</nobr> | Broadcasts user datasets via UDP Multicast. |
| <nobr>📈 `strategy`</nobr> | Consumes market data from pulse and forwards to the user's strategy. |
| <nobr>🎯 `match`</nobr> | The matching engines for each product contained in pulse. |
  
## Key Features

| Feature | Capabilities |
| :--- | :--- |
| <nobr>🗃️ **Datasets**&nbsp;&nbsp;</nobr> | Build highly customizable datasets persisted in native exchange formats, with configurations saved for future editing. |
| <nobr>🖥️ **Dashboard**&nbsp;&nbsp;</nobr> | Monitor real-time market data and execution metrics through a visual management interface. |
| <nobr>🔌 **Strategy**&nbsp;&nbsp;</nobr> | Plug in your trading strategy instantly with minimal code to leverage Beacon's high-frequency trading (HFT) infrastructure. |
| <nobr>🔍 **Diagnostics**&nbsp;</nobr> | Play back and monitor market data streams with automated detection for dropped, out-of-order, or malformed packets. |
| <nobr>📊 **Analytics**&nbsp;&nbsp;</nobr> | Track real-time profitability and exposure using interactive PnL, risk, and latency charts. |
| <nobr>🔀 **Matching**&nbsp;&nbsp;</nobr> | Process high-performance buy and sell orders natively through a true, deterministic matching architecture. |
