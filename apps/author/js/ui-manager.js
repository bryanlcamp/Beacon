'use strict';

// ============================================================================
// BEACON AUTHOR - UI INTERACTION MANAGER
// ============================================================================

BeaconAuthor.modules.UIManager = {

    /**
     * Update generate button state based on validation
     */
    updateGenerateButtonState() {
        const generateBtn = document.getElementById('generateDataset');
        if (!generateBtn) return;

        const total = BeaconAuthor.modules.PercentageManager.calculateTotal();
        const hasZeros = BeaconAuthor.modules.PercentageManager.hasZeroPercentProducts();

        generateBtn.disabled = (total !== 100) || hasZeros;

        if (BeaconAuthor.config.IS_DEMO_MODE && !generateBtn.disabled) {
            generateBtn.style.background = 'linear-gradient(135deg, #ff914d, #ff7b3d)';
            generateBtn.title = 'Demo Mode - Click to see generation preview';
        } else if (BeaconAuthor.config.IS_DEMO_MODE) {
            generateBtn.title = 'Fix percentages to preview generation';
        }
    },

    /**
     * Setup utility dropdown functionality
     */
    setupUtilityDropdowns() {
        const infoIcon = document.getElementById('infoIcon');
        const infoDropdown = document.getElementById('infoDropdown');

        if (infoIcon && infoDropdown) {
            infoIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                const isVisible = infoDropdown.style.display === 'block';
                infoDropdown.style.display = isVisible ? 'none' : 'block';
            });
        }

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.utility-icon') && infoDropdown) {
                infoDropdown.style.display = 'none';
            }
        });
    },

    /**
     * Setup spinner functionality for message count
     */
    setupSpinnerFunctionality() {
        const messageCountInput = document.getElementById('messageCount');
        const spinnerUp = document.querySelector('.spinner-up');
        const spinnerDown = document.querySelector('.spinner-down');

        if (!messageCountInput) return;

        // Format with commas
        const formatWithCommas = (num) => {
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        };

        // Parse numeric value
        const parseNumericValue = (value) => {
            return parseInt(value.replace(/,/g, '')) || 0;
        };

        // Spinner up
        if (spinnerUp) {
            spinnerUp.addEventListener('click', () => {
                const current = parseNumericValue(messageCountInput.value);
                const newValue = current + 1000;
                messageCountInput.value = formatWithCommas(newValue);
                BeaconAuthor.modules.ValidationManager.validateMessageCount(messageCountInput.value);
            });
        }

        // Spinner down
        if (spinnerDown) {
            spinnerDown.addEventListener('click', () => {
                const current = parseNumericValue(messageCountInput.value);
                const newValue = Math.max(1000, current - 1000);
                messageCountInput.value = formatWithCommas(newValue);
                BeaconAuthor.modules.ValidationManager.validateMessageCount(messageCountInput.value);
            });
        }

        // Input validation
        messageCountInput.addEventListener('input', () => {
            BeaconAuthor.modules.ValidationManager.validateMessageCount(messageCountInput.value);
        });
    }
};
