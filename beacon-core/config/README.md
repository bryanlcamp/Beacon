# Beacon Configuration Directory

This directory contains all configuration files for the Beacon trading platform.

## Structure

- **system/** - System-wide configurations
  - `startBeacon.json` - Main system startup configuration
  - `startBeaconCME.json` - CME-specific configuration
  - `startBeaconNasdaq.json` - NASDAQ-specific configuration
  - `startBeaconNYSE.json` - NYSE-specific configuration

- **apps/** - Application-specific configurations
  - `generator/` - Market data generator settings
  - `client_algorithm/` - Trading algorithm configurations
  - `matching_engine/` - Order matching settings
  - `playback/` - Data playback configurations

- **algorithms/** - Algorithm parameter files
  - `my_strategy_config.json` - Custom strategy settings

- **templates/** - Template configurations for easy setup
  - Ready-to-use configuration templates for different use cases

## Quick Start

For a basic trading setup:
```bash
python3 beacon-run.py -i config/system/startBeacon.json
```

For exchange-specific setups:
```bash
# CME futures trading
python3 beacon-run.py -i config/system/startBeaconCME.json

# NASDAQ equities trading
python3 beacon-run.py -i config/system/startBeaconNasdaq.json
```
