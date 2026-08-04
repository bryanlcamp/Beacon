# Beacon's User Interface

- **An intuitive way to interact with the Beacon ecosystem. Index.html navigates you everywhere.**<br>
- **Built with HTML, CSS, JavaScript. Communicates with back-end processes using Python Flask.**<br>
- **Intended to run on your localhost or behind a firewall. No internet connection required.**<br>
- **This is simply Beacon's UI, and no additional code is intended to belong here. Customize at your own risk.**<br>


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

## C++ Back-end Processes

- **orchestrator:**  Coordinates startup of the Beacon ecosystem components. <br>
- **author:**        Creates user datasets. <br>
- **pulse:**         Broadcasts user datasets via UDP Multicast. <br>
- **strategy:**      Consumes market data from pulse and forwards to the user's strategy. <br>
- **match:**         The matching engines for each product contained in pulse. <br>

## Key Features

- **Real-time Trading Dashboard**
- **Strategy Development Tools**
- **Order Matching Visualization**
- **Market Pulse Monitoring**
- **Performance Analytics**

---
