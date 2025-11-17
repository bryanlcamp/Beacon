# Beacon Trading System

Beacon is an exchange, live, simulated. But unique in that you have complete control. End-to-end. You generate market data. Tailor it. Specify the bid-ask spread, volatility factors, trading frequency, or use the intelligent defaults. You want to receive your market data in burst or waves, or a specific speed?  You want the market to halt or even crash? Just tell Beacon. And it will stream this market data to your algorithm via UDP using true NSDQ, CME, or NYSE protocol, just like you've asked. Complete exchange behavior. Isolated from your algorithm via UDP. All highly configurable via .json. 

Beacon delivers market data at high speed, decoded by a blazing-fast handler. This is where you implement your strategy—using your own logic, with TWAP and VWAP included as guides to illustrate integration. The process is straightforward, so you can focus on building and testing your ideas.

Proper risk management is essential for any successful algorithm. Beacon includes a built-in three-tier risk management system covering PnL, position, and messaging frequency. Each tier operates at three levels: warning, alert, and hard-stop. If you need more control, you can easily extend or replace the default risk system to fit your requirements.

When your algorithm is ready to trade, Beacon’s exchange encoders handle the heavy lifting—your order is formatted, sent via TCP, and processed by the matching engine in true FIFO style. You’ll get a clear response: ACK or REJECT. Fills trigger instant execution reports, so your algo can update positions and PnL in real time.

Beacon is built for unpredictable markets. Be ready—your algorithm will need to think fast when conditions change.


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
- Efficiently processes the market data you generate—fast and reliable
- Built-in risk management keeps your strategy in check, or add your own for total control
- Example strategies (TWAP, VWAP) show you how—just drop in your own logic and go
- Sends orders to the matching engine and updates positions and PnL in real time


### 4. Matching Engine
- Takes your orders over TCP. Strict FIFO.
- Extending it is straightforward: add your own matching logic if FIFO isn’t enough. Size/Time-Priority, Account for market makers. Extend the existing code, or implement your own via the public interface.
- Every submit/update/cancel delivers an ack or reject And every fill triggers an execution report, so your algo can update positions and PnL instantly. 

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