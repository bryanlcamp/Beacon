'use strict';

// ============================================================================
// BEACON AUTHOR - APPLICATION INITIALIZATION
// ============================================================================

BeaconAuthor.init = function() {
    console.log('🚀 Initializing Beacon Author Application v' + this.config.version);

    // Initialize modules in proper order
    this.modules.DemoConfig.init();

    // Setup UI components
    this.modules.UIManager.setupUtilityDropdowns();
    this.modules.UIManager.setupSpinnerFunctionality();

    // Don't initialize existing datacards - start with empty panel
    // this.modules.DatacardManager.initializeAllDatacards();

    // Demo mode specific initialization
    if (this.config.IS_DEMO_MODE) {
        setTimeout(() => {
            // Don't create demo datacards - user will add their own

            // Setup demo generate button
            const generateBtn = document.getElementById('generateDataset');
            if (generateBtn) {
                // Remove existing handlers
                const newBtn = generateBtn.cloneNode(true);
                generateBtn.parentNode.replaceChild(newBtn, generateBtn);

                // Add demo handler
                newBtn.addEventListener('click', (e) => {
                    e.preventDefault();

                    const total = this.modules.PercentageManager.calculateTotal();
                    const hasZeros = this.modules.PercentageManager.hasZeroPercentProducts();

                    if (total === 100 && !hasZeros) {
                        alert('🎯 Demo Preview\n\nDataset configuration is valid!\n\nIn production mode, this would generate real market data files.\n\nCurrent allocation: ' + total + '%');
                    } else {
                        alert('⚠️ Configuration incomplete\n\nTotal allocation: ' + total + '%\nZero allocations: ' + (hasZeros ? 'Yes' : 'No') + '\n\nPlease fix allocation percentages.');
                    }
                });
            }
        }, 200);
    }

    console.log('✅ Beacon Author Application initialized successfully');
};

// ============================================================================
// APPLICATION STARTUP
// ============================================================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => BeaconAuthor.init());
} else {
    BeaconAuthor.init();
}
