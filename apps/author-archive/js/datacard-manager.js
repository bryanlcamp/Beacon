'use strict';

// ============================================================================
// BEACON AUTHOR - DATACARD MANAGEMENT
// ============================================================================

BeaconAuthor.modules.DatacardManager = {

    /**
     * Initialize percentage validation for all existing datacards
     */
    initializeAllDatacards() {
        const datacards = document.querySelectorAll('.datacard');

        datacards.forEach(card => {
            const symbol = card.dataset.symbol;
            const percentageInput = card.querySelector('.percentage-input');

            if (percentageInput && symbol) {
                // Setup validation for this input
                BeaconAuthor.modules.ValidationManager.setupPercentageValidation(percentageInput, symbol);

                // Setup remove button
                const removeBtn = card.querySelector('.remove-symbol');
                if (removeBtn) {
                    removeBtn.addEventListener('click', () => {
                        BeaconAuthor.state.productPercentages.delete(symbol);
                        card.remove();
                        BeaconAuthor.modules.PercentageManager.redistributeCleanPercentages();
                        BeaconAuthor.modules.PercentageManager.updateAllocationDisplay();
                        this.updateEmptyStateDisplay();
                    });
                }
            }
        });

        // Update allocation display after initialization
        BeaconAuthor.modules.PercentageManager.updateAllocationDisplay();
    },

    /**
     * Update empty state display
     */
    updateEmptyStateDisplay() {
        const emptyMessage = document.getElementById('emptyProductsMessage');
        const datacards = document.querySelectorAll('.datacard');

        if (emptyMessage) {
            emptyMessage.style.display = datacards.length === 0 ? 'block' : 'none';
        }
    },

    /**
     * Create sample datacards for demo mode
     */
    createDemoDatacards() {
        const datacardContainer = document.getElementById('datacardContainer');
        if (!datacardContainer || typeof createDetailedDatacard !== 'function') {
            return;
        }

        const symbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA'];
        const basePercentage = Math.floor(100 / symbols.length);
        const remainder = 100 % symbols.length;

        // Clear container
        datacardContainer.innerHTML = '';

        symbols.forEach((symbol, index) => {
            try {
                const card = createDetailedDatacard(symbol);
                if (card) {
                    // Set percentage that sums to 100%
                    const percentage = basePercentage + (index < remainder ? 1 : 0);
                    const percentInput = card.querySelector('.percentage-input');
                    if (percentInput) {
                        percentInput.value = percentage;
                    }

                    datacardContainer.appendChild(card);
                }
            } catch (error) {
                console.error(`Error creating ${symbol} datacard:`, error);
            }
        });

        // Initialize validation for new cards
        setTimeout(() => this.initializeAllDatacards(), 100);
    }
};
