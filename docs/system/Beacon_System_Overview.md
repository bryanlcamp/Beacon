# Beacon HFT Platform - Technical Overview

## System Architecture

Beacon is a complete, self-contained high-frequency trading simulation platform achieving **3.1μs P99 latency** on standard laptops. The system consists of four main components working together to create institutional-grade trading infrastructure.

---

## Core Components

### **Author** - Market Data Generation
**Purpose**: Creates synthetic bid/ask price streams for market simulation

**Key Features**:
- Generates bid/ask prices only (no trades - those are created dynamically)
- Two configuration modes:
  - **Percentage-based**: Seed price + range multiplier + spread controls
  - **Absolute ranges**: Direct price boundaries for trending scenarios
- Configurable volatility and spread behavior
- Supports bullish/bearish dataset creation
- Percentage of messages outside bid/ask spread (e.g., 99.5% within spread, 0.5% outliers)
- Native exchange message format output

**Advantages**:
- Flexible scenario creation without historical data limitations
- Cost-effective compared to expensive tick data licenses
- No data gaps or quality issues
- Sector-by-sector customization

**Limitations**:
- Price modeling is relatively simple (sophistication happens in Pulse)
- Requires understanding of market dynamics to create realistic scenarios

---

### **Pulse** - Network Simulation & Data Broadcasting
**Purpose**: Controls data flow and simulates real-world network conditions

**Key Features**:
- UDP multicast for market data distribution
- Configurable latency spikes and out-of-order packet delivery
- Per-product or per-dataset network condition control
- Exchange outage simulation
- Administrative message injection (heartbeats, trading halts, circuit breakers)
- Malformed/broken message testing
- Message flood testing (stress testing at maximum throughput)
- Real-time trade injection from Match back into data stream

**Chaos Engineering Capabilities**:
- Exchange dark periods
- Extreme latency simulation
- Packet corruption and loss
- Network disasters and failover scenarios
- Message rate bursts

**Advantages**:
- Complete network reality simulation
- Disaster recovery testing capability
- Stress testing beyond normal market conditions
- Configurable per exchange/product

**Limitations**:
- Complexity increases with realistic scenario requirements
- May be overkill for simple strategy testing

---

### **Core** - Strategy Execution Engine
**Purpose**: High-performance strategy execution environment

**Technical Architecture**:
- **C++20** with complete compile-time optimization
- **Lock-free design** - zero blocking operations
- **No virtual dispatch** - eliminates vtable overhead
- **Template metaprogramming** - compile-time polymorphism
- **Cache-optimized** - L1/L2 cache awareness throughout
- **Process isolation** - no shared memory access allowed
- **SPSC queues** - fastest possible queue design

**Strategy Interface**:
```cpp
// Dead simple hotpath
while (running) {
    tryPop(price_queue);  // Market data
    tryPop(order_queue);  // Order updates
    // Strategy logic here
}
```

**Performance Characteristics**:
- **3.1-3.5μs P99 latency** on consumer laptops
- Microsecond-consistent performance
- Industrial-grade real-time processing

**Advantages**:
- Institutional performance on commodity hardware
- Simple API despite sophisticated infrastructure
- Zero-copy, zero-allocation design
- Production-ready error handling

**Limitations**:
- Requires C++ expertise for strategy development
- Learning curve for lock-free programming concepts

---

### **Match** - Matching Engine & Risk Management
**Purpose**: Order matching, execution, and risk control

**Core Functionality**:
- Multi-participant TCP connections
- MPID (Market Participant ID) tracking
- Individual fills, confirmations, and rejections per connection
- Exchange protocol compliance (including MPID visibility rules)
- Real-time liquidity competition

**Expediter Component**:
- In-process artificial market maker
- Configurable liquidity provision at price levels
- Market improvement logic
- Realistic market maker competition simulation
- User-configurable or completely disabled

**Risk Management**:
- Real-time position limits (long/short per strategy/product)
- Notional exposure limits
- Order size controls
- Rate limiting (orders per second)
- Drawdown-based disconnection
- Cross-product portfolio limits

**Advantages**:
- Realistic multi-participant environment
- Comprehensive risk controls matching institutional standards
- Configurable market maker competition
- Exchange-authentic message handling

**Limitations**:
- Complexity of configuration for realistic scenarios
- Risk limit tuning requires market knowledge

---

## Build System

**Technology Stack**:
- **C++20** for all core components
- **Python** (latest version) for all scripts
- **CMake** with structured build system

**Build Structure**:
```bash
# Top level
build.py              # Builds debug/release
build.py -T           # Builds debug/release + runs all unit tests

# Each application directory has identical structure
app/build.py          # Local app build
app/build.py -T       # Local app build + tests
```

**Advantages**:
- Consistent build interface across all components
- Integrated testing workflow
- Hierarchical build organization

---

## System-Wide Advantages

### **Performance Revolution**
- **Democratizes HFT infrastructure**: Wall Street performance on laptops
- **Cost reduction**: Eliminates expensive co-location and hardware requirements
- **Microsecond consistency**: Predictable low-latency performance

### **Testing Paradigm Shift**
- **Scenario creation**: Test market conditions that haven't occurred yet
- **Disaster preparedness**: Validate error handling before production
- **Stress testing**: Beyond normal market conditions
- **Cost efficiency**: No expensive historical data licenses or shared databases

### **Development Benefits**
- **Self-contained**: No network or internet requirements
- **Horizontal scaling**: UDP multicast supports unlimited participants
- **Production readiness**: Institutional-grade infrastructure simulation
- **Complete analytics**: Performance breakdowns and trading metrics included

---

## System-Wide Limitations

### **Complexity**
- **Learning curve**: Requires understanding of HFT infrastructure concepts
- **Configuration overhead**: Realistic scenarios need careful setup
- **C++ requirement**: Strategy development requires low-level programming skills

### **Market Model Limitations**
- **Synthetic data**: While flexible, may miss nuanced real-market behaviors
- **Model assumptions**: Price generation models are simplified compared to real market dynamics
- **Validation challenge**: Ensuring synthetic scenarios accurately reflect future market conditions

---

## Competitive Advantages

1. **Performance**: 3.1μs P99 on laptops vs. institutional infrastructure requirements
2. **Cost**: Fraction of historical data + infrastructure costs
3. **Flexibility**: Create any market scenario vs. limited historical patterns
4. **Completeness**: Full trading stack vs. partial simulation tools
5. **Testing capability**: Disaster scenario validation vs. hope-and-pray deployment
6. **Accessibility**: Laptop deployment vs. institutional infrastructure barriers

---

## Target Use Cases

- **Strategy Development**: Rapid prototyping and testing
- **Risk Management**: Stress testing and disaster recovery validation
- **Education**: Learning HFT concepts without institutional infrastructure
- **Research**: Market microstructure analysis and experimentation
- **Production Preparation**: Bridge between development and live trading

---

*This document represents the current technical architecture as of the discussion. Individual components continue to evolve with additional features and optimizations.*