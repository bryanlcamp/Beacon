# Beacon Trading Platform Documentation

Welcome to the comprehensive documentation for the Beacon high-frequency trading platform.

## Getting Started

- **[Installation Guide](installation-guide.html)** - Setup and installation instructions
- **[System Architecture](system/architecture.md)** - Overall platform design
- **[Quick Start](system/getting-started.md)** - Build and run your first trading system

## Core Components

### Applications
- **Generator** - Market data simulation and generation
- **Playback** - Historical data replay and backtesting
- **Matching Engine** - Order matching and execution
- **Client Algorithm** - Trading strategy implementation

### Libraries
- **beacon_hft** - High-frequency trading optimizations
- **beacon_algorithm** - Algorithm framework (TWAP, VWAP, POV)
- **beacon_exchange** - Multi-exchange protocol support
- **beacon_networking** - Performance networking components

## Exchange Protocol Support

- **[CME](exchange_protocols/cme/cme-ilink.html)** - iLink execution, MDP market data
- **[NASDAQ](exchange_protocols/nasdaq/nasdaq-ouch.html)** - OUCH execution, ITCH market data
- **[NYSE](exchange_protocols/nyse/nyse-pillar.html)** - Pillar execution protocols

## Performance & Development

- **[Building](system/building.md)** - CMake build system usage
- **[Testing](reference/testing-market-data.md)** - Comprehensive testing framework
- **[Network Guide](reference/network-guide.md)** - Network configuration
- **[Troubleshooting](reference/troubleshooting.html)** - Common issues and solutions

## Configuration

- **[Universal Config](universal-config.html)** - Unified configuration system
- **[Algorithm Configuration](config/templates/algorithm/CONFIG.md)** - Trading strategy setup
- **[System Configuration](system/configuration.md)** - Platform-wide settings

## Performance Targets

- **Tick-to-Trade Latency**: P50 < 8μs, P95 < 15μs, P99 < 25μs
- **Lock-Free Data Structures**: Sub-microsecond overhead
- **Multi-Exchange Support**: Simultaneous protocol handling
- **Thread Affinity**: CPU core isolation and optimization

---

**Beacon Trading Platform** - Production-grade HFT infrastructure for institutional trading.
