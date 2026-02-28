'use strict';

// ============================================================================
// BEACON AUTHOR - PERCENTAGE ALLOCATION MANAGER
// ============================================================================

BeaconAuthor.modules.PercentageManager = {

    /**
     * Initialize a product percentage allocation
     */
    initializeProduct(symbol, percentage = 0) {
        BeaconAuthor.state.productPercentages.set(symbol, {
            percentage: percentage,
            isDirty: false
        });
    },

    /**
     * Update percentage for a product and mark as dirty
     */
    updatePercentage(symbol, percentage) {
        const sanitizedValue = Math.max(0, Math.min(100, parseInt(percentage) || 0));
        BeaconAuthor.state.productPercentages.set(symbol, {
            percentage: sanitizedValue,
            isDirty: true
        });
        return sanitizedValue;
    },

    /**
     * Calculate total percentage across all products
     */
    calculateTotal() {
        let total = 0;
        document.querySelectorAll('.percentage-input').forEach(input => {
            total += parseInt(input.value) || 0;
        });
        return total;
    },

    /**
     * Check if any products have 0% allocation
     */
    hasZeroPercentProducts() {
        return Array.from(document.querySelectorAll('.percentage-input')).some(input => {
            return (parseInt(input.value) || 0) === 0;
        });
    },

    /**
     * Redistribute percentages for clean (non-dirty) products
     */
    redistributeCleanPercentages() {
        const datacards = document.querySelectorAll('.datacard');
        const cleanProducts = [];
        const dirtyProducts = [];
        let dirtyTotal = 0;

        // Categorize products as clean or dirty
        datacards.forEach(card => {
            const symbol = card.dataset.symbol;
            const trackingData = BeaconAuthor.state.productPercentages.get(symbol);

            if (trackingData && trackingData.isDirty) {
                dirtyProducts.push({ symbol, percentage: trackingData.percentage });
                dirtyTotal += trackingData.percentage;
            } else {
                cleanProducts.push(symbol);
            }
        });

        // Redistribute remaining percentage to clean products
        if (cleanProducts.length > 0) {
            const remainingPercentage = Math.max(0, 100 - dirtyTotal);
            const redistributedPercentage = Math.floor(remainingPercentage / cleanProducts.length);

            cleanProducts.forEach(symbol => {
                const card = document.querySelector(`.datacard[data-symbol="${symbol}"]`);
                const input = card?.querySelector('.percentage-input');

                if (input) {
                    input.value = redistributedPercentage;
                    BeaconAuthor.state.productPercentages.set(symbol, {
                        percentage: redistributedPercentage,
                        isDirty: false
                    });
                }
            });

            return redistributedPercentage;
        }
        return 0;
    },

    /**
     * Update allocation display with proper styling
     */
    updateAllocationDisplay() {
        const allocationDisplay = document.getElementById('allocationDisplay');
        const allocationPercentage = document.getElementById('allocationPercentage');

        if (!allocationDisplay || !allocationPercentage) return 0;

        const total = this.calculateTotal();
        allocationPercentage.textContent = `${total}%`;

        // Clear previous styling
        allocationDisplay.classList.remove('over-allocated', 'under-allocated', 'perfectly-allocated', 'invalid');

        // Apply appropriate styling
        if (total === 100 && !this.hasZeroPercentProducts()) {
            allocationDisplay.classList.add('perfectly-allocated');
            allocationDisplay.style.background = 'rgba(88, 166, 88, 0.1)';
            allocationDisplay.style.borderColor = '#58a658';
            allocationDisplay.querySelector('span').style.color = '#58a658';
        } else if (total > 100) {
            allocationDisplay.classList.add('over-allocated');
            allocationDisplay.style.background = 'rgba(255, 88, 88, 0.1)';
            allocationDisplay.style.borderColor = '#ff5858';
            allocationDisplay.querySelector('span').style.color = '#ff5858';
        } else {
            allocationDisplay.classList.add('under-allocated');
            allocationDisplay.style.background = 'rgba(255, 165, 88, 0.1)';
            allocationDisplay.style.borderColor = '#ffa558';
            allocationDisplay.querySelector('span').style.color = '#ffa558';
        }

        // Update generate button state
        BeaconAuthor.modules.UIManager.updateGenerateButtonState();
        return total;
    }
};
