'use strict';

// ============================================================================
// BEACON AUTHOR - INPUT VALIDATION MANAGER
// ============================================================================

BeaconAuthor.modules.ValidationManager = {

    /**
     * Filter percentage input to only allow valid integers
     */
    filterPercentageInput(input) {
        let value = input.value;

        // Remove non-numeric characters
        value = value.replace(/[^0-9]/g, '');

        // Convert to integer and clamp to 0-100
        let numValue = parseInt(value) || 0;
        if (numValue > 100) numValue = 100;

        // Update input if changed
        const newValue = numValue.toString();
        if (input.value !== newValue) {
            const cursorPos = input.selectionStart;
            input.value = newValue;
            input.setSelectionRange(Math.min(cursorPos, newValue.length), Math.min(cursorPos, newValue.length));
        }
    },

    /**
     * Validate percentage input and update allocation
     */
    validatePercentageInput(input) {
        if (!input || !input.closest) return false;

        const card = input.closest('.datacard');
        const symbol = card?.dataset?.symbol;
        if (!symbol) return false;

        const value = parseInt(input.value) || 0;

        // Clear previous validation styling
        input.classList.remove('invalid');

        // Validate 0% (always invalid)
        if (value === 0) {
            input.classList.add('invalid');
            BeaconAuthor.modules.PercentageManager.updateAllocationDisplay();
            return false;
        }

        // Update percentage in state
        BeaconAuthor.modules.PercentageManager.updatePercentage(symbol, value);

        // Check for over-allocation
        const total = BeaconAuthor.modules.PercentageManager.calculateTotal();
        if (total > 100) {
            input.classList.add('invalid');
        }

        // Update allocation display
        BeaconAuthor.modules.PercentageManager.updateAllocationDisplay();
        return total <= 100 && value > 0;
    },

    /**
     * Setup input validation for a percentage input
     */
    setupPercentageValidation(input, symbol) {
        // Initialize in state
        const initialValue = parseInt(input.value) || 0;
        BeaconAuthor.modules.PercentageManager.initializeProduct(symbol, initialValue);

        // Add event listeners
        input.addEventListener('input', (e) => {
            this.filterPercentageInput(e.target);
            this.validatePercentageInput(e.target);
        });

        input.addEventListener('change', (e) => {
            this.validatePercentageInput(e.target);
        });

        // Prevent non-numeric keypress
        input.addEventListener('keypress', (e) => {
            // Allow special keys
            if ([8, 9, 27, 13, 46, 37, 38, 39, 40].indexOf(e.keyCode) !== -1 ||
                (e.ctrlKey && [65, 67, 86, 88].indexOf(e.keyCode) !== -1)) {
                return;
            }
            // Block non-numeric keys
            if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                e.preventDefault();
            }
        });

        // Trigger initial validation
        this.validatePercentageInput(input);
    },

    /**
     * Validate message count field
     */
    validateMessageCount(value) {
        const messageCount = parseInt(value.replace(/,/g, '')) || 0;
        const messageCountInput = document.getElementById('messageCount');
        const spinnerControl = messageCountInput?.closest('.spinner-control');

        if (spinnerControl) {
            spinnerControl.removeAttribute('data-adorner');

            if (messageCount <= 0 || messageCount < 1000) {
                spinnerControl.setAttribute('data-adorner', 'red');
            } else {
                spinnerControl.setAttribute('data-adorner', 'green');
            }
        }
    }
};
