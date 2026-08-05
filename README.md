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

| Functionality |  |
| :--- | :--- |
| <nobr>⚙️ `orchestrator`</nobr> | Coordinates startup of the Beacon ecosystem components. |
| <nobr>📝 `author`</nobr> | Creates user datasets. |
| <nobr>📡 `pulse`</nobr> | Broadcasts user datasets via UDP Multicast. |
| <nobr>📈 `strategy`</nobr> | Consumes market data from pulse and forwards to the user's strategy. |
| <nobr>🎯 `match`</nobr> | The matching engines for each product contained in pulse. |
  
## Key Features

| Features | Descriptions |
| :--- | :--- |
| <nobr>🗃️ `Creating Datasets`</nobr> | Build customizable datasets persisted in native exchange formats. Edit Later. |
| <nobr>🔍 `Streaming `</nobr> | Play **your** datasets to **your strategy** and to the matching engine via UDP Multicast. |
| <nobr>🔌 `Your Strategy`</nobr> | Plug in your trading strategy with minimal C++ code. |
| <nobr>🔀 `Matching Engine `</nobr> | A TCP/IP-based bidirectional matching engine that broadcasts executions. |
| <nobr>🖥️ `Real-Time Metrics`</nobr> | Monitor real-time market data speed and order execution metrics.. |
| <nobr>📊 `Real-Time Analytics`</nobr> | Track real-time PnL, risk, and exchange market data errors.|
