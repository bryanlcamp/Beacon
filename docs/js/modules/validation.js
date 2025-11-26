/**
 * Beacon Validation Framework
 * Modern ES6+ validation system with native browser APIs
 * Zero dependencies, cross-browser compatible
 */

export class BeaconValidator {
    constructor() {
        this.validators = new Map();
        this.errorDisplays = new Map();
        this.debounceTimers = new Map();
    }

    /**
     * Register a validation rule for an input element
     * @param {HTMLElement} element - The input element to validate
     * @param {Object} config - Validation configuration
     */
    registerInput(element, config = {}) {
        const {
            type = 'text',
            min = null,
            max = null,
            required = false,
            pattern = null,
            customValidator = null,
            errorContainer = null,
            debounceMs = 300
        } = config;

        // Store validator config
        this.validators.set(element, {
            type,
            min,
            max,
            required,
            pattern,
            customValidator,
            errorContainer,
            debounceMs
        });

        // Set up native HTML5 validation attributes
        this.setupNativeValidation(element, config);

        // Add event listeners with proper debouncing
        this.setupEventListeners(element);
    }

    /**
     * Set up native HTML5 validation attributes
     */
    setupNativeValidation(element, config) {
        if (config.required) {
            element.setAttribute('required', '');
        }
        
        if (config.min !== null) {
            element.setAttribute('min', config.min);
        }
        
        if (config.max !== null) {
            element.setAttribute('max', config.max);
        }
        
        if (config.pattern) {
            element.setAttribute('pattern', config.pattern);
        }

        // Set up number formatting for numeric inputs
        if (config.type === 'number' || config.type === 'percentage' || config.type === 'currency') {
            element.addEventListener('blur', (e) => this.formatNumericInput(e.target, config.type));
        }
    }

    /**
     * Set up debounced event listeners
     */
    setupEventListeners(element) {
        const config = this.validators.get(element);
        
        // Input validation with debouncing
        element.addEventListener('input', (e) => {
            this.debounceValidation(e.target, config.debounceMs);
        });

        // Immediate validation on blur
        element.addEventListener('blur', (e) => {
            this.validateElement(e.target);
        });

        // Clear errors on focus
        element.addEventListener('focus', (e) => {
            this.clearError(e.target);
        });
    }

    /**
     * Debounced validation to avoid excessive calls
     */
    debounceValidation(element, debounceMs) {
        // Clear existing timer
        if (this.debounceTimers.has(element)) {
            clearTimeout(this.debounceTimers.get(element));
        }

        // Set new timer
        const timer = setTimeout(() => {
            this.validateElement(element);
            this.debounceTimers.delete(element);
        }, debounceMs);

        this.debounceTimers.set(element, timer);
    }

    /**
     * Format numeric inputs using native browser APIs
     */
    formatNumericInput(element, type) {
        const value = parseFloat(element.value);
        
        if (isNaN(value)) return;

        switch (type) {
            case 'number':
                element.value = value.toLocaleString();
                break;
            case 'currency':
                element.value = value.toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD'
                });
                break;
            case 'percentage':
                element.value = value.toFixed(1);
                break;
        }
    }

    /**
     * Validate a single element
     */
    validateElement(element) {
        const config = this.validators.get(element);
        if (!config) return true;

        // Clear previous custom validity
        element.setCustomValidity('');

        // Check native HTML5 validation first
        if (!element.checkValidity()) {
            this.showError(element, element.validationMessage);
            return false;
        }

        // Run custom validator if provided
        if (config.customValidator) {
            const result = config.customValidator(element.value, element);
            if (result !== true) {
                element.setCustomValidity(result);
                this.showError(element, result);
                return false;
            }
        }

        this.clearError(element);
        return true;
    }

    /**
     * Show validation error using native browser styling
     */
    showError(element, message) {
        // Use native browser validation styling
        element.setAttribute('aria-invalid', 'true');
        element.style.borderColor = '#ff4444';
        element.title = message;

        // Store error for external access
        this.errorDisplays.set(element, message);

        // Show custom error container if specified
        const config = this.validators.get(element);
        if (config && config.errorContainer) {
            const container = document.querySelector(config.errorContainer);
            if (container) {
                container.textContent = message;
                container.style.color = '#ff4444';
                container.style.display = 'block';
            }
        }
    }

    /**
     * Clear validation error
     */
    clearError(element) {
        element.setAttribute('aria-invalid', 'false');
        element.style.borderColor = '';
        element.title = '';
        element.setCustomValidity('');

        this.errorDisplays.delete(element);

        // Clear custom error container
        const config = this.validators.get(element);
        if (config && config.errorContainer) {
            const container = document.querySelector(config.errorContainer);
            if (container) {
                container.style.display = 'none';
            }
        }
    }

    /**
     * Validate all registered elements
     */
    validateAll() {
        let isValid = true;
        
        for (const [element] of this.validators) {
            if (!this.validateElement(element)) {
                isValid = false;
            }
        }
        
        return isValid;
    }

    /**
     * Get all current errors
     */
    getErrors() {
        return new Map(this.errorDisplays);
    }

    /**
     * Clear all validations
     */
    clearAll() {
        for (const [element] of this.validators) {
            this.clearError(element);
        }
    }
}

// Export singleton instance
export const validator = new BeaconValidator();