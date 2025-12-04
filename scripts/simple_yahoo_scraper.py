import json
import requests
from datetime import datetime
from typing import Dict, List, Optional

class SimpleYahooScraper:
    def __init__(self):
        self.base_url = "https://query1.finance.yahoo.com/v8/finance/chart"
    
    def get_symbol_data(self, symbol: str) -> Optional[Dict]:
        """Get OHLCV data using Yahoo's JSON API (no scraping)"""
        try:
            url = f"{self.base_url}/{symbol.upper()}"
            params = {
                'interval': '1d',
                'range': '2d'  # Get 2 days to have previous day data
            }
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
            
            response = requests.get(url, params=params, headers=headers, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if not data.get('chart', {}).get('result'):
                print(f"No data found for {symbol}")
                return None
            
            result = data['chart']['result'][0]
            meta = result['meta']
            quotes = result['indicators']['quote'][0]
            
            # Get latest trading day data
            latest_idx = -1
            prev_idx = -2 if len(quotes['close']) > 1 else -1
            
            # Create symbol data matching your config format
            symbol_data = {
                "SymbolName": symbol.upper(),
                "PercentTotalMessages": 30,
                "TradeProbability": 0.15,
                "SpreadPercentage": 0.5,
                "PriceRange": {
                    "MinPrice": round(float(quotes['low'][latest_idx]) * 0.95, 2),
                    "MaxPrice": round(float(quotes['high'][latest_idx]) * 1.05, 2),
                    "Weight": 1.0
                },
                "QuantityRange": {
                    "MinQuantity": 10,
                    "MaxQuantity": 100,
                    "Weight": 1.0
                },
                "PrevDay": {
                    "OpenPrice": round(float(quotes['open'][prev_idx]), 2),
                    "HighPrice": round(float(quotes['high'][prev_idx]), 2),
                    "LowPrice": round(float(quotes['low'][prev_idx]), 2),
                    "ClosePrice": round(float(quotes['close'][prev_idx]), 2),
                    "Volume": int(quotes['volume'][prev_idx]) if quotes['volume'][prev_idx] else 1000000
                }
            }
            
            print(f"✓ {symbol}: ${quotes['close'][latest_idx]:.2f} (Vol: {quotes['volume'][latest_idx]:,})")
            return symbol_data
            
        except Exception as e:
            print(f"✗ Error getting {symbol}: {str(e)}")
            return None
    
    def create_config(self, symbols: List[str], num_messages: int = 10000, 
                     exchange: str = "nsdq", output_file: str = None) -> Dict:
        """Create Beacon config with real market data"""
        
        symbol_data = []
        for symbol in symbols:
            data = self.get_symbol_data(symbol)
            if data:
                symbol_data.append(data)
        
        if not symbol_data:
            return None
        
        # Distribute message percentages
        total_symbols = len(symbol_data)
        base_percent = 100 // total_symbols
        remainder = 100 % total_symbols
        
        for i, symbol in enumerate(symbol_data):
            percent = base_percent + (1 if i < remainder else 0)
            symbol["PercentTotalMessages"] = percent
        
        config = {
            "Global": {
                "NumMessages": num_messages,
                "Exchange": exchange
            },
            "Wave": {
                "WaveDurationMs": 2000,
                "WaveAmplitudePercent": 110.0
            },
            "Burst": {
                "Enabled": True,
                "BurstIntensityPercent": 250.0,
                "BurstFrequencyMs": 5000
            },
            "Symbols": symbol_data
        }
        
        if output_file:
            with open(output_file, 'w') as f:
                json.dump(config, f, indent=2)
            print(f"✓ Config saved to: {output_file}")
        
        return config

def main():
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python simple_yahoo_scraper.py SYMBOL1 SYMBOL2 [--output config.json]")
        sys.exit(1)
    
    symbols = []
    output_file = None
    
    i = 1
    while i < len(sys.argv):
        if sys.argv[i] == '--output' and i + 1 < len(sys.argv):
            output_file = sys.argv[i + 1]
            i += 2
        else:
            symbols.append(sys.argv[i])
            i += 1
    
    scraper = SimpleYahooScraper()
    config = scraper.create_config(symbols, output_file=output_file)
    
    if config and not output_file:
        print(json.dumps(config, indent=2))

if __name__ == "__main__":
    main()
