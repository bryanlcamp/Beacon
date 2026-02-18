# Beacon Core Testing Framework

Comprehensive test suite for the beacon trading platform.

## Test Categories

### algorithm/
Trading algorithm logic tests
- Order management
- Risk limits
- Strategy logic validation

### core/
Core infrastructure tests
- Latency tracking
- Thread pinning
- Ringbuffer performance
- Network components

### integration/
End-to-end system tests
- Tick-to-trade latency
- Full trading workflows

### market_data/
Market data processing tests
- Message generation
- Protocol serialization
- Symbol parameter validation

### matching_engine/
Order matching tests
- Order book management
- Execution reports
- Trade matching logic

### protocols/
Exchange protocol tests
- ITCH (NASDAQ)
- MDP (CME)
- OUCH (NASDAQ execution)
- Pillar (NYSE)

## Running Tests

```bash
# All tests
mkdir build && cd build
cmake ..
make test

# Specific test category
ctest -R "algorithm"
ctest -R "integration"
```
