/**
 * Market Simulation Parameters for Beacon Dataset Generator
 * Professional-grade trading simulation without proprietary market data
 * Focus: Realistic microstructure, spreads, and algorithmic trading scenarios
 */

let MARKET_DATA = {};
let MARKET_CATEGORIES = {};
let MARKET_METADATA = {};

// Load market simulation parameters from JSON file
async function loadMarketData() {
    try {
        const response = await fetch('./market_symbols.json');
        const data = await response.json();
        
        MARKET_DATA = data.symbols;
        MARKET_CATEGORIES = data.categories;
        MARKET_METADATA = data.metadata;
        
        console.log(`🎯 Loaded ${MARKET_METADATA.totalSymbols} trading simulation profiles (v${MARKET_METADATA.version})`);
        console.log('📊 Ready for professional-grade market microstructure simulation');
        return true;
    } catch (error) {
        console.error('❌ Failed to load simulation parameters:', error);
        // Fallback to embedded basic simulation profiles
        loadFallbackData();
        return false;
    }
}

// Fallback simulation profiles if JSON fails to load
function loadFallbackData() {
    console.log('📦 Using embedded simulation profiles');
    MARKET_DATA = {
        'AAPL': {
            name: 'Apple Inc.',
            sector: 'Technology',
            // Simulation parameters (NOT real market data)
            simulationProfile: {
                basePrice: 190.00,        // Base price for simulation
                volatilityFactor: 0.02,   // 2% daily volatility simulation
                avgDailyVolume: 50000000  // Volume simulation parameter
            },
            priceRange: { min: 185.00, max: 200.00 },
            quantityRange: { min: 100, max: 2000 },
            spreadPercent: 0.02,  // Realistic bid-ask spread simulation
            tradeProbability: 0.30,
            liquidityProfile: 'ultra-high',
            category: "mega-cap-tech"
        },
        'MSFT': {
            name: 'Microsoft Corporation',
            sector: 'Technology',
            simulationProfile: {
                basePrice: 420.00,
                volatilityFactor: 0.02,
                avgDailyVolume: 20000000
            },
            priceRange: { min: 405.00, max: 435.00 },
            quantityRange: { min: 100, max: 1500 },
            spreadPercent: 0.02,
            tradeProbability: 0.28,
            liquidityProfile: 'ultra-high',
            category: "mega-cap-tech"
        },
        'SPY': {
            name: 'SPDR S&P 500 ETF',
            sector: 'ETF',
            simulationProfile: {
                basePrice: 460.00,
                volatilityFactor: 0.01,
                avgDailyVolume: 60000000
            },
            priceRange: { min: 450.00, max: 470.00 },
            quantityRange: { min: 100, max: 3000 },
            spreadPercent: 0.01,  // Tightest spread for simulation
            tradeProbability: 0.25,
            liquidityProfile: 'ultra-high',
            category: "major-etf"
        },
        'NVDA': {
            name: 'NVIDIA Corporation',
            sector: 'Technology',
            simulationProfile: {
                basePrice: 890.00,
                volatilityFactor: 0.04,
                avgDailyVolume: 45000000
            },
            priceRange: { min: 860.00, max: 920.00 },
            quantityRange: { min: 25, max: 500 },
            spreadPercent: 0.04,
            tradeProbability: 0.35,
            liquidityProfile: 'high',
            category: "mega-cap-tech"
        },
        'TSLA': {
            name: 'Tesla Inc.',
            sector: 'Consumer Discretionary',
            simulationProfile: {
                basePrice: 250.00,
                volatilityFactor: 0.06,
                avgDailyVolume: 75000000
            },
            priceRange: { min: 230.00, max: 270.00 },
            quantityRange: { min: 50, max: 1000 },
            spreadPercent: 0.06,
            tradeProbability: 0.40,
            liquidityProfile: 'high',
            category: "high-volatility"
        }
    };
}

// Enhanced utility functions for simulation
const MarketDataUtils = {
    /**
     * Initialize market simulation parameters (call this first)
     */
    init: async function() {
        return await loadMarketData();
    },

    /**
     * Get trading simulation profile by ticker
     */
    getSymbol: function(ticker) {
        return MARKET_DATA[ticker.toUpperCase()];
    },
    
    /**
     * Get all available simulation symbols
     */
    getAllSymbols: function() {
        return Object.keys(MARKET_DATA);
    },
    
    /**
     * Get symbols by trading characteristics
     */
    getSymbolsBySector: function(sector) {
        return Object.entries(MARKET_DATA).filter(([ticker, data]) => 
            data.sector === sector
        );
    },

    /**
     * Get symbols by simulation category
     */
    getSymbolsByCategory: function(category) {
        return Object.entries(MARKET_DATA).filter(([ticker, data]) => 
            data.category === category
        );
    },

    /**
     * Get symbols by liquidity profile for simulation
     */
    getSymbolsByLiquidity: function(liquidityLevel) {
        return Object.entries(MARKET_DATA).filter(([ticker, data]) => 
            data.liquidityProfile === liquidityLevel
        );
    },
    
    /**
     * Get sector summary for simulation planning
     */
    getSectorSummary: function() {
        const sectors = {};
        Object.values(MARKET_DATA).forEach(data => {
            sectors[data.sector] = (sectors[data.sector] || 0) + 1;
        });
        return sectors;
    },

    /**
     * Get category summary for algorithm testing
     */
    getCategorySummary: function() {
        const categories = {};
        Object.values(MARKET_DATA).forEach(data => {
            categories[data.category] = (categories[data.category] || 0) + 1;
        });
        return categories;
    },
    
    /**
     * Search simulation profiles by name or ticker
     */
    searchSymbols: function(query) {
        const searchTerm = query.toLowerCase();
        return Object.entries(MARKET_DATA).filter(([ticker, data]) => 
            ticker.toLowerCase().includes(searchTerm) || 
            data.name.toLowerCase().includes(searchTerm)
        );
    },
    
    /**
     * Get recommended symbols for HFT algorithm testing
     * (High simulated volume, tight spreads, good for latency testing)
     */
    getHFTRecommended: function() {
        return Object.entries(MARKET_DATA).filter(([, data]) => 
            data.simulationProfile?.avgDailyVolume >= 15000000 && 
            data.spreadPercent <= 0.03
        );
    },

    /**
     * Get high-volatility symbols for stress testing
     */
    getVolatilityTestSymbols: function() {
        return Object.entries(MARKET_DATA).filter(([, data]) => 
            data.tradeProbability >= 0.30 || data.spreadPercent >= 0.05
        );
    },

    /**
     * Get simulation metadata
     */
    getMetadata: function() {
        return MARKET_METADATA;
    },

    /**
     * Get category descriptions for simulation planning
     */
    getCategories: function() {
        return MARKET_CATEGORIES;
    },

    /**
     * Generate realistic price movement for simulation
     */
    generatePriceMovement: function(symbol, timeframeMinutes = 1) {
        const profile = this.getSymbol(symbol);
        if (!profile?.simulationProfile) return null;
        
        const { basePrice, volatilityFactor } = profile.simulationProfile;
        const randomWalk = (Math.random() - 0.5) * 2 * volatilityFactor * Math.sqrt(timeframeMinutes / 60);
        
        return {
            basePrice,
            simulatedMove: randomWalk,
            newPrice: basePrice * (1 + randomWalk),
            confidence: 'simulation-only'
        };
    }
};

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MarketDataUtils, loadMarketData };
} else if (typeof window !== 'undefined') {
    window.MarketDataUtils = MarketDataUtils;
    window.loadMarketData = loadMarketData;
}
