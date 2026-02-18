# Beacon Core Applications

This directory contains the main trading system applications:

## Applications

### client_algorithm/
Trading algorithm implementations (TWAP, VWAP, POV, HFT strategies)

### common/
Shared configuration management and utilities

### generator/
Market data generation and simulation tools

### matching_engine/
Order matching engine implementation

### orchestrator/
System coordination and workflow management

### playback/
Historical data playback and backtesting tools

## Build Instructions

Each application has its own build system:
- Use build.py for automated builds
- CMakeLists.txt for manual cmake builds
- Separate debug/release configurations
