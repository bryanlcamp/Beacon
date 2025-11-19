# UDP/TCP Loopback Simulation Guide

## Overview

This guide explains how to diagnose and set up a complete **loopback-based trading simulation** using only localhost addresses. This ensures network engineers don't need to be involved and all traffic stays isolated on the local machine.

## Complete Data Flow

```
┌─────────────┐    ┌──────────────┐    UDP Multicast     ┌─────────────────┐
│  generator  │───▶│   playback   │───▶ 239.255.0.1:12345 │ client_algorithm │
│             │    │              │                      │                 │
└─────────────┘    └──────────────┘                      └─────────────────┘
                                                                    │
                                                                    │ TCP
                                                                    ▼
                                                         ┌─────────────────┐
                                                         │ matching_engine │
                                                         │ 127.0.0.1:54321 │
                                                         └─────────────────┘
```

## Diagnostic Tools

### 1. Quick Connectivity Test
```bash
./scripts/beacon_utils/beacon-test-loopback-quick.sh
```
Tests both UDP multicast and TCP loopback to verify basic connectivity.

### 2. Comprehensive UDP Diagnostics  
```bash
./scripts/beacon_utils/beacon-diagnose-loopback.py
```
Detailed UDP multicast diagnostics with macOS-specific troubleshooting.

### 3. Interface Discovery (Advanced)
```bash
./scripts/beacon_utils/beacon-udp-interface-discovery.py
```
Finds which network interface works best for UDP multicast loopback.

## Configuration Files

### UDP Multicast Mode (Recommended)
**File**: `config/playback/loopback_simulation.json`
```json
{
  "sender_config": "senders/sender_udp_loopback.json",
  "authorities": [],
  "simulation_mode": true
}
```

**Sender**: `config/playback/senders/sender_udp_loopback.json`
```json
{
  "type": "udp",
  "address": "239.255.0.1",
  "port": 12345,
  "ttl": 1
}
```

### TCP Mode (Fallback)
**Sender**: `config/playback/senders/sender_tcp_loopback.json`  
```json
{
  "type": "tcp",
  "address": "127.0.0.1",
  "port": 12345
}
```

## Running Complete Simulation

### Automated Script (Easiest)
```bash
./scripts/beacon_run/beacon-run-loopback-simulation.sh
```

This script orchestrates all components automatically:
- Verifies builds
- Runs diagnostics  
- Generates test data
- Starts matching engine
- Starts playback
- Starts client algorithm
- Monitors for 30 seconds
- Cleans up processes

### Manual Setup (Step by Step)

1. **Build all components**:
   ```bash
   cmake --build build
   ```

2. **Generate test data**:
   ```bash
   ./build/bin/generator config/generator/sample_config.json test_data.bin
   ```

3. **Start matching engine** (Terminal 1):
   ```bash
   ./build/src/apps/matching_engine/matching_engine 54321
   ```

4. **Start playback** (Terminal 2):
   ```bash
   ./build/src/apps/playback/playback --config config/playback/loopback_simulation.json test_data.bin
   ```

5. **Start client algorithm** (Terminal 3):
   ```bash
   ./build/src/apps/client_algorithm/client_algorithm 239.255.0.1 12345 127.0.0.1 54321 30
   ```

## Loopback Address Usage

### ✅ Can Use Loopback (127.0.0.1) For:
- **TCP connections**: `client_algorithm ↔ matching_engine`
- **UDP unicast**: Point-to-point UDP communication  
- **File I/O**: Reading binary market data files
- **IPC**: Named pipes, shared memory, Unix sockets

### ⚠️ Multicast on Loopback:
- **UDP multicast (239.x.x.x)**: Works, but requires proper interface configuration
- **Interface selection**: Use `INADDR_ANY` (let OS choose), typically routes via `en0`
- **Loopback flag**: Must enable `IP_MULTICAST_LOOP=1`
- **Testing**: Always test first with diagnostic tools

### 🚀 Why This Works:
1. **No external network**: All traffic stays on localhost
2. **No firewall issues**: Loopback bypasses most firewall rules
3. **No routing complexity**: OS handles loopback routing automatically
4. **Deterministic performance**: No network jitter or packet loss
5. **Security**: Traffic never leaves the machine

## Troubleshooting

### UDP Issues:
- **Run diagnostics first**: Use diagnostic scripts to identify issues
- **Check multicast routes**: `netstat -rn | grep 224`
- **Try TCP mode**: If UDP multicast fails, use TCP configuration
- **Interface problems**: Use interface discovery script

### TCP Issues:
- **Port conflicts**: Check if port is already in use with `lsof -i :54321`
- **Connection refused**: Ensure matching engine starts before client
- **Firewall**: macOS firewall rarely blocks localhost, but check system preferences

### Performance Issues:
- **Buffer sizes**: UDP uses 2MB receive buffers by default
- **TCP_NODELAY**: Enabled for low-latency TCP connections
- **File I/O**: Binary files read sequentially with memory mapping
- **CPU affinity**: Consider pinning threads to specific cores

## Network Engineer Independence

This setup is specifically designed so **network engineers don't need to get involved**:

- ✅ **No external IPs**: Everything uses 127.0.0.1 or localhost multicast
- ✅ **No routing changes**: Uses OS default loopback routing  
- ✅ **No firewall rules**: Loopback traffic bypasses most firewalls
- ✅ **No VLAN configuration**: Self-contained on single machine
- ✅ **No DNS dependencies**: Uses IP addresses directly
- ✅ **No switch/router config**: Pure software simulation

The entire trading system simulation runs in complete **network isolation** while maintaining realistic UDP multicast and TCP protocols that mirror production environments.

## Testing Scenarios

### Basic Connectivity:
```bash
./scripts/beacon_utils/beacon-test-loopback-quick.sh
```

### Full Simulation:
```bash  
./scripts/beacon_run/beacon-run-loopback-simulation.sh
```

### Custom Duration:
```bash
# Edit TEST_DURATION in the script or run components manually
```

### Different Message Volumes:
```bash
# Modify config/generator/sample_config.json NumMessages parameter
```

This provides a complete, isolated trading system simulation that can run on any developer machine without external network dependencies! 🎯