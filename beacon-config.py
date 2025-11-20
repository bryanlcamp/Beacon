#!/usr/bin/env python3
"""
🆘 Beacon Config Recovery Tool 🆘

Usage:
    python3 beacon-reset-config.py

This will backup your current beacon-config.json (if it exists) 
and create a fresh one with default values.
"""

import json
import sys
from pathlib import Path
from datetime import datetime
import shutil

def create_fresh_config():
    """Create a clean beacon-config.json with sensible defaults"""
    
    config_file = Path("beacon-config.json")
    
    # Backup existing config if it exists
    if config_file.exists():
        backup_name = f"beacon-config.backup.{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        shutil.copy2(config_file, backup_name)
        print(f"✓ Backed up existing config to: {backup_name}")
    
    # Create fresh config
    fresh_config = {
        "_comment": "🚀 BEACON TRADING SYSTEM - USER CONFIG 🚀",
        "_description": "This file contains ONLY the settings you'll actually change. Edit values marked #change_me",
        "_instructions": "1. Change symbol, shares, price below  2. Run: python3 beacon.py  3. That's it!",
        
        "_trading_comment": "📈 MAIN TRADING SETTINGS #change_me",
        "symbol": "AAPL",
        "_symbol_help": "#change_me - Stock to trade: AAPL, MSFT, GOOGL, AMZN, TSLA, etc.",
        "side": "B", 
        "_side_help": "B=Buy, S=Sell",
        "shares": 1000,
        "_shares_help": "#change_me - How many shares to buy/sell total",
        "price": 150.00,
        "_price_help": "#change_me - Maximum price per share you're willing to pay",
        "time_window_minutes": 5,
        "_time_help": "#change_me - Spread the order over this many minutes (TWAP)",
        "slice_count": 10,
        "_slice_help": "Break the big order into this many smaller pieces",
        
        "_data_comment": "📊 MARKET DATA - What fake market data to create #change_me",
        "data_source": "generator",
        "_data_source_help": "generator=create fake data, playback=use real data file",
        "symbols_list": ["AAPL", "MSFT", "GOOGL"],
        "_symbols_help": "#change_me - Generate fake market data for these symbols", 
        "message_count": 5000,
        "_message_help": "#change_me - How much fake data to generate",
        "data_file": "outputs/market_data.bin",
        "_file_help": "#change_me - Name of the data file to create (in outputs/)",
        
        "_system_comment": "⚙️ SYSTEM - Usually don't need to change these",
        "protocol": "nasdaq",
        "_protocol_help": "nasdaq=NASDAQ protocol, cme=CME, nyse=NYSE",
        "duration_seconds": 30,
        "_duration_help": "How long to run the trading (seconds)",
        "market_data_port": 8002,
        "order_entry_port": 9002,
        
        "_matching_comment": "🎯 MATCHING ENGINE - How orders get filled", 
        "match_type": "fifo",
        "_match_help": "fifo=fair (first come, first served)",
        "fill_probability": 1.0,
        "_fill_help": "1.0=always fill orders, 0.8=fill 80% of time",
        "partial_fills": True,
        "_partial_help": "true=allow partial fills, false=all-or-nothing",
        
        "_components_comment": "🔧 COMPONENTS - Which parts of the system to run",
        "enable_generator": True,
        "_generator_help": "true=create market data, false=skip data generation", 
        "enable_playback": False,
        "_playback_help": "true=replay data from file, false=use generator",
        "enable_matching_engine": True,
        "_engine_help": "true=run order matching engine (almost always true)",
        "enable_algorithm": True, 
        "_algo_help": "true=run the trading algorithm (almost always true)",
        "startup_delay_seconds": 2,
        "_delay_help": "Seconds to wait between starting each component"
    }
    
    with open(config_file, 'w') as f:
        json.dump(fresh_config, f, indent=2)
    
    print(f"✅ Created fresh beacon-config.json")
    print(f"📝 Edit the values marked #change_me")  
    print(f"🚀 Then run: python3 beacon.py")
    
    return True

def main():
    print("🆘 Beacon Config Recovery Tool")
    print("This will create a fresh beacon-config.json file")
    
    response = input("\nContinue? (y/N): ").strip().lower()
    if response not in ['y', 'yes']:
        print("Cancelled.")
        return
    
    if create_fresh_config():
        print("\n✅ Config recovery complete!")
    else:
        print("\n❌ Config recovery failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()