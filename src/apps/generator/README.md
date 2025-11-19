# Beacon Market Data Generator 🚀

High-performance market data generator that **drives Beacon's Live Backtester** with realistic exchange protocols and configurable market dynamics.

## Core Features

✅ **Binary Exchange Protocols** - Generate NASDAQ, CME, and NYSE data files where Beacon's data-driven architecture begins  
✅ **Human-Readable CSV Output** - Export data in CSV format for analysis and backtesting with identical market dynamics  
✅ **Protocol Versioning Integration** - Seamlessly integrates with Beacon's exchange protocol versioning system  
✅ **Realistic Market Microstructure** - Configurable wave patterns, burst activity, and proper bid-ask spreads  
✅ **High-Performance Architecture** - Optimized C++20 generating 500K+ messages/second## 1. Configuration

The generator uses a PascalCase JSON configuration with the following structure:

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

### Key Fields

- **Global**: Message count, exchange protocol (`nsdq`, `cme`, `nyse`)
- **Wave**: Market rhythm cycles and price variation intensity  
- **Burst**: High-volume trading periods with configurable intensity
- **Symbols**: Trading symbols with price ranges and message distribution

## Build Instructions

Build from generator directory:
```bash
./scripts/beacon_build/beacon-build-debug.py generator    # Debug build → bin/debug/generator
./scripts/beacon_build/beacon-build-release.py generator  # Release → bin/release/generator
```

## Testing 🧪

### Quick Test Run
```bash
# Run all generator tests (47 total tests)
python3 scripts/beacon-run-tests.py

# Run specific test suite
python3 scripts/beacon-run-tests.py --test TestStatsManager
python3 scripts/beacon-run-tests.py --test TestCsvSerializer
python3 scripts/beacon-run-tests.py --test TestConfigProvider
```

### Test Coverage (47 Total Tests)

**✅ TestConfigProvider** - 11 tests covering configuration loading, validation, and serializer factory:
- Config file parsing (valid/invalid/missing files)
- Exchange type validation (nsdq, cme, nyse)  
- Symbol percentage validation and distribution
- Wave and burst configuration loading
- CSV mode toggle functionality

**✅ TestStatsManager** - 14 tests covering statistics collection and reporting:
- Initial state and empty data handling
- Single/multiple symbol statistics accuracy
- Edge cases: zero prices, large quantities, special characters
- Price spread calculations and formatting
- Symbol ordering and display consistency

**✅ TestCsvSerializer** - 7 tests covering CSV output format:
- Header creation and file management
- Message serialization (Bid/Ask/Trade types)
- Price formatting (2 decimal places)
- Multiple message handling and line counting
- Message type string conversion

**✅ TestMessageGenerator** - 7 tests covering core message generation:
- Binary and CSV output modes
- Wave amplitude calculations and market cycles
- Burst generation and intensity patterns  
- Message count validation and symbol distribution
- Configuration validation and error handling

**✅ TestGeneratorIntegration** - 8 tests covering end-to-end workflows:
- Full pipeline testing (config → generation → output)
- Multi-exchange protocol support (NASDAQ/CME/NYSE)
- Large-scale message generation (10K+ messages)
- Configuration validation and file consistency
- Symbol distribution accuracy across formats

### Architecture Coverage
- **Configuration Management**: Full coverage of JSON parsing, validation, and error handling
- **Message Generation**: Complete testing of wave patterns, bursts, and distribution algorithms  
- **Output Serialization**: Comprehensive CSV testing, binary format validation via integration tests
- **Statistics Collection**: Thorough coverage of real-time stats, edge cases, and formatting
- **Integration Workflows**: End-to-end testing ensuring all components work together correctly

The test suite provides **comprehensive coverage** of all major generator components with focus on:
- 🔧 **Configuration edge cases** and validation
- 📊 **Statistical accuracy** and performance  
- 🎯 **Message distribution** and market dynamics
- 📁 **Output format consistency** across all supported exchanges
- 🚀 **Integration reliability** for production workflows

## 3. Usage

### Command Line Interface

```
Usage: ./bin/debug/generator [OPTIONS]

Options:
  -i, --input FILE     Input configuration file (JSON format)
  -o, --output FILE    Output file path
  -c, --csv            Generate CSV output instead of binary format
  -h, --help           Show help message

Example:
  # Generate binary exchange protocol data
  ./bin/debug/generator -i config/generator/sample_config.json -o data.bin
  
  # Generate CSV for analysis/backtesting
  ./bin/debug/generator -i config/generator/sample_config.json -o data.csv --csv
  
  # Show help
  ./bin/debug/generator --help
```

## 4. Example Output

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
  GOOG    894       106       43258       302.42      300.92      -1.50       -0.50       52.24       
  AAPL    2700      300       135118      262.99      264.11      1.12        0.42        78.12       
  MSFT    5399      601       276189      503.54      506.05      2.50        0.50        61.14       
          ================================                                                            
  TOTAL   8993      1007      454565      

══════════════════════════════════════════════════════════════════════════
```

### Output Formats

• **Binary Formats**: NASDAQ ITCH 5.0, CME MDP 3.0, NYSE Pillar (exchange-specific protocol messages)
• **CSV Format**: Human-readable with columns: timestamp, symbol, message_type, side, price, quantity, order_id, trade_id
• **Performance**: Release builds generate ~500K messages/second with ~50MB memory usage

## 5. Adding New Features

### Key Interfaces to Implement

**1. New Exchange Protocol**:
```cpp
// Implement IMarketDataSerializer interface
class MyExchangeSerializer : public IMarketDataSerializer {
public:
    void serializeMessage(const Message& message) const override;
};
```

**2. New Output Format** (like CSV):
```cpp
// Same interface, different implementation
class CsvSerializer : public IMarketDataSerializer {
public:
    void serializeMessage(const Message& message) const override {
        // Write CSV format instead of binary
    }
};
```

**3. New Configuration Options**:
- Update `ConfigFileParser.h` structs
- Add validation in `validate()` methods  
- Update parsing in `ConfigFileParser.cpp`

**4. New Market Dynamics**:
- Extend wave/burst configuration
- Implement in `MessageGenerator.cpp`

### Architecture
- **MessageGenerator**: Core generation engine
- **IMarketDataSerializer**: Pluggable output format interface
- **ConfigProvider**: Configuration management and serializer factory
- **StatsManager**: Real-time statistics collection

---