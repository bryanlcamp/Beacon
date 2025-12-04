import yfinance as yf
import json
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Optional

class YahooFinanceScraper:
    def __init__(self):
        self.session = None
    
    def get_symbol_data(self, symbol: str, period: str = "1d") -> Optional[Dict]:
        """
        Get OHLCV data for a single symbol
        
        Args:
            symbol: Stock symbol (e.g., 'AAPL', 'MSFT')
            period: Time period ('1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max')
        
        Returns:
            Dict with OHLCV data or None if failed
        """
        try:
            ticker = yf.Ticker(symbol)
            
            # Get historical data
            hist = ticker.history(period=period)
            
            if hist.empty:
                print(f"No data found for symbol: {symbol}")
                return None
            
            # Get the most recent trading day
            latest = hist.iloc[-1]
            
            # Get previous day for comparison if available
            prev_day = hist.iloc[-2] if len(hist) > 1 else latest
            
            # Format the data to match your C++ config structure
            symbol_data = {
                "SymbolName": symbol.upper(),
                "PercentTotalMessages": 30,  # Default, can be adjusted
                "TradeProbability": 0.15,    # Default, can be adjusted
                "SpreadPercentage": 0.5,     # Default, can be adjusted
                "PriceRange": {
                    "MinPrice": round(float(latest['Low'] * 0.95), 2),    # 5% below low
                    "MaxPrice": round(float(latest['High'] * 1.05), 2),   # 5% above high
                    "Weight": 1.0
                },
                "QuantityRange": {
                    "MinQuantity": 10,
                    "MaxQuantity": 100,
                    "Weight": 1.0
                },
                "PrevDay": {
                    "OpenPrice": round(float(prev_day['Open']), 2),
                    "HighPrice": round(float(prev_day['High']), 2),
                    "LowPrice": round(float(prev_day['Low']), 2),
                    "ClosePrice": round(float(prev_day['Close']), 2),
                    "Volume": int(prev_day['Volume'])
                }
            }
            
            print(f"✓ Retrieved data for {symbol}: ${latest['Close']:.2f} (Volume: {latest['Volume']:,})")
            return symbol_data
            
        except Exception as e:
            print(f"✗ Error retrieving data for {symbol}: {str(e)}")
            return None
    
    def get_multiple_symbols(self, symbols: List[str], period: str = "1d") -> List[Dict]:
        """
        Get OHLCV data for multiple symbols
        
        Args:
            symbols: List of stock symbols
            period: Time period for data retrieval
        
        Returns:
            List of symbol data dictionaries
        """
        results = []
        
        print(f"Fetching data for {len(symbols)} symbols...")
        
        for symbol in symbols:
            data = self.get_symbol_data(symbol, period)
            if data:
                results.append(data)
        
        return results
    
    def create_beacon_config(self, symbols: List[str], num_messages: int = 10000, 
                           exchange: str = "nsdq", output_file: str = None) -> Dict:
        """
        Create a complete Beacon config file with Yahoo Finance data
        
        Args:
            symbols: List of stock symbols
            num_messages: Total number of messages to generate
            exchange: Exchange identifier
            output_file: Optional output file path
        
        Returns:
            Complete config dictionary
        """
        
        # Get data for all symbols
        symbol_data = self.get_multiple_symbols(symbols)
        
        if not symbol_data:
            print("No symbol data retrieved!")
            return None
        
        # Calculate message distribution
        total_symbols = len(symbol_data)
        base_percent = 100 // total_symbols
        remainder = 100 % total_symbols
        
        for i, symbol in enumerate(symbol_data):
            # Distribute percentages, giving remainder to first symbols
            percent = base_percent + (1 if i < remainder else 0)
            symbol["PercentTotalMessages"] = percent
        
        # Create complete config structure matching your format
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
        
        # Save to file if specified
        if output_file:
            try:
                with open(output_file, 'w') as f:
                    json.dump(config, f, indent=2)
                print(f"✓ Config saved to: {output_file}")
            except Exception as e:
                print(f"✗ Error saving config: {str(e)}")
        
        return config

def main():
    """
    Command line interface for the scraper
    
    Usage examples:
        python yahoo_finance_scraper.py AAPL MSFT GOOG
        python yahoo_finance_scraper.py --output config.json --messages 50000 AAPL MSFT
    """
    
    # Parse command line arguments
    import argparse
    
    parser = argparse.ArgumentParser(description='Scrape Yahoo Finance OHLCV data for Beacon config')
    parser.add_argument('symbols', nargs='+', help='Stock symbols to fetch (e.g., AAPL MSFT GOOG)')
    parser.add_argument('--output', '-o', help='Output JSON file path')
    parser.add_argument('--messages', '-m', type=int, default=10000, help='Number of messages to generate')
    parser.add_argument('--exchange', '-e', default='nsdq', help='Exchange identifier')
    parser.add_argument('--period', '-p', default='1d', help='Data period (1d, 5d, 1mo, etc.)')
    
    args = parser.parse_args()
    
    # Create scraper and fetch data
    scraper = YahooFinanceScraper()
    
    print(f"Yahoo Finance Scraper for Beacon Dataset Generator")
    print(f"=" * 50)
    
    config = scraper.create_beacon_config(
        symbols=args.symbols,
        num_messages=args.messages,
        exchange=args.exchange,
        output_file=args.output
    )
    
    if config:
        print(f"\n✓ Generated config for {len(config['Symbols'])} symbols")
        print(f"Total messages: {config['Global']['NumMessages']:,}")
        
        if not args.output:
            # Print to stdout if no output file specified
            print("\nGenerated Config:")
            print(json.dumps(config, indent=2))
    else:
        print("✗ Failed to generate config")
        sys.exit(1)

if __name__ == "__main__":
    main()
