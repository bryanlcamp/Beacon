# Client Algorithm Module

This module contains the Beacon HFT trading algorithm applications with a clean C++ project structure.

## Directory Structure

```
client_algorithm/
├── CMakeLists.txt          # Build configuration
├── include/                # Header files
│   └── ConfigProvider.h    # Configuration management
├── src/                    # Source files
│   ├── ClientAlgorithm.cpp         # Main trading algorithm
│   ├── MarketDataReceiver.cpp      # Super HFT market data receiver
│   ├── ClientAlgorithmHft.cpp      # HFT threaded algorithm
│   ├── ConfigProvider.cpp          # Configuration implementation
│   ├── AlgoTwap.cpp               # TWAP execution algorithm
│   ├── AlgoTemplate.cpp           # Algorithm template
│   ├── ExampleLatencyTracking.cpp # Latency tracking example
│   ├── TestPillar.cpp             # NYSE Pillar test client
│   └── TestCme.cpp                # CME test client
├── beacon-build-debug.sh    # Debug build script
└── beacon-build-release.sh  # Release build script
```

## Applications

All applications use the unified `NetworkSettings.json` configuration:

- **ClientAlgorithm**: Main trading algorithm with OUCH protocol support
- **MarketDataReceiver**: Super HFT UDP/TCP market data receiver  
- **ClientAlgorithmHft**: Production HFT algorithm with threading
- **AlgoTwap**: Time-Weighted Average Price algorithm
- **AlgoTemplate**: Template for creating new algorithms
- **ExampleLatencyTracking**: Latency measurement utilities
- **TestPillar**: NYSE Pillar protocol test client
- **TestCme**: CME protocol test client

## Building

```bash
# From project root
cmake --build build --target ClientAlgorithm
cmake --build build --target MarketDataReceiver

# Or build all client algorithm targets
cmake --build build --target ClientAlgorithm MarketDataReceiver ClientAlgorithmHft AlgoTwap
```

## Architecture

```
playback (UDP) -> client_algorithm <--> (TCP) matching_engine
```

All network settings are configured via the root `NetworkSettings.json` file.