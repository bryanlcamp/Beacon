# Beacon's Architecture

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
| <nobr>🔍 `Streaming Your Datasets`</nobr> | Play **your** datasets to **your strategy** via UDP Multicast. |
| <nobr>🔍 `Streaming Your Datasets`</nobr> | Your strategy, all market participants. and the matching engine consume your dataset.|
| <nobr>🔌 `Receiving Your Datasets`</nobr> | Plug in your trading strategy with minimal C++ code. |
| <nobr>🔌 `Receiving Your Datasets`</nobr> | Execute orders based on your strategy's signal. |
| <nobr>🔀 `Matching Engine `</nobr> | Execute against a TCP/IP bi-directional engine that sends ACKs/REJECTs,FILLs. |
| <nobr>🔀 `Matching Engine `</nobr> | The matching engine rebroadcasts FILLs to all market participants. |
| <nobr>📊 `Real-Time Metrics`</nobr> | Control and monitor playback of market data per product and exchange. |
| <nobr>📊 `Real-Time Analytics`</nobr> | Track real-time PnL, risk, and exchange market data errors.|
