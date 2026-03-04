/**
 * Trading Duration Service
 *
 * Main orchestration service that coordinates between product configuration,
 * duration calculations, and UI updates. This is the primary interface for
 * implementing duration-first trading scenarios.
 *
 * @author Beacon Financial Technologies
 * @version 1.0.0
 */

import { ProductConfigService } from './ProductConfigService.js';
import {
    calculateMessagesFromDuration,
    calculateFileSize,
    calculateGenerationTime,
    formatDurationDisplay
} from '../utils/durationCalculator.js';
import { updateAllStatusDisplays } from '../utils/domUpdater.js';

export class TradingDurationService {
    constructor() {
        this.productService = new ProductConfigService();
        this.isInitialized = false;
    }

    /**
     * Initialize the service by loading product configuration
     * @param {string} configPath - Optional custom config path
     * @returns {Promise<void>}
     */
    async initialize(configPath) {
        await this.productService.loadConfig(configPath);
        this.isInitialized = true;
    }

    /**
     * Calculate and update all UI elements based on symbols and duration
     * @param {string[]} symbols - Array of trading symbols
     * @param {number} durationMinutes - Trading time in minutes
     * @returns {Promise<Object>} Complete calculation results
     */
    async updateTradingScenario(symbols, durationMinutes) {
        if (!this.isInitialized) {
            throw new Error('Service not initialized. Call initialize() first.');
        }

        // Get tick rates for all symbols
        const tickRates = symbols.map(symbol =>
            this.productService.getTicksPerSecond(symbol)
        );

        // Calculate all metrics
        const messageCalc = calculateMessagesFromDuration(tickRates, durationMinutes);
        const fileSizeCalc = calculateFileSize(messageCalc.totalMessages);
        const genTimeCalc = calculateGenerationTime(messageCalc.totalMessages);
        const durationFormatted = formatDurationDisplay(durationMinutes);

        // Update UI
        const updateResults = updateAllStatusDisplays({
            fileSize: fileSizeCalc.formatted,
            duration: durationFormatted,
            generationTime: genTimeCalc.formatted
        });

        // Return complete results
        return {
            symbols,
            durationMinutes,
            messages: messageCalc,
            fileSize: fileSizeCalc,
            generationTime: genTimeCalc,
            uiUpdated: updateResults
        };
    }

    /**
     * Add a new symbol and recalculate scenario
     * @param {string} newSymbol - Symbol to add
     * @param {string[]} existingSymbols - Current symbols
     * @param {number} currentDuration - Current duration in minutes
     * @returns {Promise<Object>} Updated calculation results
     */
    async addSymbol(newSymbol, existingSymbols, currentDuration) {
        if (!this.isInitialized) {
            throw new Error('Service not initialized. Call initialize() first.');
        }

        // Get classification info for logging
        const config = this.productService.getSymbolConfig(newSymbol);

        if (config.isClassified) {
            console.log(`Auto-classified ${newSymbol} as ${config.assetClass} (${config.ticksPerSecond} ticks/sec)`);
        }

        // Update scenario with new symbol list
        const updatedSymbols = [...existingSymbols, newSymbol];
        return await this.updateTradingScenario(updatedSymbols, currentDuration);
    }

    /**
     * Remove a symbol and recalculate scenario
     * @param {string} symbolToRemove - Symbol to remove
     * @param {string[]} existingSymbols - Current symbols
     * @param {number} currentDuration - Current duration in minutes
     * @returns {Promise<Object>} Updated calculation results
     */
    async removeSymbol(symbolToRemove, existingSymbols, currentDuration) {
        if (!this.isInitialized) {
            throw new Error('Service not initialized. Call initialize() first.');
        }

        const updatedSymbols = existingSymbols.filter(symbol =>
            symbol.toUpperCase() !== symbolToRemove.toUpperCase()
        );

        return await this.updateTradingScenario(updatedSymbols, currentDuration);
    }

    /**
     * Get detailed information about symbols in current scenario
     * @param {string[]} symbols - Symbols to analyze
     * @returns {Object[]} Detailed symbol information
     */
    getSymbolDetails(symbols) {
        if (!this.isInitialized) {
            throw new Error('Service not initialized. Call initialize() first.');
        }

        return symbols.map(symbol => {
            const config = this.productService.getSymbolConfig(symbol);
            return {
                symbol: symbol.toUpperCase(),
                ticksPerSecond: this.productService.getTicksPerSecond(symbol),
                assetClass: config.assetClass,
                exchange: config.exchange,
                description: config.description || '',
                isClassified: config.isClassified || false
            };
        });
    }

    /**
     * Validate a trading scenario for feasibility
     * @param {string[]} symbols - Symbols to validate
     * @param {number} durationMinutes - Duration to validate
     * @returns {Object} Validation results
     */
    validateScenario(symbols, durationMinutes) {
        const warnings = [];
        const errors = [];

        // Check symbol count
        if (symbols.length === 0) {
            errors.push('At least one symbol is required');
        }

        // Check duration
        if (durationMinutes <= 0) {
            errors.push('Duration must be greater than 0 minutes');
        } else if (durationMinutes > 1440) { // 24 hours
            warnings.push('Duration exceeds 24 hours - very large dataset');
        }

        // Check for unknown symbols
        const unknownSymbols = symbols.filter(symbol => {
            const config = this.productService.getSymbolConfig(symbol);
            return config.isClassified;
        });

        if (unknownSymbols.length > 0) {
            warnings.push(`Auto-classified symbols: ${unknownSymbols.join(', ')}`);
        }

        return {
            isValid: errors.length === 0,
            warnings,
            errors
        };
    }

    /**
     * Get available exchanges from configuration
     * @returns {string[]} Available exchanges
     */
    getAvailableExchanges() {
        return this.productService.getExchanges();
    }

    /**
     * Add a new product configuration
     * @param {string} symbol - Symbol to add
     * @param {Object} config - Product configuration
     * @returns {void}
     */
    addProduct(symbol, config) {
        this.productService.updateSymbol(symbol, config);
    }
}

// Example Usage:
/*
import { TradingDurationService } from './services/TradingDurationService.js';

const tradingService = new TradingDurationService();
await tradingService.initialize();

// Update UI for 30 minutes of ES + AAPL trading
const result = await tradingService.updateTradingScenario(['ES', 'AAPL'], 30);

// Add a new symbol
await tradingService.addSymbol('TSLA', ['ES', 'AAPL'], 30);

// Get detailed symbol information
const symbolDetails = tradingService.getSymbolDetails(['ES', 'AAPL', 'TSLA']);

// Validate a scenario
const validation = tradingService.validateScenario(['ES', 'UNKNOWN_SYMBOL'], 60);
*/
