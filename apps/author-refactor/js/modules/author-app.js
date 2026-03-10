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
            // Check for all required elements including datacardContainer
            if (document.getElementById('symbolInput') &&
                document.getElementById('togglePortfolioParams') &&
                document.getElementById('datacardContainer')) {
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
        // Demo mode: keep Generate always disabled, enable tooltip hover
        this.isDemoMode = !!document.getElementById('demo-banner');

        // Setup header tooltips (duration + allocation)
        this.setupHeaderTooltips();

        // Listen for custom events from modules
        document.addEventListener('symbolAdded', (e) => {
            console.log('📊 Symbol added:', e.detail.symbol);
            this.updateAllocation();
        });

        document.addEventListener('symbolRemoved', (e) => {
            console.log('🗑️ Symbol removed:', e.detail.symbol);
            this.updateAllocation();
        });

        document.addEventListener('allocationChanged', () => {
            this.updateAllocation();
        });

        // Listen for duration changes to revalidate
        const durationPicker = document.getElementById('durationPicker');
        if (durationPicker) {
            const revalidate = () => this.validateGenerate();
            durationPicker.addEventListener('input', revalidate);
            durationPicker.addEventListener('change', revalidate);
            durationPicker.addEventListener('keyup', revalidate);
        }

        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.initialized) {
                this.refreshView();
            }
        });
    }

    updateAllocation() {
        // Sum actual percentage values from all datacards
        const percentageInputs = document.querySelectorAll('.datacard[data-symbol] .percentage-input-hidden');
        let allocation = 0;
        percentageInputs.forEach(input => {
            const val = parseFloat(input.value);
            if (!isNaN(val)) allocation += val;
        });
        allocation = Math.round(allocation * 10) / 10;

        const allocationElement = document.getElementById('allocationStatus');
        const remainingElement = document.getElementById('allocationRemaining');
        const allocationLabel = document.getElementById('allocationLabel');

        if (allocationElement) {
            allocationElement.textContent = `${allocation}%`;

            // Update label and remaining value based on state
            const remaining = Math.round((100 - allocation) * 10) / 10;

            if (allocation === 100) {
                // Perfect
                if (allocationLabel) allocationLabel.textContent = 'DONE';
                if (remainingElement) {
                    remainingElement.textContent = '0%';
                    remainingElement.style.color = '#58a658';
                }
            } else if (allocation > 100) {
                // Over-allocated
                const over = Math.round((allocation - 100) * 10) / 10;
                if (allocationLabel) allocationLabel.textContent = 'OVER';
                if (remainingElement) {
                    remainingElement.textContent = `${over}%`;
                    remainingElement.style.color = '#ffa558';
                }
            } else {
                // Under-allocated
                if (allocationLabel) allocationLabel.textContent = 'REMAINS';
                if (remainingElement) {
                    remainingElement.textContent = `${remaining}%`;
                    remainingElement.style.color = '#ff5858';
                }
            }

            // Remove existing state classes
            allocationElement.classList.remove('under-allocated', 'approaching-target', 'perfectly-allocated', 'over-allocated');

            // Update product count
            const productCountElement = document.getElementById('allocationProductCount');
            if (productCountElement) {
                const symbols = this.symbolManager?.getSymbols?.() || [];
                productCountElement.textContent = symbols.length;
            }

            // Apply new state class based on percentage
            if (allocation === 100) {
                allocationElement.classList.add('perfectly-allocated');
            } else if (allocation > 100) {
                allocationElement.classList.add('over-allocated');
            } else if (allocation >= 80) {
                allocationElement.classList.add('approaching-target');
            } else {
                allocationElement.classList.add('under-allocated');
            }
        }

        // Validate Generate button
        this.validateGenerate();

        // Update file size estimate based on message count (not time)
        const fileSizeElement = document.getElementById('detailFileSize');

        if (fileSizeElement) {

// EXACT message specifications - Author creates precise message counts
            const exchangeSpecs = {
                'CME': {
                    bytesPerMessage: 72,     // CME iLink3 ExecutionReport_Trade (exact spec)
                    messagesPerSymbol: 1000  // Default: 1000 messages per symbol
                },
                'NYSE': {
                    bytesPerMessage: 118,    // NYSE Pillar Trade message (exact spec)
                    messagesPerSymbol: 1000  // Default: 1000 messages per symbol
                },
                'NASDAQ': {
                    bytesPerMessage: 44,     // NASDAQ ITCH Trade message (exact spec)
                    messagesPerSymbol: 1000  // Default: 1000 messages per symbol
                }
            };

            // Calculate total file size: symbols × message_count × bytes_per_message
            const symbols = this.symbolManager?.getSymbols?.() || [];
            let totalBytes = 0;
            symbols.forEach(symbolData => {
                const exchange = symbolData.exchange || 'CME';
                const spec = exchangeSpecs[exchange] || exchangeSpecs['CME'];

                // Author creates EXACT number of messages, not rate-based
                const messagesForSymbol = spec.messagesPerSymbol;
                const bytesForSymbol = messagesForSymbol * spec.bytesPerMessage;
                totalBytes += bytesForSymbol;
            });

            // Smart rounding: ceil so we never underestimate, precision decreases as size grows
            let fileSize, unit;
            if (totalBytes < 1024) {
                fileSize = totalBytes;
                unit = 'B';
            } else if (totalBytes < 1024 * 1024) {
                fileSize = Math.ceil(totalBytes / 1024);
                unit = 'KB';
            } else if (totalBytes < 1024 * 1024 * 1024) {
                let mb = totalBytes / (1024 * 1024);
                if (mb < 10)       fileSize = Math.ceil(mb * 100) / 100;   // 2.47 MB
                else if (mb < 100) fileSize = Math.ceil(mb * 10) / 10;     // 47.3 MB
                else               fileSize = Math.ceil(mb);               // 847 MB
                unit = 'MB';
            } else {
                let gb = totalBytes / (1024 * 1024 * 1024);
                if (gb < 10)       fileSize = Math.ceil(gb * 100) / 100;   // 1.47 GB
                else if (gb < 100) fileSize = Math.ceil(gb * 10) / 10;     // 47.3 GB
                else               fileSize = Math.ceil(gb);               // 847 GB
                unit = 'GB';
            }

            fileSizeElement.textContent = `${fileSize} ${unit}`;
            // Orange warning when file size >= 1 GB, blue otherwise
            fileSizeElement.style.color = (totalBytes >= 1024 * 1024 * 1024)
                ? '#ffa558'
                : 'rgba(107, 182, 255, 0.8)';
        }
    }

    setupDemoModeGenerate() {
        const container = document.getElementById('generateTooltipContainer');
        const tooltip = document.getElementById('generateDemoTooltip');
        if (!container || !tooltip) return;

        container.addEventListener('mouseenter', () => {
            const rect = container.getBoundingClientRect();
            tooltip.style.position = 'fixed';
            tooltip.style.top = (rect.bottom + 8) + 'px';
            tooltip.style.left = (rect.left + rect.width / 2) + 'px';
            tooltip.style.transform = 'translateX(-50%)';
            tooltip.style.visibility = 'visible';
            tooltip.style.opacity = '1';
        });

        container.addEventListener('mouseleave', () => {
            tooltip.style.visibility = 'hidden';
            tooltip.style.opacity = '0';
        });
    }

    setupHeaderTooltips() {
        const pairs = [
            ['durationTooltipContainer', 'durationTooltip'],
            ['allocationTooltipContainer', 'allocationTooltip'],
            ['demo-banner', 'demoBannerTooltip']
        ];
        pairs.forEach(([containerId, tooltipId]) => {
            const container = document.getElementById(containerId);
            const tooltip = document.getElementById(tooltipId);
            if (!container || !tooltip) return;

            container.addEventListener('mouseenter', () => {
                const rect = container.getBoundingClientRect();
                tooltip.style.position = 'fixed';
                tooltip.style.top = (rect.bottom + 8) + 'px';
                if (containerId === 'demo-banner') {
                    tooltip.style.left = (rect.left + 16) + 'px';
                    tooltip.style.width = '420px';
                    tooltip.style.transform = 'none';
                } else {
                    tooltip.style.left = (rect.left + rect.width / 2) + 'px';
                    tooltip.style.transform = 'translateX(-50%)';
                }
                tooltip.style.visibility = 'visible';
                tooltip.style.opacity = '1';
            });

            container.addEventListener('mouseleave', () => {
                tooltip.style.visibility = 'hidden';
                tooltip.style.opacity = '0';
            });
        });
    }

    /**
     * Rule-based validation for Generate button.
     * Checks rules in order, first failure disables Generate and shows its message.
     */
    validateGenerate() {
        const generateButton = document.getElementById('generateDataset');
        const tooltip = document.getElementById('generateDemoTooltip');
        const durationPicker = document.getElementById('durationPicker');
        if (!generateButton) return;

        // Get current state
        const symbols = this.symbolManager?.getSymbols?.() || [];
        const percentageInputs = document.querySelectorAll('.datacard[data-symbol] .percentage-input-hidden');
        let allocation = 0;
        percentageInputs.forEach(input => {
            const val = parseFloat(input.value);
            if (!isNaN(val)) allocation += val;
        });
        allocation = Math.round(allocation * 10) / 10;

        const durationValue = durationPicker ? durationPicker.value : '00:00:01';
        const durationDigits = durationValue.replace(/\D/g, '');
        const isDurationZero = durationDigits === '000000' || durationDigits === '';

        // Style duration input: red if zero, orange if valid
        if (durationPicker) {
            durationPicker.style.color = isDurationZero ? '#ff5858' : '#d97841';
        }

        // Ordered validation rules — first failure wins
        const rules = [
            {
                test: () => !this.isDemoMode,
                message: 'Datasets cannot be generated in Demo Mode.'
            },
            {
                test: () => symbols.length > 0,
                message: 'Add at least one symbol to generate a dataset.'
            },
            {
                test: () => !isDurationZero,
                message: 'Trading duration must be greater than 00:00:00.'
            },
            {
                test: () => allocation === 100,
                message: allocation > 100
                    ? `Allocation is ${allocation}% — must equal exactly 100%.`
                    : `Allocation is ${allocation}% — must equal exactly 100%.`
            }
        ];

        // Find first failing rule
        let failMessage = null;
        for (const rule of rules) {
            if (!rule.test()) {
                failMessage = rule.message;
                break;
            }
        }

        const isReady = failMessage === null;

        generateButton.disabled = !isReady;

        if (isReady) {
            generateButton.classList.remove('btn-disabled');
            generateButton.style.background = 'rgba(107, 182, 255, 0.8)';
            generateButton.style.borderColor = 'rgba(107, 182, 255, 0.8)';
            generateButton.style.color = 'white';
            generateButton.style.cursor = 'pointer';
        } else {
            generateButton.classList.add('btn-disabled');
            generateButton.style.background = 'rgba(107, 182, 255, 0.2)';
            generateButton.style.borderColor = 'rgba(107, 182, 255, 0.3)';
            generateButton.style.color = 'rgba(107, 182, 255, 0.6)';
            generateButton.style.cursor = 'not-allowed';
        }

        // Update tooltip with the reason
        if (tooltip) {
            const msgEl = tooltip.querySelector('p');
            if (msgEl) {
                msgEl.textContent = failMessage || 'Ready to generate dataset.';
            }
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
