# Beacon Trading System Documentation

Welcome to the Beacon professional trading system documentation.

## Quick Start

1. **Download**: Get the latest release from [GitHub Releases](https://github.com/bryanlcamp/Beacon/releases)
2. **Build**: Run `python3 beacon-build.py --release`
3. **Configure**: Edit configuration files in `config/system/`
4. **Run**: Execute `python3 beacon-run.py -i config/system/startBeacon.json`

## System Architecture

Beacon consists of several core components:

### Market Data Generator
- **Location**: `src/apps/generator/`
- **Purpose**: Generates realistic market data feeds
- **Protocols**: NASDAQ OUCH, NYSE Pillar, CME iLink simulation

### Matching Engine
- **Location**: `src/apps/matching_engine/`
- **Purpose**: Simulates exchange order matching
- **Features**: Realistic order book, partial fills, queue simulation

### Trading Algorithms
- **Location**: `src/apps/client_algorithm/`
- **Purpose**: Implements trading strategies
- **Algorithms**: TWAP, Market Making, Custom algorithms

## Algorithm Development

### Creating Custom Algorithms

1. **Inherit from base class**: Extend the algorithm interface
2. **Implement callbacks**: Handle market data and execution reports
3. **Build and test**: Use the professional build system
4. **Deploy**: Add to configuration files

### Example Algorithm Structure

```cpp
class MyCustomAlgorithm : public IAlgorithm {
public:
    void onMarketData(const MarketData& data) override {
        // Process market data
        // Make trading decisions
    }
    
    void onExecutionReport(const ExecutionReport& report) override {
        // Handle order fills
        // Update position tracking
    }
};
```

## Configuration

### System Configuration

All configuration is managed through JSON files in the `config/` directory:

- **System configs**: `config/system/startBeacon*.json`
- **Algorithm configs**: Individual algorithm parameters
- **Network configs**: Exchange connection settings

### Professional Interface

Use the professional Python interface for system management:

- **Build**: `python3 beacon-build.py --release`
- **Run**: `python3 beacon-run.py -i <config-file>`
- **Configure**: `python3 beacon-config.py`

## Performance & Monitoring

### Latency Tracking

Beacon includes comprehensive latency measurement:

- **Tick-to-Trade**: Market data → Order sent
- **Order-to-Fill**: Order sent → Execution received
- **End-to-End**: Complete trading pipeline

### Risk Management

Three-tier risk management system:

- **WARNING**: 80% of limits
- **ALERT**: 95% of limits  
- **HARD_STOP**: 100% - automatic position flattening

## Release Management

### Version Information

Current version information is maintained in the `VERSION` file and follows semantic versioning.

### Professional Releases

Releases are created using the professional release management system:

```bash
python3 BeaconRelease.py patch   # Bug fixes (1.0.0 → 1.0.1)
python3 BeaconRelease.py minor   # New features (1.0.0 → 1.1.0)  
python3 BeaconRelease.py major   # Breaking changes (1.0.0 → 2.0.0)
```

## Support & Contributing

- **Issues**: [GitHub Issues](https://github.com/bryanlcamp/Beacon/issues)
- **Releases**: [GitHub Releases](https://github.com/bryanlcamp/Beacon/releases)
- **Source**: [GitHub Repository](https://github.com/bryanlcamp/Beacon)

---

*This documentation is automatically synchronized with the codebase and updated on every release.*