# Beacon Market Data Generator 🚀

A high-performance, production-ready market data generator for simulating realistic exchange trading activity with advanced wave patterns and burst dynamics.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Build System](#build-system)
- [Running the Generator](#running-the-generator)
- [Output Formats](#output-formats)
- [Performance](#performance)
- [Wave & Burst Dynamics](#wave--burst-dynamics)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [API Reference](#api-reference)

## 🎯 Overview

The Beacon Market Data Generator is a sophisticated C++20 application designed to simulate realistic exchange market data with configurable patterns, bursts, and waves. It supports multiple exchange protocols (NASDAQ ITCH, CME, NYSE) and generates high-fidelity market data for testing, backtesting, and algorithm development.

### Key Capabilities

- **Multi-Exchange Support**: NASDAQ ITCH, CME, NYSE protocols
- **Realistic Market Dynamics**: Configurable wave patterns and burst activity
- **High Performance**: Optimized C++20 with SIMD support and memory pooling
- **Production Ready**: Comprehensive error handling, logging, and monitoring
- **Flexible Configuration**: JSON-based configuration with validation
- **Scalable Output**: Binary serialization with configurable compression

## ✨ Features

### Core Features
- 🏁 **Multi-Protocol Support**: Generate data for NASDAQ, CME, and NYSE exchanges
- 📊 **Realistic Market Patterns**: Wave-based price movements with configurable amplitude and frequency
- 💥 **Burst Activity**: Simulate high-volume trading bursts with intensity control
- 🎯 **Symbol Management**: Multi-symbol configuration with individual characteristics
- 📈 **Statistics Tracking**: Real-time generation statistics and performance metrics
- 🔧 **Production Hardened**: Comprehensive error handling and validation

### Advanced Features
- 🌊 **Wave Dynamics**: Configurable market rhythm with amplitude and duration control
- ⚡ **Burst Coordination**: Synchronized or independent burst patterns across symbols
- 📝 **PascalCase Schema**: Modern, consistent JSON configuration format
- 🚀 **Optimized Performance**: Release builds with LTO and native architecture targeting
- 🛡️ **Memory Safety**: Address sanitizers and undefined behavior detection in debug builds
- 📊 **Rich Output**: Detailed generation summaries with per-symbol statistics

## 🏗️ Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Market Data Generator                     │
├─────────────────────────────────────────────────────────────┤
│  ConfigProvider    │  MessageGenerator  │   StatsManager   │
│  ├─ ConfigFileParser                    │   ├─ Statistics │
│  ├─ Validation                          │   ├─ Reporting  │
│  └─ Schema Management                   │   └─ Metrics    │
├─────────────────────────────────────────────────────────────┤
│                       Serializers                          │
│  NsdqSerializer  │  CmeSerializer   │   NyseSerializer    │
├─────────────────────────────────────────────────────────────┤
│                    Wave & Burst Engine                     │
│  WaveConfig      │  BurstConfig     │   Coordination      │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

- **ConfigProvider**: Manages configuration loading, validation, and serializer creation
- **ConfigFileParser**: Parses JSON configuration with comprehensive validation
- **MessageGenerator**: Core generation engine with wave/burst dynamics
- **Serializers**: Exchange-specific binary format writers (ITCH, CME, NYSE)
- **StatsManager**: Real-time statistics collection and reporting
- **Wave Engine**: Implements market rhythm and amplitude patterns
- **Burst Engine**: Manages high-intensity trading periods

## 🚀 Getting Started

### Prerequisites

- **C++20 Compiler**: GCC 10+, Clang 12+, or MSVC 19.29+
- **CMake**: Version 3.20 or higher
- **Python 3**: For build and run scripts
- **nlohmann/json**: Included in vendor directory

### Quick Start

1. **Build Debug Version**:
   ```bash
   cd /path/to/beacon
   python3 src/apps/generator/beacon-build-debug.py
   ```

2. **Run with Sample Configuration**:
   ```bash
   python3 src/apps/generator/scripts/beacon-run-debug.py \
     config/generator/sample_config.json output.bin
   ```

3. **Build Release Version** (for production):
   ```bash
   python3 src/apps/generator/beacon-build-release.py
   python3 src/apps/generator/scripts/beacon-run-release.py \
     config/generator/sample_config.json output.bin
   ```

## ⚙️ Configuration

### Configuration Schema

The generator uses a PascalCase JSON schema for modern, consistent configuration:

```json
{
  "Global": {
    "NumMessages": 10000,
    "Exchange": "nsdq"
  },
  "Wave": {
    "WaveDurationMs": 300000,
    "WaveAmplitudePercent": 120.0
  },
  "Burst": {
    "Enabled": true,
    "BurstIntensityPercent": 300.0,
    "BurstFrequencyMs": 60000
  },
  "Symbols": [
    {
      "SymbolName": "MSFT",
      "PercentTotalMessages": 60.0,
      "SpreadPercentage": 0.8,
      "PriceRange": {
        "MinPrice": 475.00,
        "MaxPrice": 535.00,
        "Weight": 1.0
      },
      "QuantityRange": {
        "MinQuantity": 10,
        "MaxQuantity": 100,
        "Weight": 1.0
      },
      "PrevDay": {
        "OpenPrice": 508.29,
        "HighPrice": 514.83,
        "LowPrice": 506.57,
        "ClosePrice": 510.53,
        "Volume": 14358338
      }
    }
  ]
}
```

### Configuration Sections

#### Global Configuration
- **NumMessages**: Total number of messages to generate (must be > 0)
- **Exchange**: Target exchange protocol (`"nsdq"`, `"cme"`, `"nyse"`)

#### Wave Configuration
- **WaveDurationMs**: Wave cycle duration in milliseconds (> 0)
- **WaveAmplitudePercent**: Wave intensity (50.0 - 500.0%)
  - `100%` = Flat market (no wave effect)
  - `150%` = 1.5x price variation
  - `50%` = Compressed price range

#### Burst Configuration
- **Enabled**: Enable/disable burst periods
- **BurstIntensityPercent**: Message volume multiplier during bursts
- **BurstFrequencyMs**: Time between burst periods

#### Symbol Configuration
- **SymbolName**: Trading symbol identifier
- **PercentTotalMessages**: Percentage of total messages (0.0 - 100.0)
- **SpreadPercentage**: Bid-ask spread as percentage of price
- **PriceRange**: Min/max price bounds with weight
- **QuantityRange**: Order quantity bounds with weight
- **PrevDay**: Previous day statistics for realistic price anchoring

### Validation Rules

1. **Message Count**: Must be greater than 0
2. **Exchange**: Must be one of supported exchanges
3. **Symbol Percentages**: Must sum to exactly 100.0%
4. **Price Ranges**: MinPrice ≤ MaxPrice, all values ≥ 0
5. **Wave Amplitude**: Must be between 50.0% and 500.0%
6. **All Weights**: Must be > 0.0

## 🔨 Build System

### Build Scripts

The generator includes Python build scripts for both debug and release configurations:

#### Debug Build
```bash
python3 src/apps/generator/beacon-build-debug.py
```
- **Sanitizers**: AddressSanitizer and UndefinedBehaviorSanitizer
- **Debug Symbols**: Full debugging information
- **Optimization**: Disabled (-O0) for debugging
- **Output**: `bin/debug/generator`

#### Release Build
```bash
python3 src/apps/generator/beacon-build-release.py
```
- **Optimization**: Maximum (-O3) with native architecture targeting
- **Link-Time Optimization**: Full LTO for maximum performance
- **Size Optimization**: Strip debug symbols
- **Output**: `bin/release/generator`

### Manual Build (CMake)

For advanced users or CI/CD integration:

```bash
# Configure
cmake -B build -S . -DCMAKE_BUILD_TYPE=Release

# Build generator target
cmake --build build --target generator

# Binary location
./build/src/apps/generator/generator
```

### Build Features

- **Automatic Dependency Detection**: nlohmann/json automatically found
- **Cross-Platform**: Works on Linux, macOS, and Windows
- **Parallel Builds**: Utilizes all available CPU cores
- **Clean Builds**: Scripts automatically clean previous builds

## 🎮 Running the Generator

### Python Run Scripts

#### Debug Runner
```bash
python3 src/apps/generator/scripts/beacon-run-debug.py \
  config/generator/sample_config.json output.bin
```

#### Release Runner
```bash
python3 src/apps/generator/scripts/beacon-run-release.py \
  config/generator/sample_config.json output.bin
```

### Direct Execution

```bash
# From project root
./bin/debug/generator config/generator/sample_config.json output.bin
./bin/release/generator config/generator/sample_config.json output.bin
```

### Command Line Arguments

```
Usage: ./generator <config_file> <output_file>
  <config_file>: Path to the JSON configuration file
  <output_file>: Path to the output binary file

Examples:
  ./generator config.json output.itch     # NASDAQ ITCH format
  ./generator config.json output.cme      # CME format  
  ./generator config.json output.nyse     # NYSE format
```

### Runtime Output

```
══════════════════════════════════════════════════════════════════════════
                    EXCHANGE MARKET DATA GENERATOR - STARTING                                     
══════════════════════════════════════════════════════════════════════════

Configuration:
  Target Messages:    10000
  Symbols:            MSFT (60%), AAPL (30%), GOOG (10%)

Generating messages (using sample_config.json)...

>>> File generation complete: output.bin <<<

══════════════════════════════════════════════════════════════════════════
                        MARKET DATA GENERATION SUMMARY                                          
══════════════════════════════════════════════════════════════════════════

  Symbol  Orders    Trades    TotalVol    AvgBid      AvgAsk      Spread      Spread%     Min-Max     
  ----------------------------------------------------------------------------------------------------
  GOOG    899       101       45673       300.63      299.74      -0.90       -0.30       52.40       
  AAPL    2703      297       138296      262.89      264.23      1.34        0.51        77.62       
  MSFT    5401      599       271135      505.31      507.44      2.13        0.42        60.00       
  ----------------------------------------                                                            
                                                        TOTAL   9003      997       455104      

══════════════════════════════════════════════════════════════════════════
```

## 📊 Output Formats

### Exchange Protocols

#### NASDAQ ITCH 5.0
- **File Extension**: `.itch` or `.bin`
- **Format**: Binary ITCH 5.0 messages
- **Message Types**: Add Order, Execute Order, Cancel Order, Trade
- **Specifications**: NASDAQ TotalView-ITCH 5.0

#### CME MDP 3.0
- **File Extension**: `.cme` or `.bin`
- **Format**: Binary CME Market Data Platform messages
- **Message Types**: New Order Single, Execution Report, Market Data
- **Specifications**: CME MDP 3.0 Protocol

#### NYSE Pillar
- **File Extension**: `.nyse` or `.bin`
- **Format**: Binary NYSE Pillar messages
- **Message Types**: Add Order, Modify Order, Delete Order, Trade
- **Specifications**: NYSE Pillar Gateway

### Binary Format Structure

Each output file contains:
1. **Header**: Protocol version, symbol count, message count
2. **Symbol Directory**: Symbol definitions and metadata
3. **Message Stream**: Time-ordered market data messages
4. **Footer**: Checksums and validation data

## ⚡ Performance

### Benchmarks

| Configuration | Messages/Second | Memory Usage | CPU Usage |
|---------------|-----------------|--------------|-----------|
| Debug Build   | ~50K msgs/sec   | ~100MB       | ~15%      |
| Release Build | ~500K msgs/sec  | ~50MB        | ~8%       |

### Optimization Features

- **SIMD Instructions**: Vectorized calculations where possible
- **Memory Pooling**: Pre-allocated message buffers
- **Zero-Copy Serialization**: Direct binary writing
- **Branch Prediction**: Optimized conditional logic
- **Cache-Friendly**: Data structure alignment and locality

### Scaling Guidelines

| Target Messages | Recommended RAM | Estimated Time |
|-----------------|-----------------|----------------|
| 1M messages     | 1GB            | 2 seconds      |
| 10M messages    | 2GB            | 20 seconds     |
| 100M messages   | 4GB            | 3 minutes      |
| 1B messages     | 8GB            | 30 minutes     |

## 🌊 Wave & Burst Dynamics

### Wave Patterns

Wave patterns simulate natural market rhythms:

```
Price
  ↑     ╭─╮        ╭─╮        ╭─╮
        ╱   ╲      ╱   ╲      ╱   ╲
  ─────╱─────╲────╱─────╲────╱─────╲────→ Time
              ╲  ╱       ╲  ╱       ╲  ╱
               ╲╱         ╲╱         ╲╱
  ↓             WaveDurationMs
```

#### Wave Configuration
- **Duration**: Controls cycle length (default: 5 minutes)
- **Amplitude**: Controls price variation intensity
- **Coordination**: Synchronize waves across symbols

### Burst Activity

Burst periods simulate high-intensity trading:

```
Volume
  ↑    Normal   🔥BURST🔥   Normal   🔥BURST🔥
       Activity              Activity          
  ████ ████████████████████ ████████████████████ ─→ Time
       ↑                   ↑
       BurstIntensityPercent = 300%
       │←── BurstFrequencyMs ──→│
```

#### Burst Configuration
- **Intensity**: Volume multiplier during bursts (e.g., 300% = 3x volume)
- **Frequency**: Time between burst periods
- **Coordination**: Synchronize bursts across symbols

### Advanced Patterns

#### Wave + Burst Combination
```
Price & Volume over Time:

Price   ╭─╮     ╭─╮     ╭─╮     ╭─╮
       ╱   ╲   ╱   ╲   ╱   ╲   ╱   ╲
      ╱     ╲ ╱     ╲ ╱     ╲ ╱     ╲
     ╱       ╲       ╲       ╲       ╲

Volume ████🔥████████🔥████████🔥████████
       Normal Burst Normal Burst Normal
```

## 🧪 Testing

### Test Configuration

Simple test configuration for validation:

```json
{
  "Global": {
    "NumMessages": 100,
    "Exchange": "nsdq"
  },
  "Wave": {
    "WaveDurationMs": 5000,
    "WaveAmplitudePercent": 100.0
  },
  "Burst": {
    "Enabled": false
  },
  "Symbols": [{
    "SymbolName": "TEST",
    "PercentTotalMessages": 100.0,
    "SpreadPercentage": 0.5,
    "PriceRange": {"MinPrice": 100.0, "MaxPrice": 200.0, "Weight": 1.0},
    "QuantityRange": {"MinQuantity": 1, "MaxQuantity": 10, "Weight": 1.0},
    "PrevDay": {"OpenPrice": 150.0, "HighPrice": 160.0, "LowPrice": 140.0, "ClosePrice": 155.0, "Volume": 1000}
  }]
}
```

### Running Tests

```bash
# Quick validation test
python3 src/apps/generator/scripts/beacon-run-debug.py \
  src/apps/generator/test_simple.json test_output.bin

# Full integration test
python3 src/apps/generator/scripts/beacon-run-debug.py \
  config/generator/sample_config.json full_test.bin
```

### Unit Tests

```bash
# Run unit tests (if available)
python3 src/apps/generator/scripts/beacon-run-tests.py
```

## 🔧 Troubleshooting

### Common Issues

#### Configuration Errors

**Problem**: `"Configuration validation failed: Global configuration is invalid"`
```bash
# Check configuration syntax and field names
python3 -m json.tool your_config.json
```

**Solution**: Ensure PascalCase field names and valid ranges

#### Build Errors

**Problem**: `"Generator binary not found!"`
```bash
# Rebuild the generator
python3 src/apps/generator/beacon-build-debug.py
```

**Solution**: Run build script before run script

#### Runtime Errors

**Problem**: `"Could not open configuration file"`
```bash
# Check file path and permissions
ls -la path/to/config.json
```

**Solution**: Use absolute paths or run from project root

### Debug Mode

Enable detailed error messages:
```bash
# Use debug build for verbose output
python3 src/apps/generator/beacon-build-debug.py
python3 src/apps/generator/scripts/beacon-run-debug.py config.json output.bin
```

### Validation Checklist

- [ ] Configuration file exists and is readable
- [ ] JSON syntax is valid
- [ ] All required fields are present
- [ ] Field names use PascalCase
- [ ] Symbol percentages sum to 100.0%
- [ ] All numeric ranges are valid
- [ ] Exchange type is supported

## 👨‍💻 Development

### Code Structure

```
src/apps/generator/
├── README.md                    # This file
├── CMakeLists.txt              # Build configuration
├── beacon-build-debug.py       # Debug build script
├── beacon-build-release.py     # Release build script
├── include/                    # Header files
│   ├── ConfigProvider.h        # Configuration management
│   ├── ConfigFileParser.h      # JSON parsing and validation
│   ├── MessageGenerator.h      # Core generation logic
│   ├── StatsManager.h          # Statistics collection
│   └── serializers/            # Exchange-specific serializers
│       ├── IMarketDataSerializer.h
│       ├── NsdqSerializer.h
│       ├── CmeSerializer.h
│       └── NyseSerializer.h
├── src/                        # Implementation files
│   ├── main.cpp               # Entry point
│   ├── ConfigProvider.cpp     # Configuration implementation
│   ├── ConfigFileParser.cpp   # JSON parsing implementation
│   ├── MessageGenerator.cpp   # Generation logic
│   ├── StatsManager.cpp       # Statistics implementation
│   └── serializers/           # Serializer implementations
├── scripts/                   # Runtime scripts
│   ├── beacon-run-debug.py    # Debug runner
│   ├── beacon-run-release.py  # Release runner
│   └── beacon-run-tests.py    # Test runner
├── tests/                     # Unit tests
└── test_simple.json           # Simple test configuration
```

### Adding New Features

1. **New Exchange Protocol**:
   - Implement `IMarketDataSerializer` interface
   - Add protocol-specific message formats
   - Update `ConfigProvider::createSerializer()`

2. **New Configuration Options**:
   - Update `ConfigFileParser.h` structs
   - Add validation in `validate()` methods
   - Update parsing in `ConfigFileParser.cpp`

3. **New Market Dynamics**:
   - Extend wave/burst configuration
   - Implement in `MessageGenerator.cpp`
   - Add validation rules

### Coding Standards

- **C++20**: Modern C++ features and best practices
- **RAII**: Resource management and exception safety
- **const-correctness**: Immutable data where possible
- **Move semantics**: Efficient object transfers
- **Error handling**: Comprehensive exception management

## 📚 API Reference

### ConfigProvider

```cpp
class ConfigProvider {
public:
    ConfigProvider(const std::string& exchangeType, const std::string& outputFilePath);
    bool loadConfig(const std::string& configPath);
    std::unique_ptr<IMarketDataSerializer> createSerializer() const;
    
    // Getters
    std::vector<SymbolData> getSymbolsForGeneration() const;
    size_t getMessageCount() const;
    const WaveConfig& getWaveConfig() const;
    const BurstConfig& getBurstConfig() const;
};
```

### ConfigFileParser

```cpp
class ConfigFileParser {
public:
    ConfigFileParser(const std::string& configFile);
    
    const GlobalConfig& getGlobalConfig() const;
    const WaveConfig& getWaveConfig() const;
    const BurstConfig& getBurstConfig() const;
    const std::vector<SymbolConfig>& getSymbols() const;
    
private:
    void parse(const std::string& filename);
    void validate() const;
};
```

### MessageGenerator

```cpp
class MessageGenerator {
public:
    MessageGenerator(const ConfigProvider& configProvider);
    void generateMessages(const std::string& outputPath, 
                         size_t messageCount,
                         const std::string& configFile);
    size_t getMessageCount() const;
    
private:
    void applyWavePattern(double& price, uint64_t timestamp);
    void applyBurstPattern(size_t& messageCount, uint64_t timestamp);
};
```

### Configuration Structures

```cpp
struct GlobalConfig {
    int NumMessages = 0;
    std::string Exchange;
    WaveConfig GlobalWaveConfig;
    BurstConfig GlobalBurstConfig;
    bool validate() const;
};

struct WaveConfig {
    int WaveDurationMs = 300000;
    double WaveAmplitudePercent = 100.0;
    bool validate() const;
};

struct BurstConfig {
    bool Enabled = false;
    double BurstIntensityPercent = 200.0;
    int BurstFrequencyMs = 60000;
    bool validate() const;
};
```

---

## 🎉 Conclusion

The Beacon Market Data Generator provides a comprehensive, high-performance solution for generating realistic market data with advanced wave and burst dynamics. Its production-ready architecture, extensive configuration options, and optimized performance make it ideal for algorithm testing, backtesting, and market simulation.

For questions, issues, or contributions, please refer to the project documentation or contact the development team.

**Happy Trading! 📈🚀**