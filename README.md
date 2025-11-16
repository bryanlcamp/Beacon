# Beacon Trading System

Beacon is an exchange, live, simulated. But unique in that you have complete control. End-to-end. You generate market data. Tailor it. Specify the bid-ask spread, volatility factors, trading frequency, or use the intelligent defaults. You want to receive your market data in burst or waves, or a specific speed?  You want the market to halt or even crash? Just tell Beacon. And it will stream this market data to your algorithm via UDP using true NSDQ, CME, or NYSE protocol, just like you've asked. Complete exchange behavior. Isolated from your algorithm via UDP. All highly configurable via .json. 

Your algo is met by a blazing-fast market data handler that decodes exchange messages. And this is where you plug in your strategy. Simple TWAP and VWAP are provided to illustrate this process. But, rest-assured, this process is simple.

Now, as we all know, proper risk management plays a big parkt in an algo's success. So, Beacon comes with with a 3-tier risk management system: Pnl, Position, and Messaging Freqency. Each of these tiers has 3 levels: Warning, Alert, and Hard-Stop. If the default behavior doesn't suit your needs, then it's easy to plug in your own risk-systemk, or extend the one that has been provided.

When it comes time for your algo to send a message to the exchagnge, the provided exchange encoders will package up your order into the proper exchnage and send it to the exchange via TCP. Your algo will either be expeecting and ACK or a REJECT. Your order will be placed on the exchange's mtching engle, and orders will be executed in a FIFO manner. Should your ordder receive a fill, an execution report will be went back to your algo via exchange protocol where it will be decoded, and you can update your positions and Pnl accordingly.

Prepare for chaos and make sure your algorithm reacts intelligently when it matters most.


## ⚡ System Requirements

- [C++20](https://en.cppreference.com/w/cpp/20) Compiler
- [CMake](https://cmake.org/download/)
- [Python 3+](https://www.python.org/downloads/)
- [Linux](https://www.linux.org/pages/download/) or macOS


## 🚀 Quick Start

Setting up Beacon is ***straightforward!*** From a terminal:

```bash
git clone https://github.com/bryanlcamp/beacon.git
python3 beacon-build.py
python3 beacon-run.py
```

That's it! Beacon’s running with system defaults — see it in action before diving deeper.

**→ [Customizing Beacon](docs/getting-started.md)**

## 🎯 Key Features

✅ **Plug in your algo** — Simple setup. Tailor data. Test. Adjust. Iterate.  
✅ **Simulate stress** — Burst traffic. Push your algo. Test under pressure.  
✅ **Manage risk** — PnL, positions, messaging. Plug in your checks.  
✅ **Master unpredictability** — Halts. Crashes. Network failures. Prepare for chaos.  
✅ **Protocol support** — **NSDQ**, **NYSE**, **CME**. True compatibility.  
✅ **Zero setup** — No external network. Local TCP/UDP.  
✅ **Smart defaults** — Auto-adjust based on prior market data.  
✅ **Low latency — High-performance design.** **Full reports.**

## ⚡ Technologies

- **Languages:** [C++20](https://en.cppreference.com/w/cpp/20), [Python3](https://www.python.org/)
- **Build:** [CMake](https://cmake.org/), [GCC](https://gcc.gnu.org/) (Linux), [Clang](https://clang.llvm.org/) (MacOS)
- **CI/CD:** [GitHub Actions](https://docs.github.com/en/actions) (custom [.yaml](https://yaml.org))
- **Testing:** [GoogleTest](https://google.github.io/googletest/)
- **Networking:** [TCP/IP](https://en.wikipedia.org/wiki/Transmission_Control_Protocol) & [UDP loopback](https://en.wikipedia.org/wiki/Loopback)
- **IDE:** [VSCode](https://code.visualstudio.com/) (plug-ins/setup on request)
- **Configuration:** [.json](https://www.json.org/json-en.html) (available on request)
- **Source Control:** [GitHub](https://github.com/)
- **Docs & Issues:** [GitHub Docs](https://docs.github.com/en/github)
- **Project Management:** [GitHub Projects](https://docs.github.com/en/github/managing-your-work-on-github/about-project-boards)


## 🏗️ Architecture


**Beacon is a modular HFT trading system with four distinct executable parts, each of which can be run independently:**

### 1. Generator
- Creates binary data files containing exchange-formatted messages
- Control over total messages, symbols, exchanges, open (seed) price, bid-ask spread range, and trading frequency per symbol
- Downloads previous day’s close price and trading data for intelligent suggestions
- Generate unlimited datasets (binary files)

### 2. Playback
- Reads generator-created files into memory at startup
- Broadcasts real exchange packets via UDP, simulating a real exchange
- Flexible playback controls: burst frequency, circuit breakers, trading halts, message throttles, price overrides
- Pluggable rule system—implement your own interface
- Supports repeated playback of the same file

### 3. Client Algorithm
- Receives raw packets from playback via UDP
- Ultra-fast market-data handler: lock-free data structures, cache-aware padded structs, thread affinity, SPSC queue
- Hot path constantly polls SPSC queue (mm_pause), pinned to a core, no threading
- Built-in 3-tier risk checking (warning, alert, hard-stop): per-product position, messaging frequency, PnL
- Simple TWAP and VWAP algos provided; pluggable algo system—implement your own
- Sends order messages to matching engine via TCP using proper exchange protocol
- Handles execution reports; test your algorithm under diverse market conditions

### 4. Matching Engine
- Receives raw exchange-protocol order instructions from client_algo via TCP
- Simple FIFO matching engine, extensible for future enhancements
- Sends execution reports using proper exchange protocol back to client_algo via TCP

## 📊 Performance

**Last Run (MacBook Air):**
```
Market Data Received:  97,252
Orders Sent:           972
Fills Received:        1,586

Tick-to-Trade Latency:
  Mean:     4.621 μs
  Median:   4.000 μs
  p95:      7.709 μs
  p99:      21.500 μs
  Max:      56.541 μs
```

**Competitive HFT performance on a laptop!**

## 🔧 Scripts

All system scripts are in the `scripts/` directory with consistent `beacon-` naming:

```bash
beacon-run.py              # Run the trading system
beacon-build.py            # Build all components
beacon-kill.py             # Stop all processes
beacon-previous-prices.py  # Fetch yesterday's market prices
beacon-test-udp.py         # Test UDP multicast
```