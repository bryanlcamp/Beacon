/**
 * Professional Symbol Management Module
 * Handles symbol creation, validation, and state management
 * for Beacon HFT Platform
 */

export class SymbolManager {
    constructor() {
        this.symbols = new Map();
        this.eventListeners = new Map();
        this.validationRules = this.initializeValidationRules();
    }

    initializeValidationRules() {
        return {
            symbol: {
                minLength: 1,
                maxLength: 8,
                pattern: /^[A-Z]+$/,
                required: true
            },
            percentage: {
                min: 0.1,
                max: 100,
                type: 'number',
                required: true
            },
            priceRange: {
                min: 0.01,
                max: 999999.99,
                type: 'number',
                required: true
            },
            quantityRange: {
                min: 1,
                max: 1000000,
                type: 'integer',
                required: true
            }
        };
    }

    validateSymbol(symbolName) {
        const errors = [];
        const rules = this.validationRules.symbol;

        if (!symbolName || symbolName.length < rules.minLength) {
            errors.push(`Symbol must be at least ${rules.minLength} character(s)`);
        }

        if (symbolName && symbolName.length > rules.maxLength) {
            errors.push(`Symbol cannot exceed ${rules.maxLength} characters`);
        }

        if (symbolName && !rules.pattern.test(symbolName)) {
            errors.push('Symbol must contain only uppercase letters');
        }

        if (this.symbols.has(symbolName)) {
            errors.push('Symbol already exists');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    addSymbol(symbolName, config = {}) {
        const validation = this.validateSymbol(symbolName);
        
        if (!validation.isValid) {
            throw new SymbolValidationError(validation.errors);
        }

        const symbolData = {
            name: symbolName,
            percentage: config.percentage || 10,
            priceRange: {
                min: config.priceMin || 100,
                max: config.priceMax || 200,
                weight: config.priceWeight || 1.0
            },
            quantityRange: {
                min: config.qtyMin || 1,
                max: config.qtyMax || 100,
                weight: config.qtyWeight || 1.0
            },
            spreadPercentage: config.spreadPercentage || 0.5,
            tradeProbability: config.tradeProbability || 0.1,
            createdAt: Date.now(),
            lastModified: Date.now()
        };

        this.symbols.set(symbolName, symbolData);
        this.emit('symbolAdded', symbolData);
        
        return symbolData;
    }

    removeSymbol(symbolName) {
        if (!this.symbols.has(symbolName)) {
            throw new Error(`Symbol ${symbolName} does not exist`);
        }

        const symbolData = this.symbols.get(symbolName);
        this.symbols.delete(symbolName);
        this.emit('symbolRemoved', symbolData);
        
        return symbolData;
    }

    updateSymbol(symbolName, updates) {
        if (!this.symbols.has(symbolName)) {
            throw new Error(`Symbol ${symbolName} does not exist`);
        }

        const currentData = this.symbols.get(symbolName);
        const updatedData = {
            ...currentData,
            ...updates,
            lastModified: Date.now()
        };

        this.symbols.set(symbolName, updatedData);
        this.emit('symbolUpdated', updatedData);
        
        return updatedData;
    }

    getAllSymbols() {
        return Array.from(this.symbols.values());
    }

    getTotalPercentage() {
        return this.getAllSymbols().reduce((total, symbol) => total + symbol.percentage, 0);
    }

    getRemainingPercentage() {
        return 100 - this.getTotalPercentage();
    }

    isPercentageValid() {
        const total = this.getTotalPercentage();
        return Math.abs(total - 100) < 0.01; // Allow for floating point precision
    }

    // Event system for professional component communication
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    off(event, callback) {
        if (!this.eventListeners.has(event)) return;
        const listeners = this.eventListeners.get(event);
        const index = listeners.indexOf(callback);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    }

    emit(event, data) {
        if (!this.eventListeners.has(event)) return;
        this.eventListeners.get(event).forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event listener for ${event}:`, error);
            }
        });
    }

    // Export configuration for backend integration
    exportConfiguration() {
        const config = {
            symbols: {},
            totalPercentage: this.getTotalPercentage(),
            isValid: this.isPercentageValid(),
            generatedAt: new Date().toISOString()
        };

        this.symbols.forEach((symbolData, symbolName) => {
            config.symbols[symbolName] = {
                percentage: symbolData.percentage,
                priceRange: symbolData.priceRange,
                quantityRange: symbolData.quantityRange,
                spreadPercentage: symbolData.spreadPercentage,
                tradeProbability: symbolData.tradeProbability
            };
        });

        return config;
    }
}

// Professional error classes
export class SymbolValidationError extends Error {
    constructor(errors) {
        super(`Symbol validation failed: ${errors.join(', ')}`);
        this.name = 'SymbolValidationError';
        this.errors = errors;
    }
}
