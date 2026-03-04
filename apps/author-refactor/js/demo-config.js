'use strict';

// ============================================================================
// BEACON AUTHOR - DEMO CONFIGURATION MODULE
// ============================================================================

BeaconAuthor.modules.DemoConfig = {
    init() {
        if (BeaconAuthor.config.IS_DEMO_MODE) {
            this.showDemoBanner();
            this.setupDemoData();
        }
    },

    showDemoBanner() {
        const banner = document.getElementById('demo-banner');
        if (banner) {
            banner.style.display = 'block';
        }
    },

    setupDemoData() {
        // Setup validation config for demo mode
        BeaconAuthor.state.validationConfig = {
            fileSystem: {
                exchangeDirectories: {
                    "CME": "./datasets/cme",
                    "NYSE": "./datasets/nyse",
                    "NASDAQ": "./datasets/nsdq"
                },
                fileExtensions: {
                    "CME": ".cme",
                    "NYSE": ".nyse",
                    "NASDAQ": ".nsdq"
                }
            },
            sliderConfig: {
                basePrice: { min: 1, max: 500, step: 0.50, default: 195.50 },
                spread: { min: 0.01, max: 5.0, step: 0.01, default: 0.12 },
                bidPrice: { min: 1, max: 500, step: 0.01, default: 195.44 },
                askPrice: { min: 1, max: 500, step: 0.01, default: 195.56 },
                bidQuantity: { min: 100, max: 50000, step: 100, default: 1500 },
                askQuantity: { min: 100, max: 50000, step: 100, default: 1200 },
                bidWeight: { min: 0, max: 100, step: 1, default: 48 },
                askWeight: { min: 0, max: 100, step: 1, default: 52 },
                volatility: { min: 0, max: 100, step: 1, default: 18 },
                trend: { min: -50, max: 50, step: 1, default: 3 },
                percentage: { min: 0, max: 100, step: 1, default: 0 }
            }
        };
    }
};
