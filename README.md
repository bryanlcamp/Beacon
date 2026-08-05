# Beacon's Architecture

- **Beacon provides an intuitive user interface to configure settings and interact with with back-end components.**<br>
- **The user interface is implemented with minimal dependencies, including HTML, CSS, JavaScript.**.<br>
- **All Beacon components run offline. No internet connection is required.**<br>

## Project Structure

```
beacon-web/                    # User interface.
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

beacon-core/                   # All server processes.
├── index.html                 # Available upon contract-signing.

```
  
## Key Features

| Features | Descriptions |
| :--- | :--- |
| <nobr>🗃️ `Creating Datasets`</nobr> | Build customizable datasets persisted in native exchange formats. Edit Later. |
| <nobr>👥 `Streaming Datasets`</nobr> | Play **your** datasets to **your strategy**, all participants, and the matching engine via UDP Multicast. |
| <nobr>🔌 `Dataset Processing`</nobr> | Plug in your trading strategy with minimal C++ code. |
| <nobr>⚡ `Core Infrastructure`</nobr> | Best in class infrastructure provided throughout to properly simulate trading in live markets.|
| <nobr>⏩ `Competition`</nobr> | Trade multiple instances of your strategies and compete against others. |
| <nobr>🚥 `Realistic Conditions`</nobr> | Multiple layers of competition of your strategies don't get every fill. |
| <nobr>🔀 `Matching Engine `</nobr> | Execute against a TCP/IP bi-directional engine that sends ACKs/REJECTs,FILLs. |
| <nobr>📢 `Execution Reports `</nobr> | The matching engine rebroadcasts FILLs to all market participants. |
| <nobr>📊 `Real-Time Metrics`</nobr> | Control and monitor playback of market data per product and exchange. |
| <nobr>🏦 `Real-Time Analytics`</nobr> | Track real-time PnL, risk, and exchange market data errors.|

## Back-end Processes

| Functionality | Purpose |
| :--- | :--- |
| <nobr>⚙️ `orchestrator`</nobr> | Coordinates startup of the Beacon server components. Just press start.|
| <nobr>📝 `author`</nobr> | Creates reusable and editable and use datasets. CME, NASDAQ, NYSE, ICE, and EUREX are supported.|
| <nobr>📡 `pulse`</nobr> | Broadcasts user datasets to the Beacon ecosystem via UDP Multicast. |
| <nobr>📈 `strategy`</nobr> | Consumes market data from pulse and forwards to the user's strategy. |
| <nobr>🎯 `match`</nobr> | The matching engines for each product contained in pulse. |
