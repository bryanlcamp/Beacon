/**
 * Market Data Utilities
 * Provides realistic market data for common trading symbols
 */

window.MarketDataUtils = {
    // Sample market data for common symbols
    symbolData: {
        'AAPL': {
            priceRange: { min: 150, max: 200 },
            quantityRange: { min: 100, max: 2000 },
            spreadPercent: 0.02,
            volume: 85
        },
        'GOOGL': {
            priceRange: { min: 2800, max: 3200 },
            quantityRange: { min: 50, max: 500 },
            spreadPercent: 0.03,
            volume: 45
        },
        'MSFT': {
            priceRange: { min: 300, max: 400 },
            quantityRange: { min: 100, max: 1500 },
            spreadPercent: 0.02,
            volume: 65
        },
        'TSLA': {
            priceRange: { min: 200, max: 300 },
            quantityRange: { min: 100, max: 1000 },
            spreadPercent: 0.05,
            volume: 120
        },
        'NVDA': {
            priceRange: { min: 400, max: 800 },
            quantityRange: { min: 50, max: 800 },
            spreadPercent: 0.04,
            volume: 95
        },
        'META': {
            priceRange: { min: 250, max: 350 },
            quantityRange: { min: 100, max: 1200 },
            spreadPercent: 0.03,
            volume: 75
        },
        'AMZN': {
            priceRange: { min: 120, max: 180 },
            quantityRange: { min: 100, max: 1800 },
            spreadPercent: 0.02,
            volume: 55
        }
    },

    /**
     * Get market data for a symbol
     * @param {string} symbol - Trading symbol (e.g., 'AAPL')
     * @returns {object|null} Market data object or null if not found
     */
    getSymbol(symbol) {
        const upperSymbol = symbol.toUpperCase();
        return this.symbolData[upperSymbol] || null;
    },

    /**
     * Get all available symbols
     * @returns {string[]} Array of symbol names
     */
    getAllSymbols() {
        return Object.keys(this.symbolData);
    },

    /**
     * Add or update symbol data
     * @param {string} symbol - Trading symbol
     * @param {object} data - Market data object
     */
    addSymbol(symbol, data) {
        this.symbolData[symbol.toUpperCase()] = data;
    },

    /**
     * Generate realistic market data for unknown symbols
     * @param {string} symbol - Trading symbol
     * @returns {object} Generated market data
     */
    generateMarketData(symbol) {
        // Generate pseudo-random but consistent data based on symbol
        const hash = this.simpleHash(symbol);
        const basePrice = 50 + (hash % 500); // Price between $50-$550
        
        return {
            priceRange: {
                min: Math.max(1, basePrice - (basePrice * 0.2)),
                max: basePrice + (basePrice * 0.2)
            },
            quantityRange: {
                min: 50 + (hash % 100),
                max: 500 + (hash % 1500)
            },
            spreadPercent: 0.01 + (hash % 5) / 100, // 0.01% to 0.05%
            volume: 10 + (hash % 100) // 10M to 110M
        };
    },

    /**
     * Simple hash function for consistent pseudo-random generation
     * @param {string} str - Input string
     * @returns {number} Hash value
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
};

console.log('✅ Market Data Utils loaded');
