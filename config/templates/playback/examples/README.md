# Playback Configuration Examples

This directory contains example configuration files for the Beacon playback system.

## Example Configurations

### `test_burst_config.json`
Configuration for burst-style market data playback using UDP sender with authority-based burst patterns.

### `test_wave_config.json`  
Configuration for wave-style market data playback using UDP sender with authority-based wave patterns.

## Usage

These configurations reference templates in the parent directories:
- **Sender**: `senders/senderUdp.json` - UDP network sender configuration
- **Authorities**: `authorities/authority_burst.json` and `authorities/authority_wave.json` - Pattern control configurations

## Running Examples

To use these configurations with the playback system:

```bash
# From beacon root directory
python3 beacon-run.py -i config/templates/playback/examples/test_burst_config.json
python3 beacon-run.py -i config/templates/playback/examples/test_wave_config.json
```

## Customization

Copy and modify these examples to create your own playback configurations:

```bash
cp config/templates/playback/examples/test_burst_config.json my_custom_config.json
# Edit my_custom_config.json as needed
```