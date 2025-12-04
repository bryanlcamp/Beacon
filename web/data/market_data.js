/**
 * BEACON MARKET DATA CONFIGURATION
 * External symbol definitions - edit this file to add/remove/modify symbols
 * Used by Dataset Generator and other Beacon applications
 */

window.MARKET_DATA = {
    // Major Tech Stocks
    'AAPL': {
        name: 'Apple Inc.',
        sector: 'Technology',
        simulationProfile: { basePrice: 190.00, volatilityFactor: 0.02, avgDailyVolume: 50000000 },
        priceRange: { min: 185.00, max: 200.00 },
        quantityRange: { min: 100, max: 2000 },
        spreadPercent: 0.02,
        category: "mega-cap-tech"
    },
    'MSFT': {
        name: 'Microsoft Corporation',
        sector: 'Technology', 
        simulationProfile: { basePrice: 420.00, volatilityFactor: 0.02, avgDailyVolume: 20000000 },
        priceRange: { min: 405.00, max: 435.00 },
        quantityRange: { min: 100, max: 1500 },
        spreadPercent: 0.02,
        category: "mega-cap-tech"
    },
    'NVDA': {
        name: 'NVIDIA Corporation',
        sector: 'Technology',
        simulationProfile: { basePrice: 890.00, volatilityFactor: 0.04, avgDailyVolume: 45000000 },
        priceRange: { min: 860.00, max: 920.00 },
        quantityRange: { min: 25, max: 500 },
        spreadPercent: 0.04,
        category: "mega-cap-tech"
    },
    'AMZN': {
        name: 'Amazon.com Inc.',
        sector: 'Consumer Discretionary',
        simulationProfile: { basePrice: 155.00, volatilityFactor: 0.03, avgDailyVolume: 35000000 },
        priceRange: { min: 150.00, max: 165.00 },
        quantityRange: { min: 50, max: 800 },
        spreadPercent: 0.03,
        category: "mega-cap-tech"
    },
    'GOOG': {
        name: 'Alphabet Inc.',
        sector: 'Technology',
        simulationProfile: { basePrice: 175.00, volatilityFactor: 0.025, avgDailyVolume: 25000000 },
        priceRange: { min: 170.00, max: 185.00 },
        quantityRange: { min: 100, max: 1000 },
        spreadPercent: 0.025,
        category: "mega-cap-tech"
    },

    // High Volatility Stocks  
    'TSLA': {
        name: 'Tesla Inc.',
        sector: 'Consumer Discretionary',
        simulationProfile: { basePrice: 250.00, volatilityFactor: 0.06, avgDailyVolume: 75000000 },
        priceRange: { min: 230.00, max: 270.00 },
        quantityRange: { min: 50, max: 1000 },
        spreadPercent: 0.06,
        category: "high-volatility"
    },

    // Major ETFs
    'SPY': {
        name: 'SPDR S&P 500 ETF',
        sector: 'ETF',
        simulationProfile: { basePrice: 460.00, volatilityFactor: 0.01, avgDailyVolume: 60000000 },
        priceRange: { min: 450.00, max: 470.00 },
        quantityRange: { min: 100, max: 3000 },
        spreadPercent: 0.01,
        category: "major-etf"
    },
    'QQQ': {
        name: 'Invesco QQQ Trust',
        sector: 'ETF', 
        simulationProfile: { basePrice: 386.00, volatilityFactor: 0.01, avgDailyVolume: 40000000 },
        priceRange: { min: 375.00, max: 395.00 },
        quantityRange: { min: 100, max: 2500 },
        spreadPercent: 0.01,
        category: "major-etf"
    }
};

// Market Data Utility Functions
window.MarketDataUtils = {
    getSymbol: function(ticker) {
        const symbol = ticker.toUpperCase();
        const result = window.MARKET_DATA[symbol];
        if (result) {
            console.log(`✅ Found market data for ${symbol}`);
            return result;
        } else {
            console.log(`❌ No market data found for ${symbol}. Available: ${Object.keys(window.MARKET_DATA).join(', ')}`);
            return null;
        }
    },
    
    getAllSymbols: function() {
        return Object.keys(window.MARKET_DATA);
    },
    
    getSymbolsByCategory: function(category) {
        return Object.keys(window.MARKET_DATA).filter(symbol => 
            window.MARKET_DATA[symbol].category === category
        );
    }
};

console.log(`📊 Loaded ${Object.keys(window.MARKET_DATA).length} symbols from external market data file`);
