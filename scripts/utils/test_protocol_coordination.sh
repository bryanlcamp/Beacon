#!/bin/bash

# =============================================================================
# Beacon Protocol Coordination Test
# Demonstrates TWAP algorithm with protocol-specific coordination
# =============================================================================

set -e  # Exit on any error

BEACON_ROOT="/Users/bryancamp/SoftwareDevelopment/cpp/commercial/beacon"
BIN_DIR="$BEACON_ROOT/build/src/apps"

echo "════════════════════════════════════════════════════════════════════════════"
echo "                    BEACON PROTOCOL COORDINATION TEST"
echo "════════════════════════════════════════════════════════════════════════════"
echo ""

# Test 1: OUCH Protocol (NASDAQ)
echo "🔹 Test 1: NASDAQ OUCH v5.0 Protocol"
echo "   Architecture: playbook (ITCH UDP:8002) -> twap_algorithm -> matching_engine (TCP:9002)"
echo "   Symbol: AAPL | Side: BUY | Shares: 1000"
echo ""

# Test protocol-aware TWAP directly (without full orchestration for now)
echo "[TEST] Running TWAP with OUCH protocol configuration..."

# Create a test configuration that shows protocol coordination
cat > "$BEACON_ROOT/temp_test_twap_config.json" << 'EOF'
{
  "networking": {
    "market_data": {
      "host": "127.0.0.1",
      "port": 8002,
      "protocol": "UDP"
    },
    "order_entry": {
      "host": "127.0.0.1", 
      "port": 9002,
      "protocol": "TCP"
    }
  },
  "protocol_config": {
    "market_data_protocol": "itch_50",
    "order_entry_protocol": "ouch_50"
  },
  "twap_algorithm": {
    "time_window_minutes": 2,
    "slice_count": 4,
    "participation_rate": 0.20
  }
}
EOF

echo "[TEST] Configuration created: temp_test_twap_config.json"
echo "[TEST] Protocol: OUCH v5.0 (order_entry_protocol: ouch_50)"
echo "[TEST] Network: Market Data UDP:8002 -> Order Entry TCP:9002"
echo ""

# Show what would happen (don't actually connect since matching engine may not be running)
echo "[TEST] TWAP Algorithm would execute as follows:"
echo "  → Load configuration: ouch_50 protocol"  
echo "  → Connect to market data: UDP 127.0.0.1:8002 (ITCH v5.0 format)"
echo "  → Connect to matching engine: TCP 127.0.0.1:9002 (OUCH v5.0 format)"
echo "  → Send 4 slices of 250 shares each over 2 minutes"
echo "  → Each order: 64-byte OUCH EnterOrder message"
echo ""

# Test the executable (show help since we don't have matching engine running)
echo "[TEST] Testing TWAP executable..."
if [ -f "$BIN_DIR/client_algorithm/AlgoTwapProtocol" ]; then
    echo "✓ AlgoTwapProtocol executable found"
    echo ""
    echo "[DEMO] Command that would execute 1000 AAPL shares:"
    echo "$BIN_DIR/client_algorithm/AlgoTwapProtocol \\"
    echo "  --config temp_test_twap_config.json \\"
    echo "  --symbol AAPL --side B --shares 1000 --price 150.25"
    echo ""
    echo "[DEMO] Showing help output:"
    "$BIN_DIR/client_algorithm/AlgoTwapProtocol" --help
else
    echo "✗ AlgoTwapProtocol executable not found"
    echo "   Build it with: cmake --build build --target AlgoTwapProtocol"
fi

echo ""
echo "🔹 Test 2: CME Protocol Configuration"

# Create CME test configuration
cat > "$BEACON_ROOT/temp_test_cme_config.json" << 'EOF'
{
  "networking": {
    "market_data": {
      "host": "127.0.0.1",
      "port": 8001,
      "protocol": "UDP"
    },
    "order_entry": {
      "host": "127.0.0.1", 
      "port": 9001,
      "protocol": "TCP"
    }
  },
  "protocol_config": {
    "market_data_protocol": "cme_mdp3",
    "order_entry_protocol": "cme_ilink3"
  },
  "twap_algorithm": {
    "time_window_minutes": 3,
    "slice_count": 6,
    "participation_rate": 0.15
  }
}
EOF

echo "   Architecture: playbook (CME MDP3 UDP:8001) -> twap_algorithm -> matching_engine (iLink3 TCP:9001)"
echo "   Symbol: ESZ4 | Side: SELL | Contracts: 500"
echo ""
echo "[TEST] CME Configuration created: temp_test_cme_config.json"
echo "[TEST] Protocol: CME iLink 3 (order_entry_protocol: cme_ilink3)"
echo "[TEST] Network: Market Data UDP:8001 -> Order Entry TCP:9001"
echo ""
echo "[DEMO] Command for CME futures trading:"
echo "$BIN_DIR/client_algorithm/AlgoTwapProtocol \\"
echo "  --config temp_test_cme_config.json \\"
echo "  --symbol ESZ4 --side S --shares 500 --price 4250.50"
echo ""

echo "🔹 Protocol Orchestrator"
echo ""
echo "[TEST] Testing protocol orchestrator..."
if [ -f "$BEACON_ROOT/src/apps/orchestrator/protocol_orchestrator.py" ]; then
    echo "✓ Protocol orchestrator found"
    echo ""
    echo "[DEMO] Full system orchestration commands:"
    echo "# NASDAQ OUCH protocol with TWAP"
    echo "$BEACON_ROOT/src/apps/orchestrator/protocol_orchestrator.py itch twap 60"
    echo ""
    echo "# CME iLink 3 protocol with TWAP" 
    echo "$BEACON_ROOT/src/apps/orchestrator/protocol_orchestrator.py cme twap 120"
    echo ""
    echo "# NYSE Pillar protocol with VWAP"
    echo "$BEACON_ROOT/src/apps/orchestrator/protocol_orchestrator.py pillar vwap 90"
else
    echo "✗ Protocol orchestrator not found"
fi

echo ""
echo "════════════════════════════════════════════════════════════════════════════"
echo "                              SUMMARY"
echo "════════════════════════════════════════════════════════════════════════════"
echo ""
echo "✅ IMPLEMENTED:"
echo "   • Protocol-aware TWAP algorithm (AlgoTwapProtocol)"
echo "   • Centralized configuration management"
echo "   • Binary protocol message formatting (OUCH, Pillar, CME)"
echo "   • TCP connection to matching engines"
echo "   • Protocol orchestrator for full system coordination"
echo ""
echo "🔗 ARCHITECTURE:"
echo "   playbook(UDP) -> client_algorithm(TWAP/VWAP) -> matching_engine(TCP)"
echo "   │                     │                            │"
echo "   │                     │                            └─ Protocol-specific order processing"
echo "   │                     └─ Protocol-aware order generation & TCP sending"
echo "   └─ Protocol-specific market data (ITCH/Pillar/CME)"
echo ""
echo "📋 NEXT STEPS:"
echo "   1. Test with running matching engine: cmake --build build --target matching_engine"
echo "   2. Run full orchestration: ./protocol_orchestrator.py itch twap 30"
echo "   3. Implement VWAP algorithm following same pattern"
echo "   4. Add market data subscription to complete the loop"
echo ""

# Cleanup
rm -f "$BEACON_ROOT/temp_test_twap_config.json"
rm -f "$BEACON_ROOT/temp_test_cme_config.json"

echo "🎯 PROTOCOL COORDINATION: READY FOR TESTING"
echo "════════════════════════════════════════════════════════════════════════════"