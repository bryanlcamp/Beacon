// =============================================================================
// BEACON AUTHOR - VALIDATION MODULE
// =============================================================================

export const ValidationManager = {

    // Symbol validation
    isDuplicateSymbol(symbol) {
        const existing = document.querySelector(`[data-symbol="${symbol}"]`);
        return !!existing;
    },

    validateSymbolFormat(symbol) {
        if (!symbol || symbol.length === 0) {
            return { valid: false, error: 'Symbol cannot be empty' };
        }

        if (symbol.length > 10) {
            return { valid: false, error: 'Symbol cannot exceed 10 characters' };
        }

        // Allow alphanumeric characters, dots, and hyphens
        if (!/^[A-Z0-9.-]+$/.test(symbol)) {
            return { valid: false, error: 'Symbol can only contain letters, numbers, dots, and hyphens' };
        }

        return { valid: true };
    },

    // Percentage validation
    filterPercentageInput(input) {
        // Remove any non-numeric characters except decimal point
        const cleanValue = input.value.replace(/[^0-9.]/g, '');

        // Prevent multiple decimal points
        const parts = cleanValue.split('.');
        if (parts.length > 2) {
            input.value = parts[0] + '.' + parts.slice(1).join('');
        } else {
            input.value = cleanValue;
        }

        // Limit to 2 decimal places
        if (parts[1] && parts[1].length > 2) {
            input.value = parts[0] + '.' + parts[1].substring(0, 2);
        }
    },

    validatePercentageInput(input) {
        const value = parseFloat(input.value);
        const min = parseFloat(input.min) || 0;
        const max = parseFloat(input.max) || 100;

        // Clear invalid styling
        input.classList.remove('percentage-error');

        if (isNaN(value) || value < min || value > max) {
            input.classList.add('percentage-error');
            return false;
        }

        // Update tracking if productPercentages exists
        if (window.productPercentages) {
            const card = input.closest('.datacard');
            if (card && card.dataset.symbol) {
                const symbol = card.dataset.symbol;
                window.productPercentages.set(symbol, { percentage: value, isDirty: true });
            }
        }

        return true;
    },

    showValidationError(message) {
        // Simple error display - could be enhanced with toast/modal
        const existingError = document.querySelector('.symbol-validation-error');
        if (existingError) {
            existingError.remove();
        }

        const errorDiv = document.createElement('div');
        errorDiv.className = 'symbol-validation-error';
        errorDiv.style.cssText = 'color: #dc267f; font-size: 0.85em; margin-top: 4px; padding: 4px 8px; background: rgba(220,38,127,0.1); border-radius: 4px; border: 1px solid rgba(220,38,127,0.2);';
        errorDiv.textContent = message;

        const symbolInput = document.getElementById('symbolInput');
        if (symbolInput && symbolInput.parentNode) {
            symbolInput.parentNode.appendChild(errorDiv);

            // Auto-remove error after 3 seconds
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.remove();
                }
            }, 3000);
        }
    }
};

// Make available globally for compatibility
if (typeof window !== 'undefined') {
    window.ValidationManager = ValidationManager;

    // Legacy global function support
    window.isDuplicateSymbol = ValidationManager.isDuplicateSymbol;
    window.validateSymbolFormat = ValidationManager.validateSymbolFormat;
    window.showValidationError = ValidationManager.showValidationError;
    window.validatePercentageInput = ValidationManager.validatePercentageInput;
    window.filterPercentageInput = ValidationManager.filterPercentageInput;
}
