/**
 * Centralized Dataset Validation Engine
 * Single source of truth for all validation logic
 */

export class DatasetValidationEngine {
    constructor() {
        this.rules = new Map();
        this.state = {
            totalMessages: 0,
            symbols: new Map(),
            outputFormat: 'nsdq'
        };
        this.validationResults = {
            isValid: false,
            errors: [],
            warnings: [],
            fieldErrors: new Map()
        };
    }

    /**
     * Register validation rules
     */
    registerRules() {
        // Total Messages Rules
        this.rules.set('totalMessages', {
            required: true,
            min: 1000,
            max: 999999999,
            validate: (value) => {
                if (!value || value < 1000) return 'Minimum 1,000 messages required';
                if (value > 999999999) return 'Maximum 999,999,999 messages allowed';
                return true;
            }
        });

        // Symbol Rules
        this.rules.set('symbols', {
            required: true,
            validate: (symbols) => {
                if (symbols.size === 0) return 'At least one symbol is required';
                
                // Check each symbol
                for (const [symbol, data] of symbols) {
                    if (!/^[A-Z]{1,5}$/.test(symbol)) {
                        return `Invalid symbol format: ${symbol}`;
                    }
                    if (data.percentage < 0 || data.percentage > 100) {
                        return `Invalid percentage for ${symbol}: ${data.percentage}%`;
                    }
                }
                return true;
            }
        });

        // Percentage Total Rules  
        this.rules.set('percentageTotal', {
            required: true,
            validate: (total) => {
                if (Math.abs(total - 100) > 0.01) {
                    if (total < 100) return `Percentages total ${total.toFixed(1)}% - need ${(100 - total).toFixed(1)}% more`;
                    if (total > 100) return `Percentages total ${total.toFixed(1)}% - ${(total - 100).toFixed(1)}% over limit`;
                }
                return true;
            }
        });
    }

    /**
     * Update internal state (single source of truth)
     */
    updateState(newState) {
        this.state = { ...this.state, ...newState };
        return this.validateAll();
    }

    /**
     * THE validation function - validates everything at once
     */
    validateAll() {
        // Reset results
        this.validationResults = {
            isValid: true,
            errors: [],
            warnings: [],
            fieldErrors: new Map()
        };

        // Calculate derived values
        const percentageTotal = this.calculatePercentageTotal();
        const remainingPercentage = 100 - percentageTotal;

        // Validate each rule
        for (const [ruleName, rule] of this.rules) {
            let value;
            
            switch (ruleName) {
                case 'totalMessages':
                    value = this.state.totalMessages;
                    break;
                case 'symbols':
                    value = this.state.symbols;
                    break;
                case 'percentageTotal':
                    value = percentageTotal;
                    break;
                default:
                    continue;
            }

            // Run validation
            const result = rule.validate(value);
            if (result !== true) {
                this.validationResults.errors.push(result);
                this.validationResults.fieldErrors.set(ruleName, result);
                this.validationResults.isValid = false;
            }
        }

        // Add derived state for UI
        this.validationResults.derivedState = {
            percentageTotal,
            remainingPercentage,
            hasSymbols: this.state.symbols.size > 0,
            canAddSymbol: remainingPercentage > 0,
            canSave: this.state.symbols.size > 0,
            canRun: this.validationResults.isValid && this.state.symbols.size > 0
        };

        return this.validationResults;
    }

    /**
     * Calculate total percentage (single calculation)
     */
    calculatePercentageTotal() {
        let total = 0;
        for (const [, symbolData] of this.state.symbols) {
            total += symbolData.percentage || 0;
        }
        return total;
    }

    /**
     * Get current validation state
     */
    getValidationResults() {
        return this.validationResults;
    }

    /**
     * Get current state
     */
    getState() {
        return this.state;
    }

    /**
     * Add symbol to state
     */
    addSymbol(symbol, percentage = 0) {
        const upperSymbol = symbol.toUpperCase();
        
        // Check if symbol already exists
        if (this.state.symbols.has(upperSymbol)) {
            throw new Error(`Symbol ${upperSymbol} already exists`);
        }

        // Add to state
        this.state.symbols.set(upperSymbol, {
            symbol: upperSymbol,
            percentage: percentage
        });

        return this.validateAll();
    }

    /**
     * Remove symbol from state
     */
    removeSymbol(symbol) {
        const upperSymbol = symbol.toUpperCase();
        this.state.symbols.delete(upperSymbol);
        return this.validateAll();
    }

    /**
     * Update symbol percentage
     */
    updateSymbolPercentage(symbol, percentage) {
        const upperSymbol = symbol.toUpperCase();
        const symbolData = this.state.symbols.get(upperSymbol);
        
        if (symbolData) {
            symbolData.percentage = percentage;
            return this.validateAll();
        }
        
        throw new Error(`Symbol ${upperSymbol} not found`);
    }

    /**
     * Calculate smart default percentage for new symbols
     */
    calculateSmartPercentage() {
        const remaining = this.validationResults.derivedState?.remainingPercentage || 100;
        return Math.min(20, Math.max(0, remaining));
    }

    /**
     * Export configuration
     */
    exportConfig() {
        if (!this.validationResults.isValid) {
            throw new Error('Cannot export invalid configuration');
        }

        const symbols = [];
        for (const [symbol, data] of this.state.symbols) {
            symbols.push({
                symbol: symbol,
                percentage: data.percentage
            });
        }

        return {
            totalMessages: this.state.totalMessages,
            outputFormat: this.state.outputFormat,
            symbols: symbols,
            timestamp: new Date().toISOString(),
            validation: {
                isValid: this.validationResults.isValid,
                percentageTotal: this.validationResults.derivedState.percentageTotal
            }
        };
    }
}