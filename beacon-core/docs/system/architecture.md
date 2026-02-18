# Beacon System Architecture

## Overview

Beacon is a modular, high-performance trading platform designed for institutional-grade algorithmic trading across multiple exchanges.

## Core Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Beacon Trading Platform                  │
├─────────────────────────────────────────────────────────────┤
│  Client Applications                                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────┐ │
│  │   Author    │ │    Pulse    │ │  Strategy   │ │ Match  │ │
│  │(Generator)  │ │(Playback)   │ │(Algorithm)  │ │(Engine)│ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Core Libraries (beacon-libs)                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │beacon_hft   │ │beacon_algo  │ │beacon_exch  │           │
│  │- Ringbuffers│ │- TWAP/VWAP  │ │- CME/NASDAQ │           │
│  │- CPU Affin. │ │- POV/HFT    │ │- NYSE       │           │
│  │- Latency    │ │- Risk Mgmt  │ │- Protocols  │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure                                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Networking  │ │Config Mgmt  │ │ Monitoring  │           │
│  │- TCP/UDP    │ │- JSON       │ │- Metrics    │           │
│  │- Multicast  │ │- Templates  │ │- Logging    │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Client Applications

#### Author (Market Data Generator)
- Synthetic market data generation
- Configurable symbol parameters
- Multiple output formats (Binary, CSV, JSON)
- Realistic price movement simulation

#### Pulse (Data Playback)
- Historical data replay
- Backtesting framework
- Configurable playback speeds
- Market session simulation

#### Strategy (Client Algorithm)
- Trading strategy execution
- Algorithm types: TWAP, VWAP, POV, HFT
- Real-time risk management
- Performance monitoring

#### Match (Matching Engine)
- Order book management
- Trade execution logic
- Multiple exchange protocols
- Execution reporting

### 2. Core Libraries

#### beacon_hft
**Purpose**: High-frequency trading optimizations
- Lock-free SPSC ringbuffers
- CPU affinity and thread pinning
- Sub-microsecond latency tracking
- Memory-mapped I/O

#### beacon_algorithm
**Purpose**: Trading algorithm framework
- Strategy base classes
- Risk management integration
- Position and P&L tracking
- Configuration hot-reloading

#### beacon_exchange
**Purpose**: Multi-exchange connectivity
- Protocol abstraction layer
- Exchange-specific message formats
- Serialization/deserialization
- Connection management

### 3. Exchange Protocol Support

| Exchange | Execution Protocol | Market Data Protocol |
|----------|-------------------|---------------------|
| CME      | iLink3            | MDP 3.0            |
| NASDAQ   | OUCH 4.2          | ITCH 5.0           |
| NYSE     | Pillar            | Integrated Feed     |

### 4. Performance Characteristics

#### Latency Targets
- **Tick-to-Trade**: P50 < 8μs, P95 < 15μs, P99 < 25μs
- **Order Entry**: < 50μs end-to-end
- **Market Data Processing**: < 1μs per message

#### Throughput Targets
- **Message Processing**: 1M+ messages/second
- **Order Generation**: 100K+ orders/second
- **Market Data Ingestion**: 10M+ ticks/second

#### Resource Usage
- **Memory**: Lock-free data structures, minimal allocation
- **CPU**: Thread affinity, CPU isolation
- **Network**: Zero-copy I/O, kernel bypass

## Data Flow

### Market Data Path
```
Exchange → Multicast → beacon_networking → Strategy → Order Generation
         ↓
    Playback/Generator → beacon_exchange → Algorithm → Risk Check → Matching Engine
```

### Order Execution Path
```
Strategy → Risk Management → Order Router → Exchange Gateway → Exchange
                                     ↓
                               Execution Reports → Position Updates
```

## Deployment Models

### Single-Server Development
- All components on one machine
- Shared memory communication
- Simplified configuration

### Production Multi-Server
- Dedicated market data servers
- Isolated trading servers
- Centralized risk management
- Redundant matching engines

### Cloud Deployment
- Container orchestration
- Auto-scaling capabilities
- Disaster recovery
- Geographic distribution

---

**Related**: [Building](building.md) | [Configuration](configuration.md) | [Getting Started](getting-started.md)
