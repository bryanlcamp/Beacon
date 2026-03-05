/**
 * Author App Main Entry Point
 * Coordinates all modules and initializes the application
 */

class AuthorApp {
    constructor() {
        this.symbolManager = null;
        this.portfolioControls = null;
        this.initialized = false;
    }

    async init() {
        console.log('🚀 Author App Starting...');

        try {
            // Wait for components to be ready
            await this.waitForComponents();

            // Initialize core modules
            await this.initializeModules();

            // Set up app-level event handlers
            this.setupEventHandlers();

            this.initialized = true;
            console.log('✅ Author App initialized successfully');

        } catch (error) {
            console.error('❌ Author App initialization failed:', error);
        }
    }

    async waitForComponents() {
        return new Promise((resolve) => {
            if (document.getElementById('symbolInput') && document.getElementById('togglePortfolioParams')) {
                resolve();
            } else {
                document.addEventListener('componentsReady', () => resolve());
            }
        });
    }

    async initializeModules() {
        // Initialize Symbol Manager
        this.symbolManager = new SymbolManager();

        // Initialize Portfolio Controls
        this.portfolioControls = new PortfolioControls();

        // Make globally accessible for debugging/external access
        window.symbolManager = this.symbolManager;
        window.portfolioControls = this.portfolioControls;
    }

    setupEventHandlers() {
        // Listen for custom events from modules
        document.addEventListener('symbolAdded', (e) => {
            console.log('📊 Symbol added:', e.detail.symbol);
            this.updateAllocation();
        });

        document.addEventListener('symbolRemoved', (e) => {
            console.log('🗑️ Symbol removed:', e.detail.symbol);
            this.updateAllocation();
        });

        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.initialized) {
                this.refreshView();
            }
        });
    }

    updateAllocation() {
        // Calculate allocation percentage based on added symbols
        const symbols = this.symbolManager?.getSymbols() || [];
        const allocation = Math.min(100, symbols.length * 20); // 20% per symbol max

        const allocationElement = document.getElementById('allocationStatus');
        const allocationBox = document.getElementById('allocationStatusBox');

        if (allocationElement && allocationBox) {
            allocationElement.textContent = `${allocation}%`;

            // Update color based on allocation
            if (allocation === 100) {
                allocationBox.style.borderColor = 'rgba(34, 197, 94, 0.3)';
                allocationBox.style.background = 'rgba(34, 197, 94, 0.1)';
                allocationBox.style.color = '#22c55e';
            } else if (allocation > 0) {
                allocationBox.style.borderColor = 'rgba(251, 191, 36, 0.3)';
                allocationBox.style.background = 'rgba(251, 191, 36, 0.1)';
                allocationBox.style.color = '#fbbf24';
            } else {
                allocationBox.style.borderColor = 'rgba(255, 88, 88, 0.3)';
                allocationBox.style.background = 'rgba(255, 88, 88, 0.1)';
                allocationBox.style.color = '#ff5858';
            }
        }

        // Update file size estimate
        const fileSizeElement = document.getElementById('detailFileSize');
        if (fileSizeElement) {
            const estimatedSize = Math.max(64, symbols.length * 45); // KB estimate
            fileSizeElement.textContent = `~${estimatedSize} KB`;
        }
    }

    refreshView() {
        // Refresh data and UI state
        this.updateAllocation();

        if (this.portfolioControls) {
            // Re-sync any range inputs
            this.portfolioControls.setupRangeInputSync();
        }
    }

    // Public API methods
    addSymbol(symbol, exchange = 'CME') {
        return this.symbolManager?.addSymbol?.(symbol, exchange);
    }

    getPortfolioConfig() {
        return {
            symbols: this.symbolManager?.getSymbols?.() || [],
            params: this.portfolioControls?.getPortfolioParams?.() || {}
        };
    }

    setPortfolioConfig(config) {
        if (config.params && this.portfolioControls) {
            this.portfolioControls.setPortfolioParams(config.params);
        }
    }
}

// Initialize app when ready
const authorApp = new AuthorApp();

if (document.readyState === 'complete') {
    authorApp.init();
} else {
    document.addEventListener('DOMContentLoaded', () => authorApp.init());
}

// Export for global access
window.authorApp = authorApp;
