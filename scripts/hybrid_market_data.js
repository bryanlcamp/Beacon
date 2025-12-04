/**
 * Hybrid Market Data Provider for Beacon Dataset Generator
 * Safe integration - falls back gracefully if anything fails
 */

class HybridMarketDataProvider {
    constructor() {
        this.yahooBaseUrl = "https://query1.finance.yahoo.com/v8/finance/chart";
        this.requestTimeout = 2000; // Short timeout to avoid hanging
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Safe symbol lookup with fallback
     */
    async getSymbolData(symbol) {
        const ticker = symbol.toUpperCase();
        
        try {
            // Check cache first
            const cached = this.getCachedData(ticker);
            if (cached) {
                return cached;
            }

            // Try Yahoo Finance with short timeout
            const liveData = await this.fetchFromYahoo(ticker);
            if (liveData) {
                this.setCachedData(ticker, liveData);
                return liveData;
            }
        } catch (error) {
            // Silently fall back - don't log errors that might confuse users
        }

        // Always fall back to bundled data or null
        return this.getFallbackData(ticker);
    }

    async fetchFromYahoo(ticker) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

        try {
            const url = `${this.yahooBaseUrl}/${ticker}`;
            const response = await fetch(`${url}?interval=1d&range=2d`, {
                signal: controller.signal,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            clearTimeout(timeoutId);
            if (!response.ok) throw new Error('HTTP error');

            const data = await response.json();
            if (!data?.chart?.result?.[0]) throw new Error('No data');

            return this.transformYahooData(ticker, data.chart.result[0]);
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    transformYahooData(ticker, yahooResult) {
        const quotes = yahooResult.indicators?.quote?.[0];
        if (!quotes?.close?.length) throw new Error('No quotes');

        const latest = quotes.close.length - 1;
        const prev = latest > 0 ? latest - 1 : latest;
        
        const close = quotes.close[prev] || 100;
        const high = quotes.high[prev] || close * 1.02;
        const low = quotes.low[prev] || close * 0.98;
        const open = quotes.open[prev] || close;
        const volume = quotes.volume[prev] || 1000000;

        // Get fallback for defaults
        const fallback = typeof MarketDataUtils !== 'undefined' ? MarketDataUtils.getSymbol(ticker) : null;

        return {
            symbol: ticker,
            priceRange: {
                min: Math.round(low * 0.95 * 100) / 100,
                max: Math.round(high * 1.05 * 100) / 100
            },
            quantityRange: fallback?.quantityRange || { min: 100, max: 1000 },
            spreadPercent: fallback?.spreadPercent || 0.5,
            volume: Math.round(volume / 1000000),
            prevDay: { open, high, low, close, volume }
        };
    }

    getFallbackData(ticker) {
        if (typeof MarketDataUtils === 'undefined') return null;
        
        const bundled = MarketDataUtils.getSymbol(ticker);
        if (!bundled) return null;

        return {
            symbol: ticker,
            priceRange: bundled.priceRange,
            quantityRange: bundled.quantityRange,
            spreadPercent: bundled.spreadPercent,
            volume: Math.round(bundled.prevDay.volume / 1000000),
            prevDay: bundled.prevDay
        };
    }

    getCachedData(ticker) {
        const cached = this.cache.get(ticker);
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            return cached.data;
        }
        return null;
    }

    setCachedData(ticker, data) {
        this.cache.set(ticker, { data, timestamp: Date.now() });
    }
}

// Safe global assignment
if (typeof window !== 'undefined') {
    window.HybridMarketDataProvider = HybridMarketDataProvider;
}
