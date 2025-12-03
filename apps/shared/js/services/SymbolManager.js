/**
 * @fileoverview Professional Symbol Management Service
 * Handles symbol CRUD operations with validation and state management
 * Architecture matches the sophistication of your C++ backend
 */

import { EventEmitter } from '../core/EventEmitter.js';
import { validationService } from './ValidationService.js';

/**
 * Professional Symbol Manager Service
 * Provides complete symbol lifecycle management with validation and persistence
 */
export class SymbolManager extends EventEmitter {
    constructor() {
        super();
        
        /** @type {Map<string, import('../types/ApplicationTypes.js').SymbolConfig>} */
        this.symbols = new Map();
        
        /** @type {Object} */
        this.config = {
            maxSymbols: 50,
            autoSave: true,
            validateOnChange: true,
            storageKey: 'beacon_symbols'
        };
        
        /** @type {boolean} */
        this.isInitialized = false;
        
        // Set up auto-save if enabled
        if (this.config.autoSave) {
            this.on('symbolsChanged', this.autoSave.bind(this));
        }
    }

    /**
     * Initialize the symbol manager
     * @returns {Promise<void>}
     */
    async init() {
        if (this.isInitialized) {
            return;
        }

        try {
            // Load existing symbols from storage
            await this.loadFromStorage();
            
            this.isInitialized = true;
            this.emit('initialized');
            
            console.log(`✅ SymbolManager initialized with ${this.symbols.size} symbols`);
            
        } catch (error) {
            console.error('❌ Failed to initialize SymbolManager:', error);
            throw error;
        }
    }

    /**
     * Add a new symbol with comprehensive validation
     * @param {string} symbolName - Symbol name (e.g., "AAPL")
     * @param {Partial<import('../types/ApplicationTypes.js').SymbolConfig>} [config={}] - Symbol configuration
     * @returns {Promise<import('../types/ApplicationTypes.js').SymbolConfig>}
     */
    async addSymbol(symbolName, config = {}) {
        // Validate symbol name
        const symbolValidation = validationService.validate('symbol', symbolName);
        if (!symbolValidation.isValid) {
            throw new SymbolValidationError(symbolValidation.errors);
        }
        
        const cleanSymbol = symbolValidation.sanitized;
        
        // Check for duplicates
        if (this.symbols.has(cleanSymbol)) {
            throw new SymbolAlreadyExistsError(cleanSymbol);
        }
        
        // Check symbol limit
        if (this.symbols.size >= this.config.maxSymbols) {
            throw new SymbolLimitExceededError(this.config.maxSymbols);
        }

        // Create symbol configuration with professional defaults
        const symbolConfig = this.createSymbolConfig(cleanSymbol, config);
        
        // Validate complete configuration
        if (this.config.validateOnChange) {
            const validation = validationService.validateSymbolConfig(symbolConfig);
            if (!validation.isValid) {
                throw new SymbolValidationError(validation.errors);
            }
        }

        // Add to collection
        this.symbols.set(cleanSymbol, symbolConfig);
        
        // Emit events for reactive updates
        this.emit('symbolAdded', {
            symbol: cleanSymbol,
            config: symbolConfig,
            totalCount: this.symbols.size
        });
        
        this.emit('symbolsChanged', {
            action: 'add',
            symbol: cleanSymbol,
            symbols: this.getAllSymbols()
        });
        
        console.log(`📊 Added symbol: ${cleanSymbol} (${this.symbols.size}/${this.config.maxSymbols})`);
        
        return symbolConfig;
    }

    /**
     * Update an existing symbol
     * @param {string} symbolName - Symbol to update
     * @param {Partial<import('../types/ApplicationTypes.js').SymbolConfig>} updates - Configuration updates
     * @returns {Promise<import('../types/ApplicationTypes.js').SymbolConfig>}
     */
    async updateSymbol(symbolName, updates) {
        if (!this.symbols.has(symbolName)) {
            throw new SymbolNotFoundError(symbolName);
        }

        const currentConfig = this.symbols.get(symbolName);
        const updatedConfig = {
            ...currentConfig,
            ...updates,
            symbol: symbolName, // Prevent symbol name changes
            lastModified: Date.now()
        };

        // Validate updated configuration
        if (this.config.validateOnChange) {
            const validation = validationService.validateSymbolConfig(updatedConfig);
            if (!validation.isValid) {
                throw new SymbolValidationError(validation.errors);
            }
            
            // Apply sanitized values if available
            if (validation.sanitized) {
                Object.assign(updatedConfig, validation.sanitized);
            }
        }

        // Update in collection
        this.symbols.set(symbolName, updatedConfig);
        
        // Emit events
        this.emit('symbolUpdated', {
            symbol: symbolName,
            previousConfig: currentConfig,
            currentConfig: updatedConfig,
            changes: updates
        });
        
        this.emit('symbolsChanged', {
            action: 'update',
            symbol: symbolName,
            symbols: this.getAllSymbols()
        });
        
        return updatedConfig;
    }

    /**
     * Remove a symbol from the portfolio
     * @param {string} symbolName - Symbol to remove
     * @returns {Promise<import('../types/ApplicationTypes.js').SymbolConfig>}
     */
    async removeSymbol(symbolName) {
        if (!this.symbols.has(symbolName)) {
            throw new SymbolNotFoundError(symbolName);
        }

        const symbolConfig = this.symbols.get(symbolName);
        this.symbols.delete(symbolName);
        
        // Emit events
        this.emit('symbolRemoved', {
            symbol: symbolName,
            config: symbolConfig,
            totalCount: this.symbols.size
        });
        
        this.emit('symbolsChanged', {
            action: 'remove',
            symbol: symbolName,
            symbols: this.getAllSymbols()
        });
        
        console.log(`🗑️ Removed symbol: ${symbolName} (${this.symbols.size} remaining)`);
        
        return symbolConfig;
    }

