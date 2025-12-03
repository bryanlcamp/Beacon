/**
 * @fileoverview Professional Symbol Data Card Component
 * Preserves the beautiful card layout while providing modern component architecture
 */

import { Component } from '../core/Component.js';

/**
 * Professional Symbol Data Card Component
 * Maintains the beautiful visual design while providing clean component architecture
 */
export class SymbolDataCard extends Component {
    /**
     * @param {Object} options - Component options
     * @param {import('../types/ApplicationTypes.js').SymbolConfig} options.symbolConfig - Symbol configuration
     * @param {Object} options.callbacks - Event callbacks
     */
    constructor(options) {
        super({
            componentName: 'SymbolDataCard',
            initialState: {
                isCollapsed: false,
                isEditing: false,
                symbolConfig: options.symbolConfig,
                validation: { isValid: true, errors: [] }
            }
        });

        /** @type {Object} */
        this.callbacks = options.callbacks || {};
        
        /** @type {string} */
        this.symbolName = options.symbolConfig.symbol;
    }

    /**
     * Initialize the symbol data card
     */
    async init() {
        await super.init();
        
        // Listen for validation events
        this.on('validate', this.handleValidation.bind(this));
        
        // Listen for data changes
        this.on('dataChange', this.handleDataChange.bind(this));
    }

    /**
     * Render the symbol data card with preserved beautiful layout
     * @returns {HTMLElement} The card element
     */
    render() {
        const card = document.createElement('div');
        card.className = 'symbol-card beacon-fade-in';
        card.setAttribute('data-symbol', this.symbolName);
        card.setAttribute('role', 'region');
        card.setAttribute('aria-label', `Symbol configuration for ${this.symbolName}`);

        // Preserve your exact beautiful card HTML structure
        card.innerHTML = this.renderCardContent();
        
        this.element = card;
        this.attachEventHandlers();
        
        return card;
    }

    /**
     * Render the card content preserving your exact layout
     * @private
     * @returns {string} HTML content
     */
    renderCardContent() {
        const { symbolConfig } = this.state;
        
        return `
            <div class="card-header" role="button" tabindex="0" aria-expanded="true">
                <div class="header-controls">
                    <div class="symbol-header">
                        <div class="symbol-name">${symbolConfig.symbol}</div>
                        <div class="symbol-percentage-edit">
                            <input 
                                type="number" 
                                class="percentage-input" 
                                value="${symbolConfig.percentage}" 
                                min="0.1" 
                                max="100" 
                                step="0.1"
                                aria-label="Percentage allocation for ${symbolConfig.symbol}"
                                data-field="percentage"
                            >
                            <span class="percentage-symbol">%</span>
                        </div>
                    </div>
                </div>
                <div class="header-actions">
                    <span class="collapse-toggle" aria-hidden="true">▼</span>
                    <button 
                        class="symbol-remove-btn beacon-btn" 
                        aria-label="Remove ${symbolConfig.symbol} symbol"
                        title="Remove symbol"
                        data-action="remove"
                    >×</button>
                </div>
            </div>
            <div class="card-content">
                <div class="symbol-grids-container">
                    <div class="price-qty-grid">
                        <div class="paired-controls">
                            <div class="grid-field">
                                <span class="detail-label">Price Range</span>
                                <div class="dual-range-container">
                                    <input type="range" 
                                           class="dual-range-slider price-min" 
                                           min="0.01" 
                                           max="1000" 
                                           value="${symbolConfig.priceRange.min}"
                                           step="0.01"
                                           data-field="priceRange.min">
                                    <input type="range" 
                                           class="dual-range-slider price-max" 
                                           min="0.01" 
                                           max="1000" 
                                           value="${symbolConfig.priceRange.max}"
                                           step="0.01"
                                           data-field="priceRange.max">
                                    <div class="dual-range-values">
                                        <span class="min-value">$${symbolConfig.priceRange.min}</span>
                                        <span class="max-value">$${symbolConfig.priceRange.max}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="grid-field">
                                <span class="detail-label">Weight</span>
                                <input type="range" 
                                       class="weight-slider price-weight" 
                                       min="0.1" 
                                       max="2.0" 
                                       step="0.1" 
                                       value="${symbolConfig.priceRange.weight}"
                                       data-field="priceRange.weight">
                                <div class="range-display">${symbolConfig.priceRange.weight}</div>
                            </div>
                        </div>
                        <div class="paired-controls">
                            <div class="grid-field">
                                <span class="detail-label">Quantity Range</span>
                                <div class="dual-range-container">
                                    <input type="range" 
                                           class="dual-range-slider qty-min" 
                                           min="1" 
                                           max="10000" 
                                           value="${symbolConfig.quantityRange.min}"
                                           data-field="quantityRange.min">
                                    <input type="range" 
                                           class="dual-range-slider qty-max" 
                                           min="1" 
                                           max="10000" 
                                           value="${symbolConfig.quantityRange.max}"
                                           data-field="quantityRange.max">
                                    <div class="dual-range-values">
                                        <span class="min-value">${symbolConfig.quantityRange.min}</span>
                                        <span class="max-value">${symbolConfig.quantityRange.max}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="grid-field">
                                <span class="detail-label">Weight</span>
                                <input type="range" 
                                       class="weight-slider qty-weight" 
                                       min="0.1" 
                                       max="2.0" 
                                       step="0.1" 
                                       value="${symbolConfig.quantityRange.weight}"
                                       data-field="quantityRange.weight">
                                <div class="range-display">${symbolConfig.quantityRange.weight}</div>
                            </div>
                        </div>
                    </div>
                    <div class="vertical-separator"></div>
                    <div class="spread-volume-grid">
                        <div class="grid-field">
                            <span class="detail-label">Spread %</span>
                            <input type="number" 
                                   class="beacon-form-input" 
                                   value="${symbolConfig.spreadPercentage}" 
                                   min="0.01" 
                                   max="10" 
                                   step="0.01"
                                   data-field="spreadPercentage">
                        </div>
                        <div class="grid-field">
                            <span class="detail-label">Trade Probability</span>
                            <input type="number" 
                                   class="beacon-form-input" 
                                   value="${symbolConfig.tradeProbability}" 
                                   min="0.01" 
                                   max="1.0" 
                                   step="0.01"
                                   data-field="tradeProbability">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Attach professional event handlers
     * @private
     */
    attachEventHandlers() {
        // Collapse/expand functionality
        const header = this.querySelector('.card-header');
        this.addEventListener('click', (e) => {
            if (!e.target.matches('button, input') && header.contains(e.target)) {
                this.toggleCollapse();
            }
        });

        // Remove button
        const removeBtn = this.querySelector('[data-action="remove"]');
        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleRemove();
            });
        }

        // Input change handlers with professional validation
        const inputs = this.querySelectorAll('input[data-field]');
        inputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.handleInputChange(e.target);
            });
            
            // Real-time updates for range sliders
            if (input.type === 'range') {
                input.addEventListener('input', (e) => {
                    this.handleRangeInput(e.target);
                });
            }
        });
    }

    /**
     * Handle input changes with validation
     * @private
     * @param {HTMLInputElement} input - The changed input
     */
    handleInputChange(input) {
        const field = input.dataset.field;
        const value = this.parseInputValue(input);
        
        // Update state using dot notation
        const newConfig = this.updateNestedProperty(this.state.symbolConfig, field, value);
        
        this.setState({
            symbolConfig: newConfig
        });
        
        // Emit data change event
        this.emit('dataChange', {
            symbol: this.symbolName,
            field,
            value,
            config: newConfig
        });
        
        // Notify parent component
        if (this.callbacks.onDataChange) {
            this.callbacks.onDataChange(this.symbolName, field, value);
        }
    }

    /**
     * Handle range input changes with real-time display updates
     * @private
     * @param {HTMLInputElement} input - The range input
     */
    handleRangeInput(input) {
        const field = input.dataset.field;
        const value = this.parseInputValue(input);
        
        // Update display values immediately
        this.updateRangeDisplay(input, value);
        
        // Update internal state
        const newConfig = this.updateNestedProperty(this.state.symbolConfig, field, value);
        this.setState({ symbolConfig: newConfig });
    }

    // ...existing code continues...
}
