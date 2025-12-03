/**
 * @fileoverview Professional validation service for Beacon HFT Platform
 * Provides comprehensive validation with detailed error reporting
 */

/**
 * Professional validation service that matches C++ backend validation standards
 * Provides type safety and comprehensive error reporting for all user inputs
 */
export class ValidationService {
    constructor() {
        /** @type {Map<string, Function>} */
        this.validators = new Map();
        
        // Initialize built-in validators
        this.initializeBuiltInValidators();
    }

    /**
     * Initialize built-in validation rules
     * @private
     */
    initializeBuiltInValidators() {
        // Symbol validation - matches HFT industry standards
        this.addValidator('symbol', (value) => {
            const errors = [];
            
            if (!value || typeof value !== 'string') {
                errors.push('Symbol is required');
                return { isValid: false, errors };
            }
            
            const cleanSymbol = value.trim().toUpperCase();
            
            if (cleanSymbol.length < 1) {
                errors.push('Symbol cannot be empty');
            }
            
            if (cleanSymbol.length > 8) {
                errors.push('Symbol cannot exceed 8 characters (exchange limitation)');
            }
            
            if (!/^[A-Z]+$/.test(cleanSymbol)) {
                errors.push('Symbol must contain only uppercase letters');
            }
            
            // Check against reserved symbols
            const reservedSymbols = ['TEST', 'NULL', 'VOID', 'CASH'];
            if (reservedSymbols.includes(cleanSymbol)) {
                errors.push(`Symbol "${cleanSymbol}" is reserved`);
            }
            
            return {
                isValid: errors.length === 0,
                errors,
                sanitized: cleanSymbol
            };
        });

        // Percentage validation - financial precision required
        this.addValidator('percentage', (value) => {
            const errors = [];
            const numValue = parseFloat(value);
            
            if (isNaN(numValue)) {
                errors.push('Percentage must be a valid number');
                return { isValid: false, errors };
            }
            
            if (numValue < 0.01) {
                errors.push('Percentage must be at least 0.01%');
            }
            
            if (numValue > 100) {
                errors.push('Percentage cannot exceed 100%');
            }
            
            // Check for excessive precision (more than 2 decimal places)
            const decimalPlaces = (numValue.toString().split('.')[1] || '').length;
            if (decimalPlaces > 2) {
                errors.push('Percentage precision limited to 2 decimal places');
            }
            
            return {
                isValid: errors.length === 0,
                errors,
                sanitized: Math.round(numValue * 100) / 100 // Round to 2 decimal places
            };
        });

        // Price validation - matches C++ financial precision
        this.addValidator('price', (value) => {
            const errors = [];
            const numValue = parseFloat(value);
            
            if (isNaN(numValue)) {
                errors.push('Price must be a valid number');
                return { isValid: false, errors };
            }
            
            if (numValue <= 0) {
                errors.push('Price must be greater than zero');
            }
            
            if (numValue > 999999.99) {
                errors.push('Price exceeds maximum allowed value ($999,999.99)');
            }
            
            // Check tick size compliance (0.01 minimum for most exchanges)
            const tickSize = 0.01;
            if ((numValue % tickSize) !== 0) {
                errors.push(`Price must be in increments of $${tickSize}`);
            }
            
            return {
                isValid: errors.length === 0,
                errors,
                sanitized: Math.round(numValue * 100) / 100
            };
        });

        // Quantity validation - integer quantities for shares
        this.addValidator('quantity', (value) => {
            const errors = [];
            const numValue = parseInt(value);
            
            if (isNaN(numValue) || numValue !== parseFloat(value)) {
                errors.push('Quantity must be a whole number');
                return { isValid: false, errors };
            }
            
            if (numValue < 1) {
                errors.push('Quantity must be at least 1');
            }
            
            if (numValue > 1000000) {
                errors.push('Quantity exceeds maximum allowed (1,000,000 shares)');
            }
            
            return {
                isValid: errors.length === 0,
                errors,
                sanitized: numValue
            };
        });

        // Weight validation for distribution algorithms
        this.addValidator('weight', (value) => {
            const errors = [];
            const numValue = parseFloat(value);
            
            if (isNaN(numValue)) {
                errors.push('Weight must be a valid number');
                return { isValid: false, errors };
            }
            
            if (numValue < 0.1) {
                errors.push('Weight must be at least 0.1');
            }
            
            if (numValue > 5.0) {
                errors.push('Weight cannot exceed 5.0');
            }
            
            return {
                isValid: errors.length === 0,
                errors,
                sanitized: Math.round(numValue * 10) / 10 // Round to 1 decimal place
            };
        });

        // Spread percentage validation
        this.addValidator('spreadPercentage', (value) => {
            const errors = [];
            const numValue = parseFloat(value);
            
            if (isNaN(numValue)) {
                errors.push('Spread percentage must be a valid number');
                return { isValid: false, errors };
            }
            
            if (numValue < 0.001) {
                errors.push('Spread percentage must be at least 0.001% (1 basis point)');
            }
            
            if (numValue > 10.0) {
                errors.push('Spread percentage cannot exceed 10% (unrealistic for liquid markets)');
            }
            
            return {
                isValid: errors.length === 0,
                errors,
                sanitized: Math.round(numValue * 1000) / 1000 // Round to 3 decimal places
            };
        });
    }

