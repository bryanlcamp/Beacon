#!/bin/bash

# =============================================================================
# Beacon Unified System Demo
# Shows the dream interface: ONE command, ONE config file, EVERYTHING works
# =============================================================================

BEACON_ROOT="/Users/bryancamp/SoftwareDevelopment/cpp/commercial/beacon"

echo "🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀"
echo "                  BEACON ULTIMATE DREAM INTERFACE DEMO"
echo "              🎯 ONE COMMAND, ONE CONFIG FILE, EVERYTHING WORKS 🎯"
echo "🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀"
echo ""

echo "✨ THE DREAM INTERFACE - SUPER CLEAR AND SIMPLE:"
echo "   📁 startBeacon.json has CRYSTAL CLEAR top section:"
echo "      • Protocol selection (itch_ouch, cme_ilink3, pillar_gateway)"
echo "      • Component config file references (just swap out JSON files)"
echo "      • Quick execution parameter overrides"
echo ""

echo "   🚀 ONE command starts EVERYTHING:"
echo "      python3 beacon-unified.py -i startBeacon.json"
echo ""

echo "   🎯 Want CME instead? Just change the master config:"
echo "      python3 beacon-unified.py -i configs/startBeaconCME.json"
echo ""

echo "📁 CONFIGURATION STRUCTURE (SUPER CLEAN):"
echo ""

echo "🎯 startBeacon.json - MASTER CONFIGURATION:"
echo '   {'
echo '     "system": {'
echo '       "protocol": "itch_ouch",'
echo '       "startup_sequence": ["matching_engine", "client_algorithm", "playback"]'
echo '     },'
echo '     "component_configs": {'
echo '       "playback": {"enabled": true, "config_file": "config/playback/nasdaq_itch_playback.json"},'
echo '       "matching_engine": {"enabled": true, "config_file": "config/matching_engine/ouch_matching_engine.json"},'
echo '       "client_algorithm": {"enabled": true, "config_file": "config/client_algorithm/twap_aapl_buy.json"}'
echo '     },'
echo '     "execution_parameters": {"symbol": "AAPL", "side": "B", "shares": 5000, "price": 150.25}'
echo '   }'
echo ""

echo "🔄 WANT DIFFERENT SETUP? JUST SWAP CONFIG FILES:"
echo "   • CME Futures: Change config_file paths to CME versions"
echo "   • NYSE Pillar: Change config_file paths to Pillar versions"
echo "   • Different algorithm: Change client_algorithm config_file"
echo "   • Different symbol: Change execution_parameters"
echo ""

echo "🎯 DEMO COMMANDS:"
echo ""

echo "# Start NASDAQ trading (60 seconds)"
echo "python3 beacon-unified.py -i startBeacon.json"
echo ""

echo "# Start CME futures trading (2 minutes)"
echo "python3 beacon-unified.py -i configs/startBeaconCME.json -d 120"
echo ""

echo "# Start NYSE trading (90 seconds)"
echo "python3 beacon-unified.py -i configs/startBeaconNYSE.json"
echo ""

echo "📋 WHAT HAPPENS WHEN YOU RUN IT:"
echo "   1. 🔄 Loads unified configuration"
echo "   2. 🔧 Generates component-specific configs automatically"
echo "   3. 🚀 Starts matching engine (TCP server)"
echo "   4. 🤖 Starts algorithm (TWAP/VWAP with protocol-specific orders)"
echo "   5. 📊 Starts market data playback (UDP broadcast)"
echo "   6. 📈 Real-time monitoring with live statistics"
echo "   7. 🛑 Graceful shutdown and cleanup"
echo ""

echo "🔗 ARCHITECTURE FLOW:"
echo "   playback(UDP) → algorithm(TCP) → matching_engine"
echo "        │              │                 │"
echo "        │              │                 └─ Receives protocol orders"
echo "        │              └─ Sends protocol-specific binary messages"
echo "        └─ Broadcasts protocol-specific market data"
echo ""

echo "💎 CONFIGURATION BEAUTY:"
echo "   Everything in ONE file:"
echo "   • System settings (name, duration, protocol)"
echo "   • Network configuration (ports, hosts)"
echo "   • Component settings (playback, matching engine, algorithm)"
echo "   • Algorithm parameters (symbol, side, shares, price)"
echo "   • Risk controls and logging"
echo ""

echo "🎯 READY TO TEST:"
if [ -f "$BEACON_ROOT/beacon-unified.py" ]; then
    echo "✓ beacon-unified.py ready"
else
    echo "✗ beacon-unified.py not found"
fi

if [ -f "$BEACON_ROOT/startBeacon.json" ]; then
    echo "✓ startBeacon.json ready"
else
    echo "✗ startBeacon.json not found"
fi

if [ -f "$BEACON_ROOT/build/src/apps/client_algorithm/AlgoTwapProtocol" ]; then
    echo "✓ AlgoTwapProtocol binary ready"
else
    echo "⚠️  AlgoTwapProtocol needs building: cmake --build build --target AlgoTwapProtocol"
fi

echo ""
echo "🚀 TRY IT NOW:"
echo "   cd $BEACON_ROOT"
echo "   python3 beacon-unified.py -i startBeacon.json"
echo ""
echo "🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀"