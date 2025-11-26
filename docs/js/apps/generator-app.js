/**
 * Generator Application
 * Clean, scalable architecture using state management and reactive components
 */

import { Component } from '../core/component.js';
import { ApplicationState, createValidationMiddleware, createLoggingMiddleware } from '../core/state.js';
import { ValidationSchema, validators } from '../core/validation.js';

export class GeneratorApp extends Component {
    constructor() {
        super('generator-container', {
            totalMessages: 10000,
            outputFormat: 'nsdq',
            symbols: new Map(),
            ui: {
                addSymbolEnabled: true,
                saveEnabled: false,
                runEnabled: false,
                percentageRemaining: 100,
                percentageStatus: 'remaining'
            }
        });

        // Disable automatic re-rendering to prevent infinite loops
        this.shouldAutoRender = false;
        
        this.setupValidation();
        this.setupControls();
        
        // Initial render
        this.render();
    }

    /**
     * Set up validation schema and middleware
     */
    setupValidation() {
        // Create validation schema
        this.validationSchema = new ValidationSchema({
            totalMessages: validators.required()
                .and(validators.number(1000, 999999999)),
                
            outputFormat: validators.required(),
            
            symbols: validators.custom((symbols) => {
                if (symbols.size === 0) {
                    return 'At least one symbol is required';
                }
                
                // Validate each symbol
                for (const [symbol, data] of symbols) {
                    const symbolResult = validators.symbol().validate(symbol);
                    if (symbolResult !== true) return symbolResult;
                    
                    const percentResult = validators.percentage().validate(data.percentage);
                    if (percentResult !== true) return `${symbol}: ${percentResult}`;
                }
                
                // Check percentage total
                const total = Array.from(symbols.values())
                    .reduce((sum, data) => sum + data.percentage, 0);
                    
                if (Math.abs(total - 100) > 0.01) {
                    if (total < 100) {
                        return `Percentages total ${total.toFixed(1)}% - need ${(100 - total).toFixed(1)}% more`;
                    } else {
                        return `Percentages total ${total.toFixed(1)}% - ${(total - 100).toFixed(1)}% over limit`;
                    }
                }
                
                return true;
            })
        });

        // Add validation middleware
        this.state.use(createValidationMiddleware({
            totalMessages: (value) => this.validationSchema.rules.get('totalMessages').validate(value),
            outputFormat: (value) => this.validationSchema.rules.get('outputFormat').validate(value)
        }));

        // Add logging middleware (only in development)
        if (window.location.hostname === 'localhost') {
            this.state.use(createLoggingMiddleware({ logLevel: 'debug' }));
        }
    }

    /**
     * Set up control event handlers
     */
    setupControls() {
        // Total Messages input
        const totalMessagesInput = document.getElementById('totalMessages');
        if (totalMessagesInput) {
            totalMessagesInput.addEventListener('input', (e) => {
                const value = parseInt(e.target.value) || 0;
                try {
                    this.setState({ totalMessages: value });
                } catch (error) {
                    this.showFieldError('totalMessages', error.message);
                }
            });
        }

        // Output Format select
        const outputFormatSelect = document.getElementById('outputFormat');
        if (outputFormatSelect) {
            outputFormatSelect.addEventListener('change', (e) => {
                this.setState({ outputFormat: e.target.value });
            });
        }

        // Add Symbol button
        const addSymbolBtn = document.getElementById('addSymbolBtn');
        if (addSymbolBtn) {
            console.log('Add Symbol button found, setting up event listener');
            addSymbolBtn.addEventListener('click', (e) => {
                console.log('Add Symbol clicked');
                e.preventDefault();
                this.addSymbol();
            });
        } else {
            console.error('Add Symbol button not found');
        }

        // Save and Run buttons
        const saveBtn = document.getElementById('saveDatasetBtn');
        const runBtn = document.getElementById('runDatasetBtn');
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveConfiguration());
        }
        
        if (runBtn) {
            runBtn.addEventListener('click', () => this.runGenerator());
        }
    }

    /**
     * Render component based on current state
     */
    render() {
        // Prevent render loops during initialization
        if (this._isRendering) return;
        this._isRendering = true;
        
        try {
            const state = this.getState();
            const validation = this.validateState();
            
            // Update DOM elements only (NO state changes in render!)
            this.updatePercentageIndicator();
            this.updateButtonStates();
            this.updateFieldErrors(validation.errorMap);
            
            console.log('Rendered successfully');
        } finally {
            this._isRendering = false;
        }
    }

    /**
     * Validate current state
     */
    validateState() {
        // Safety check: if validation schema isn't ready yet, return valid
        if (!this.validationSchema) {
            return { isValid: true, errors: {}, errorMap: new Map() };
        }
        
        const state = this.getState();
        return this.validationSchema.validate(state);
    }

    /**
     * Update UI state based on validation results
     */
    updateUIState(validation) {
        const state = this.getState();
        const { symbols } = state;
        
        // Calculate percentage metrics
        const percentageTotal = Array.from(symbols.values())
            .reduce((sum, data) => sum + data.percentage, 0);
        const percentageRemaining = 100 - percentageTotal;
        
        // Determine status
        let percentageStatus;
        if (Math.abs(percentageTotal - 100) < 0.01) {
            percentageStatus = 'complete';
        } else if (percentageRemaining > 0) {
            percentageStatus = 'remaining';
        } else {
            percentageStatus = 'over';
        }

        // Calculate new UI state
        const newUIState = {
            addSymbolEnabled: percentageRemaining > 0,
            saveEnabled: symbols.size > 0,
            runEnabled: validation.isValid && symbols.size > 0,
            percentageRemaining: Math.abs(percentageRemaining),
            percentageTotal: percentageTotal,
            percentageStatus: percentageStatus
        };

        // Only update state if UI state actually changed (prevent render loops)
        const currentUI = state.ui || {};
        if (JSON.stringify(currentUI) !== JSON.stringify(newUIState)) {
            this.setState({ ui: newUIState });
        }
    }

    /**
     * Update percentage remaining indicator
     */
    updatePercentageIndicator() {
        const indicator = document.getElementById('percentageRemaining');
        if (!indicator) return;

        const { percentageRemaining, percentageStatus } = this.getState().ui;

        switch (percentageStatus) {
            case 'complete':
                indicator.textContent = '✓ 100% allocated';
                indicator.style.color = '#00ff64';
                break;
            case 'remaining':
                indicator.textContent = `${percentageRemaining.toFixed(1)}% remaining`;
                indicator.style.color = 'rgba(255, 255, 255, 0.7)';
                break;
            case 'over':
                indicator.textContent = `${percentageRemaining.toFixed(1)}% over limit!`;
                indicator.style.color = '#ff4444';
                break;
        }
    }

    /**
     * Update button states based on UI state
     */
    updateButtonStates() {
        const { addSymbolEnabled, saveEnabled, runEnabled } = this.getState().ui;

        const addBtn = document.getElementById('addSymbolBtn');
        const saveBtn = document.getElementById('saveDatasetBtn');
        const runBtn = document.getElementById('runDatasetBtn');

        if (addBtn) {
            addBtn.disabled = !addSymbolEnabled;
            addBtn.style.opacity = addSymbolEnabled ? '1' : '0.5';
        }

        if (saveBtn) {
            saveBtn.disabled = !saveEnabled;
            saveBtn.style.opacity = saveEnabled ? '1' : '0.5';
        }

        if (runBtn) {
            runBtn.disabled = !runEnabled;
            runBtn.style.opacity = runEnabled ? '1' : '0.5';
        }
    }

    /**
     * Update field error states
     */
    updateFieldErrors(errorMap) {
        // Total Messages field
        const totalMessagesInput = document.getElementById('totalMessages');
        if (totalMessagesInput) {
            if (errorMap.has('totalMessages')) {
                this.showFieldError('totalMessages', errorMap.get('totalMessages'));
            } else {
                this.clearFieldError('totalMessages');
            }
        }
    }

    /**
     * Show field error
     */
    showFieldError(fieldName, message) {
        const input = document.getElementById(fieldName);
        if (input) {
            input.style.borderColor = '#ff4444';
            input.title = message;
        }
    }

    /**
     * Clear field error
     */
    clearFieldError(fieldName) {
        const input = document.getElementById(fieldName);
        if (input) {
            input.style.borderColor = '';
            input.title = '';
        }
    }

    /**
     * Add new symbol
     */
    addSymbol() {
        console.log('addSymbol() called');
        
        const symbol = this.promptForSymbol();
        console.log('Prompted symbol:', symbol);
        
        if (!symbol) return;

        const state = this.getState();
        const { symbols } = state;

        // Check if symbol already exists
        if (symbols.has(symbol.toUpperCase())) {
            alert(`Symbol ${symbol.toUpperCase()} already exists`);
            return;
        }

        // Calculate smart default percentage
        const currentTotal = Array.from(symbols.values()).reduce((sum, data) => sum + data.percentage, 0);
        const percentageRemaining = 100 - currentTotal;
        const defaultPercentage = Math.min(20, Math.max(0, percentageRemaining));
        
        console.log(`Adding symbol ${symbol} with ${defaultPercentage}% (${percentageRemaining}% remaining)`);

        // Add to state AND update UI state together
        const newSymbols = new Map(symbols);
        newSymbols.set(symbol.toUpperCase(), {
            symbol: symbol.toUpperCase(),
            percentage: defaultPercentage
        });

        // Calculate new UI state
        const newTotal = currentTotal + defaultPercentage;
        const newRemaining = 100 - newTotal;
        
        this.setState({ 
            symbols: newSymbols,
            ui: {
                ...state.ui,
                addSymbolEnabled: newRemaining > 0,
                saveEnabled: true,
                runEnabled: newSymbols.size > 0,
                percentageRemaining: Math.abs(newRemaining),
                percentageTotal: newTotal,
                percentageStatus: newRemaining > 0 ? 'remaining' : (Math.abs(newRemaining) < 0.01 ? 'complete' : 'over')
            }
        });

        // Create DOM element
        this.createSymbolElement(symbol.toUpperCase(), defaultPercentage);
        
        // Manual render after state change
        this.render();
        
        console.log('Symbol added successfully');
    }

    /**
     * Remove symbol
     */
    removeSymbol(symbol) {
        if (confirm(`Remove ${symbol} symbol?`)) {
            const state = this.getState();
            const newSymbols = new Map(state.symbols);
            newSymbols.delete(symbol.toUpperCase());

            this.setState({ symbols: newSymbols });

            // Remove DOM element
            const element = document.querySelector(`[data-symbol="${symbol.toUpperCase()}"]`);
            if (element) {
                element.remove();
            }
        }
    }

    /**
     * Update symbol percentage
     */
    updateSymbolPercentage(symbol, percentage) {
        const state = this.getState();
        const newSymbols = new Map(state.symbols);
        const symbolData = newSymbols.get(symbol.toUpperCase());
        
        if (symbolData) {
            symbolData.percentage = percentage;
            this.setState({ symbols: newSymbols });
        }
    }

    /**
     * Create symbol DOM element
     */
    createSymbolElement(symbol, percentage) {
        console.log(`Creating symbol element for ${symbol} with ${percentage}%`);
        
        const container = document.getElementById('symbolsContainer');
        if (!container) {
            console.error('symbolsContainer not found!');
            return;
        }

        const panel = this.createElement('div', {
            className: 'symbol-card',
            dataset: { symbol: symbol }
        }, `
            <button class="symbol-remove-btn" title="Remove Symbol">×</button>
            <div class="symbol-name">${symbol}</div>
            <div class="symbol-controls">
                <div class="percentage-input-group">
                    <input type="number" class="percentage-input" value="${percentage}" min="0" max="100" step="0.1">
                    <span class="percentage-symbol">%</span>
                </div>
            </div>
        `);

        console.log('Created panel element:', panel);
        console.log('Panel HTML:', panel.outerHTML);

        // Set up event handlers
        const removeBtn = panel.querySelector('.symbol-remove-btn');
        const percentageInput = panel.querySelector('.percentage-input');

        console.log('Found removeBtn:', removeBtn);
        console.log('Found percentageInput:', percentageInput);

        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                this.removeSymbol(symbol);
            });
        }

        if (percentageInput) {
            percentageInput.addEventListener('input', (e) => {
                const newPercentage = parseFloat(e.target.value) || 0;
                this.updateSymbolPercentage(symbol, newPercentage);
            });
        }

        container.appendChild(panel);
        console.log('Symbol element added to container');
    }

    /**
     * Prompt for symbol name
     */
    promptForSymbol() {
        const symbol = prompt('Enter symbol (e.g., AAPL, MSFT):');
        if (!symbol) return null;

        const cleaned = symbol.toUpperCase().trim();
        const validation = validators.symbol().validate(cleaned);
        
        if (validation !== true) {
            alert(validation);
            return null;
        }

        return cleaned;
    }

    /**
     * Save configuration
     */
    saveConfiguration() {
        const validation = this.validateState();
        
        if (!validation.isValid) {
            alert(`Cannot save: ${Object.values(validation.errors)[0]}`);
            return;
        }

        const config = this.exportConfiguration();
        console.log('Saving configuration:', config);
        
        // TODO: Implement backend save
        alert('Configuration saved successfully!');
    }

    /**
     * Run generator
     */
    runGenerator() {
        const validation = this.validateState();
        
        if (!validation.isValid) {
            alert(`Cannot run: ${Object.values(validation.errors)[0]}`);
            return;
        }

        const config = this.exportConfiguration();
        console.log('Running generator with config:', config);
        
        // TODO: Implement backend execution
        alert('Generator started successfully!');
    }

    /**
     * Export current configuration
     */
    exportConfiguration() {
        const state = this.getState();
        const { totalMessages, outputFormat, symbols } = state;

        return {
            totalMessages,
            outputFormat,
            symbols: Array.from(symbols.values()),
            timestamp: new Date().toISOString()
        };
    }
}