    /**
     * Add custom validator
     * @param {string} name - Validator name
     * @param {Function} validatorFn - Validation function
     */
    addValidator(name, validatorFn) {
        this.validators.set(name, validatorFn);
    }

    /**
     * Validate a single value against a validator
     * @param {string} validatorName - Name of validator to use
     * @param {any} value - Value to validate
     * @returns {import('../types/ApplicationTypes.js').ValidationResult}
     */
    validate(validatorName, value) {
        const validator = this.validators.get(validatorName);
        
        if (!validator) {
            return {
                isValid: false,
                errors: [`Unknown validator: ${validatorName}`]
            };
        }
        
        try {
            return validator(value);
        } catch (error) {
            return {
                isValid: false,
                errors: [`Validation error: ${error.message}`]
            };
        }
    }

    /**
     * Validate symbol configuration object
     * @param {import('../types/ApplicationTypes.js').SymbolConfig} symbolConfig
     * @returns {import('../types/ApplicationTypes.js').ValidationResult}
     */
    validateSymbolConfig(symbolConfig) {
        const allErrors = [];
        const sanitized = {};
        
        // Validate each field
        const fields = [
            { key: 'symbol', validator: 'symbol', value: symbolConfig.symbol },
            { key: 'percentage', validator: 'percentage', value: symbolConfig.percentage },
            { key: 'priceRange.min', validator: 'price', value: symbolConfig.priceRange?.min },
            { key: 'priceRange.max', validator: 'price', value: symbolConfig.priceRange?.max },
            { key: 'priceRange.weight', validator: 'weight', value: symbolConfig.priceRange?.weight },
            { key: 'quantityRange.min', validator: 'quantity', value: symbolConfig.quantityRange?.min },
            { key: 'quantityRange.max', validator: 'quantity', value: symbolConfig.quantityRange?.max },
            { key: 'quantityRange.weight', validator: 'weight', value: symbolConfig.quantityRange?.weight },
            { key: 'spreadPercentage', validator: 'spreadPercentage', value: symbolConfig.spreadPercentage },
            { key: 'tradeProbability', validator: 'percentage', value: symbolConfig.tradeProbability * 100 }
        ];

        fields.forEach(field => {
            const result = this.validate(field.validator, field.value);
            
            if (!result.isValid) {
                result.errors.forEach(error => {
                    allErrors.push(`${field.key}: ${error}`);
                });
            } else if (result.sanitized !== undefined) {
                this.setNestedProperty(sanitized, field.key, result.sanitized);
            }
        });

        // Business logic validation
        if (symbolConfig.priceRange) {
            const { min, max } = symbolConfig.priceRange;
            if (min >= max) {
                allErrors.push('Price range: minimum must be less than maximum');
            }
        }

        if (symbolConfig.quantityRange) {
            const { min, max } = symbolConfig.quantityRange;
            if (min >= max) {
                allErrors.push('Quantity range: minimum must be less than maximum');
            }
        }

        return {
            isValid: allErrors.length === 0,
            errors: allErrors,
            sanitized: Object.keys(sanitized).length > 0 ? sanitized : undefined
        };
    }

    /**
     * Validate portfolio percentage distribution
     * @param {import('../types/ApplicationTypes.js').SymbolConfig[]} symbols
     * @returns {import('../types/ApplicationTypes.js').ValidationResult}
     */
    validatePortfolioDistribution(symbols) {
        const errors = [];
        
        if (!Array.isArray(symbols) || symbols.length === 0) {
            return {
                isValid: false,
                errors: ['Portfolio must contain at least one symbol']
            };
        }

        // Calculate total percentage
        const totalPercentage = symbols.reduce((sum, symbol) => {
            return sum + (symbol.percentage || 0);
        }, 0);

        // Allow small floating point tolerance
        const tolerance = 0.01;
        
        if (Math.abs(totalPercentage - 100) > tolerance) {
            errors.push(`Portfolio percentages must sum to 100% (current: ${totalPercentage.toFixed(2)}%)`);
        }

        // Check for duplicate symbols
        const symbolNames = symbols.map(s => s.symbol);
        const duplicates = symbolNames.filter((name, index) => symbolNames.indexOf(name) !== index);
        
        if (duplicates.length > 0) {
            errors.push(`Duplicate symbols found: ${duplicates.join(', ')}`);
        }

        // Validate individual symbols
        symbols.forEach((symbolConfig, index) => {
            const validation = this.validateSymbolConfig(symbolConfig);
            if (!validation.isValid) {
                validation.errors.forEach(error => {
                    errors.push(`Symbol ${index + 1} (${symbolConfig.symbol}): ${error}`);
                });
            }
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Set nested property using dot notation
     * @private
     * @param {Object} obj - Target object
     * @param {string} path - Dot notation path
     * @param {any} value - Value to set
     */
    setNestedProperty(obj, path, value) {
        const keys = path.split('.');
        let current = obj;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[keys[keys.length - 1]] = value;
    }
}

// Export singleton instance for application-wide use
export const validationService = new ValidationService();