    /**
     * Get all symbols as array
     * @returns {import('../types/ApplicationTypes.js').SymbolConfig[]}
     */
    getAllSymbols() {
        return Array.from(this.symbols.values());
    }

    /**
     * Get symbol by name
     * @param {string} symbolName - Symbol name
     * @returns {import('../types/ApplicationTypes.js').SymbolConfig|null}
     */
    getSymbol(symbolName) {
        return this.symbols.get(symbolName) || null;
    }

    /**
     * Check if symbol exists
     * @param {string} symbolName - Symbol name
     * @returns {boolean}
     */
    hasSymbol(symbolName) {
        return this.symbols.has(symbolName);
    }

    /**
     * Get portfolio statistics
     * @returns {Object} Portfolio statistics
     */
    getPortfolioStats() {
        const symbols = this.getAllSymbols();
        
        const totalPercentage = symbols.reduce((sum, symbol) => sum + symbol.percentage, 0);
        const avgSpread = symbols.reduce((sum, symbol) => sum + symbol.spreadPercentage, 0) / symbols.length || 0;
        const avgTradeProbability = symbols.reduce((sum, symbol) => sum + symbol.tradeProbability, 0) / symbols.length || 0;
        
        return {
            symbolCount: symbols.length,
            totalPercentage: Math.round(totalPercentage * 100) / 100,
            remainingPercentage: Math.round((100 - totalPercentage) * 100) / 100,
            isComplete: Math.abs(totalPercentage - 100) < 0.01,
            averageSpread: Math.round(avgSpread * 1000) / 1000,
            averageTradeProbability: Math.round(avgTradeProbability * 1000) / 1000,
            priceRangeStats: this.calculatePriceRangeStats(symbols),
            quantityRangeStats: this.calculateQuantityRangeStats(symbols)
        };
    }

    /**
     * Validate entire portfolio
     * @returns {import('../types/ApplicationTypes.js').ValidationResult}
     */
    validatePortfolio() {
        return validationService.validatePortfolioDistribution(this.getAllSymbols());
    }

    /**
     * Export portfolio configuration for backend
     * Matches the format expected by your C++ ConfigProvider
     * @returns {Object} Export configuration
     */
    exportConfiguration() {
        const symbols = this.getAllSymbols();
        const stats = this.getPortfolioStats();
        
        return {
            metadata: {
                version: '1.0.0',
                generatedAt: new Date().toISOString(),
                platform: 'Beacon HFT Platform',
                symbolCount: symbols.length,
                isValid: stats.isComplete
            },
            portfolio: {
                totalPercentage: stats.totalPercentage,
                symbols: symbols.reduce((acc, symbolConfig) => {
                    acc[symbolConfig.symbol] = {
                        // Match C++ SymbolData structure
                        symbolName: symbolConfig.symbol,
                        weight: symbolConfig.percentage,
                        minPrice: symbolConfig.priceRange.min,
                        maxPrice: symbolConfig.priceRange.max,
                        spreadPercent: symbolConfig.spreadPercentage,
                        priceWeight: symbolConfig.priceRange.weight,
                        minQuantity: symbolConfig.quantityRange.min,
                        maxQuantity: symbolConfig.quantityRange.max,
                        quantityWeight: symbolConfig.quantityRange.weight,
                        tradeProbability: symbolConfig.tradeProbability
                    };
                    return acc;
                }, {})
            },
            statistics: stats
        };
    }

    // ...existing code continues with private methods...

    /**
     * Create symbol configuration with professional defaults
     * @private
     */
    createSymbolConfig(symbol, config) {
        return {
            symbol,
            percentage: config.percentage || 10.0,
            priceRange: {
                min: config.priceRange?.min || 100.0,
                max: config.priceRange?.max || 200.0,
                weight: config.priceRange?.weight || 1.0
            },
            quantityRange: {
                min: config.quantityRange?.min || 1,
                max: config.quantityRange?.max || 100,
                weight: config.quantityRange?.weight || 1.0
            },
            spreadPercentage: config.spreadPercentage || 0.5,
            tradeProbability: config.tradeProbability || 0.1,
            createdAt: Date.now(),
            lastModified: Date.now()
        };
    }

    // ...additional private methods for storage, statistics, etc...
}

/**
 * Professional error classes for symbol management
 */
export class SymbolValidationError extends Error {
    constructor(errors) {
        super(`Symbol validation failed: ${Array.isArray(errors) ? errors.join(', ') : errors}`);
        this.name = 'SymbolValidationError';
        this.errors = Array.isArray(errors) ? errors : [errors];
    }
}

export class SymbolAlreadyExistsError extends Error {
    constructor(symbol) {
        super(`Symbol "${symbol}" already exists in portfolio`);
        this.name = 'SymbolAlreadyExistsError';
        this.symbol = symbol;
    }
}

export class SymbolNotFoundError extends Error {
    constructor(symbol) {
        super(`Symbol "${symbol}" not found in portfolio`);
        this.name = 'SymbolNotFoundError';
        this.symbol = symbol;
    }
}

export class SymbolLimitExceededError extends Error {
    constructor(limit) {
        super(`Cannot add symbol: portfolio limit of ${limit} symbols exceeded`);
        this.name = 'SymbolLimitExceededError';
        this.limit = limit;
    }
}

// Export singleton instance for application use
export const symbolManager = new SymbolManager();
