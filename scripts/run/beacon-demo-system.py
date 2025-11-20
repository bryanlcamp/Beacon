#!/usr/bin/env python3

"""
=============================================================================
Beacon System Demo
Demonstrates the unified system interface: ONE command, ONE config file
=============================================================================
"""

import os
import sys
from pathlib import Path

def main():
    beacon_root = Path("/Users/bryancamp/SoftwareDevelopment/cpp/commercial/beacon")
    
    print("🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀")
    print("                     BEACON TRADING SYSTEM DEMO")
    print("              🎯 ONE COMMAND, ONE CONFIG FILE, EVERYTHING WORKS 🎯")
    print("🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀")
    print()

    print("✨ PROFESSIONAL UNIFIED INTERFACE - CLEAN AND SIMPLE:")
    print("   📁 startBeacon.json has CRYSTAL CLEAR top section:")
    print("      • Protocol selection (itch_ouch, cme_ilink3, pillar_gateway)")
    print("      • Component config file references (just swap out JSON files)")
    print("      • Quick execution parameter overrides")
    print()

    print("   🚀 ONE command starts EVERYTHING:")
    print("      python3 beacon-run.py -i config/system/startBeacon.json")
    print()

    print("   🎯 Want CME instead? Just change the master config:")
    print("      python3 beacon-run.py -i config/system/startBeaconCME.json")
    print()

    print("📁 CONFIGURATION STRUCTURE (SUPER CLEAN):")
    print()

    print("🎯 startBeacon.json - MASTER CONFIGURATION:")
    print('   {')
    print('     "system": {')
    print('       "protocol": "itch_ouch",')
    print('       "startup_sequence": ["matching_engine", "client_algorithm", "playback"]')
    print('     },')
    print('     "component_configs": {')
    print('       "playback": {"enabled": true, "config_file": "config/playback/nasdaq_itch_playback.json"},')
    print('       "matching_engine": {"enabled": true, "config_file": "config/matching_engine/ouch_matching_engine.json"},')
    print('       "client_algorithm": {"enabled": true, "config_file": "config/client_algorithm/twap_aapl_buy.json"}')
    print('     },')
    print('     "execution_parameters": {"symbol": "AAPL", "side": "B", "shares": 5000, "price": 150.25}')
    print('   }')
    print()

    print("🔄 WANT DIFFERENT SETUP? JUST SWAP CONFIG FILES:")
    print("   • CME Futures: Change config_file paths to CME versions")
    print("   • NYSE Pillar: Change config_file paths to Pillar versions")
    print("   • Different algorithm: Change client_algorithm config_file")
    print("   • Different symbol: Change execution_parameters")
    print()

    print("🎯 DEMO COMMANDS:")
    print()

    print("# Start NASDAQ trading (60 seconds)")
    print("python3 beacon-run.py -i config/system/startBeacon.json")
    print()

    print("# Start CME futures trading (2 minutes)")
    print("python3 beacon-run.py -i config/system/startBeaconCME.json -d 120")
    print()

    print("# Start NYSE trading (90 seconds)")
    print("python3 beacon-run.py -i config/system/startBeaconNYSE.json")
    print()

    print("📋 WHAT HAPPENS WHEN YOU RUN IT:")
    steps = [
        "🔄 Loads unified configuration",
        "🔧 Generates component-specific configs automatically", 
        "🚀 Starts matching engine (TCP server)",
        "🤖 Starts algorithm (TWAP/VWAP with protocol-specific orders)",
        "📊 Starts market data playback (UDP broadcast)",
        "📈 Real-time monitoring with live statistics",
        "🛑 Graceful shutdown and cleanup"
    ]
    
    for i, step in enumerate(steps, 1):
        print(f"   {i}. {step}")
    print()

    print("🔗 ARCHITECTURE FLOW:")
    print("   playback(UDP) → algorithm(TCP) → matching_engine")
    print("        │              │                 │")
    print("        │              │                 └─ Receives protocol orders")
    print("        │              └─ Sends protocol-specific binary messages")
    print("        └─ Broadcasts protocol-specific market data")
    print()

    print("💎 CONFIGURATION BEAUTY:")
    beauty_points = [
        "System settings (name, duration, protocol)",
        "Network configuration (ports, hosts)", 
        "Component settings (playback, matching engine, algorithm)",
        "Algorithm parameters (symbol, side, shares, price)",
        "Risk controls and logging"
    ]
    
    print("   Everything in ONE file:")
    for point in beauty_points:
        print(f"   • {point}")
    print()

    print("🎯 READY TO TEST:")
    
    # Check if files exist
    checks = [
        (beacon_root / "beacon-run.py", "beacon-run.py ready"),
        (beacon_root / "config" / "system" / "startBeacon.json", "config/system/startBeacon.json ready"),
        (beacon_root / "build" / "src" / "apps" / "client_algorithm" / "AlgoTwapProtocol", "AlgoTwapProtocol binary ready")
    ]
    
    for file_path, success_msg in checks:
        if file_path.exists():
            print(f"✓ {success_msg}")
        else:
            if "AlgoTwapProtocol" in success_msg:
                print("⚠️  AlgoTwapProtocol needs building: cmake --build build --target AlgoTwapProtocol")
            else:
                print(f"✗ {file_path.name} not found")
    
    print()
    print("🚀 TRY IT NOW:")
    print(f"   cd {beacon_root}")
    print("   python3 beacon-run.py -i config/system/startBeacon.json")
    print()
    print("🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀")

if __name__ == "__main__":
    main()