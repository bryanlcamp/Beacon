/**
 * ProductConfigService - Modern ES6 service for managing trading product configurations
 *
 * Handles loading, parsing, and accessing product tick rate configurations with
 * auto-classification for unknown symbols.
 *
 * @author Beacon Financial Technologies
 * @version 1.0.0
 */

export class ProductConfigService {
    constructor() {
        this.config = null;
    }

    /**
     * Load the products configuration from JSON file
     * @param {string} configPath - Path to products.json configuration file
     * @returns {Promise<Object>} The loaded configuration object
     * @throws {Error} If configuration loading fails completely
     */
    async loadConfig(configPath = '/src/config/products.json') {
        try {
            const response = await fetch(configPath);
            this.config = await response.json();
            return this.config;
        } catch (error) {
            console.error('Failed to load product config:', error);
            // Fallback to minimal config
            this.config = this.getDefaultConfig();
            return this.config;
        }
    }

    /**
     * Get ticks per second for a specific symbol
     * @param {string} symbol - Trading symbol (e.g., 'ES', 'AAPL')
     * @returns {number} Ticks per second for the symbol
     * @throws {Error} If config not loaded
     */
    getTicksPerSecond(symbol) {
        if (!this.config) {
            throw new Error('Config not loaded. Call loadConfig() first.');
        }

        const symbolUpper = symbol.toUpperCase();

        // Check if symbol is explicitly defined
        if (this.config.symbols[symbolUpper]) {
            return this.config.symbols[symbolUpper].ticksPerSecond;
        }

        // Classify and use default
        const assetClass = this.classifyAsset(symbolUpper);
        return this.config.defaults[assetClass]?.ticksPerSecond || 2000;
    }

    /**
     * Get full symbol configuration with metadata
     * @param {string} symbol - Trading symbol
     * @returns {Object} Complete symbol configuration
     */
    getSymbolConfig(symbol) {
        if (!this.config) {
            throw new Error('Config not loaded. Call loadConfig() first.');
        }

        const symbolUpper = symbol.toUpperCase();

        // Return explicit config if exists
        if (this.config.symbols[symbolUpper]) {
            return {
                symbol: symbolUpper,
                ...this.config.symbols[symbolUpper]
            };
        }

        // Classify and return default config
        const assetClass = this.classifyAsset(symbolUpper);
        const defaults = this.config.defaults[assetClass] || this.config.defaults.EQUITY;

        return {
            symbol: symbolUpper,
            assetClass: assetClass,
            ...defaults,
            isClassified: true // Flag to indicate this was auto-classified
        };
    }

    /**
     * Classify asset based on symbol patterns
     * @param {string} symbol - Symbol to classify
     * @returns {string} Asset class ('FUTURES', 'EQUITY', etc.)
     */
    classifyAsset(symbol) {
        if (!this.config?.assetClassification?.patterns) {
            return 'EQUITY'; // Default fallback
        }

        const patterns = this.config.assetClassification.patterns;

        for (const [assetClass, rules] of Object.entries(patterns)) {
            if (rules.default) continue; // Skip default class for now

            // Check exact matches
            if (rules.exact?.includes(symbol)) {
                return assetClass;
            }

            // Check regex patterns
            if (rules.regex) {
                for (const pattern of rules.regex) {
                    if (new RegExp(pattern).test(symbol)) {
                        return assetClass;
                    }
                }
            }

            // Check contains patterns
            if (rules.contains?.some(term => symbol.includes(term))) {
                return assetClass;
            }

            // Check suffix patterns
            if (rules.suffix?.some(suffix => symbol.endsWith(suffix))) {
                return assetClass;
            }
        }

        // Return default asset class
        const defaultClass = Object.entries(patterns).find(([_, rules]) => rules.default);
        return defaultClass ? defaultClass[0] : 'EQUITY';
    }

    /**
     * Add or update a symbol configuration
     * @param {string} symbol - Symbol to update
     * @param {Object} config - Configuration object
     */
    updateSymbol(symbol, config) {
        if (!this.config) {
            throw new Error('Config not loaded. Call loadConfig() first.');
        }

        this.config.symbols[symbol.toUpperCase()] = {
            ...config,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Get available exchanges from configuration
     * @returns {string[]} Sorted array of exchange names
     */
    getExchanges() {
        if (!this.config) return [];

        const exchanges = new Set();

        // From explicit symbols
        Object.values(this.config.symbols).forEach(symbol => {
            if (symbol.exchange) exchanges.add(symbol.exchange);
        });

        // From defaults
        Object.values(this.config.defaults).forEach(defaultConfig => {
            if (defaultConfig.exchange) exchanges.add(defaultConfig.exchange);
        });

        return Array.from(exchanges).sort();
    }

    /**
     * Fallback config if file loading fails
     * @returns {Object} Minimal working configuration
     */
    getDefaultConfig() {
        return {
            symbols: {
                'ES': { assetClass: 'FUTURES', ticksPerSecond: 5000, exchange: 'CME' },
                'AAPL': { assetClass: 'EQUITY', ticksPerSecond: 2000, exchange: 'NASDAQ' }
            },
            defaults: {
                'FUTURES': { ticksPerSecond: 5000, exchange: 'CME' },
                'EQUITY': { ticksPerSecond: 2000, exchange: 'NYSE' }
            },
            assetClassification: {
                patterns: {
                    'EQUITY': { default: true }
                }
            }
        };
    }
}

// Example Usage:
/*
import { ProductConfigService } from './services/ProductConfigService.js';

const productService = new ProductConfigService();
await productService.loadConfig();

const esTicksPerSecond = productService.getTicksPerSecond('ES');        // 8000
const aaplTicksPerSecond = productService.getTicksPerSecond('AAPL');    // 2500
const unknownTicksPerSecond = productService.getTicksPerSecond('XYZ');  // 2000 (classified as EQUITY)

const esConfig = productService.getSymbolConfig('ES');
// Returns: { symbol: 'ES', assetClass: 'FUTURES', ticksPerSecond: 8000, exchange: 'CME', description: '...' }
*/
