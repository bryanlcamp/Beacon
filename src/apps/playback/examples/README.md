# Playback Examples

This directory contains example implementations and reference code for the Beacon market data playback system.

## Files

### `tcp_message_sender_example.cpp`

An example implementation of a TCP-based message sender for market data playback. This demonstrates an alternative to the UDP multicast approach used in the main playback system.

**Features:**
- TCP server that accepts client connections
- Reliable, connection-oriented message delivery
- Configurable port binding
- Error handling and connection management
- Message counting and statistics

**Use Cases:**
- When you need reliable delivery (vs UDP's best-effort)
- Point-to-point market data feeds
- Testing scenarios where message ordering is critical
- Integration with systems that don't support multicast

**Note:** This is example/reference code. The production implementation is located in:
`../src/replayers/types/TcpReplayer.h`

## Usage

These examples are provided for reference and learning purposes. To use similar functionality in production, refer to the actual implementations in the main playback source tree.

## Related Documentation

- **Main Playback Documentation:** `../../../docs/`
- **Architecture Overview:** `../../../docs/architecture.md`
- **UDP vs TCP Playback Guide:** `../../../docs/UDP_TCP_LOOPBACK_GUIDE.md`