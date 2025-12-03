/**
 * Professional UI Components for Beacon HFT Platform
 * Reusable, accessible, and maintainable UI components
 */

export class SymbolCardComponent {
    constructor(symbolData, callbacks = {}) {
        this.symbolData = symbolData;
        this.callbacks = callbacks;
        this.element = null;
        this.isCollapsed = false;
    }

    render() {
        const card = document.createElement('div');
        card.className = 'symbol-card';
        card.setAttribute('data-symbol', this.symbolData.name);
        card.setAttribute('role', 'region');
        card.setAttribute('aria-label', `Symbol configuration for ${this.symbolData.name}`);

        card.innerHTML = `
            <div class="card-header" role="button" tabindex="0" aria-expanded="true">
                <div class="header-controls">
                    <div class="symbol-header">
                        <div class="symbol-name">${this.symbolData.name}</div>
                        <div class="symbol-percentage-edit">
                            <input 
                                type="number" 
                                class="percentage-input" 
                                value="${this.symbolData.percentage}" 
                                min="0.1" 
                                max="100" 
                                step="0.1"
                                aria-label="Percentage allocation for ${this.symbolData.name}"
                            >
                            <span class="percentage-symbol">%</span>
                        </div>
                    </div>
                </div>
                <div class="header-actions">
                    <span class="collapse-toggle" aria-hidden="true">▼</span>
                    <button 
                        class="symbol-remove-btn" 
                        aria-label="Remove ${this.symbolData.name} symbol"
                        title="Remove symbol"
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
                                           min="${this.symbolData.priceRange.min}" 
                                           max="${this.symbolData.priceRange.max}" 
                                           value="${this.symbolData.priceRange.min}"
                                           step="0.01">
                                    <input type="range" 
                                           class="dual-range-slider price-max" 
                                           min="${this.symbolData.priceRange.min}" 
                                           max="${this.symbolData.priceRange.max}" 
                                           value="${this.symbolData.priceRange.max}"
                                           step="0.01">
                                    <div class="dual-range-values">
                                        <span class="min-value">$${this.symbolData.priceRange.min}</span>
                                        <span class="max-value">$${this.symbolData.priceRange.max}</span>
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
                                       value="${this.symbolData.priceRange.weight}">
                                <div class="range-display">${this.symbolData.priceRange.weight}</div>
                            </div>
                        </div>
                        <div class="paired-controls">
                            <div class="grid-field">
                                <span class="detail-label">Quantity Range</span>
                                <div class="dual-range-container">
                                    <input type="range" 
                                           class="dual-range-slider qty-min" 
                                           min="${this.symbolData.quantityRange.min}" 
                                           max="${this.symbolData.quantityRange.max}" 
                                           value="${this.symbolData.quantityRange.min}">
                                    <input type="range" 
                                           class="dual-range-slider qty-max" 
                                           min="${this.symbolData.quantityRange.min}" 
                                           max="${this.symbolData.quantityRange.max}" 
                                           value="${this.symbolData.quantityRange.max}">
                                    <div class="dual-range-values">
                                        <span class="min-value">${this.symbolData.quantityRange.min}</span>
                                        <span class="max-value">${this.symbolData.quantityRange.max}</span>
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
                                       value="${this.symbolData.quantityRange.weight}">
                                <div class="range-display">${this.symbolData.quantityRange.weight}</div>
                            </div>
                        </div>
                    </div>
                    <div class="vertical-separator"></div>
                    <div class="spread-volume-grid">
                        <div class="grid-field">
                            <span class="detail-label">Spread %</span>
                            <input type="number" 
                                   class="form-input spread-input" 
                                   value="${this.symbolData.spreadPercentage}" 
                                   min="0.01" 
                                   max="10" 
                                   step="0.01">
                        </div>
                        <div class="grid-field">
                            <span class="detail-label">Trade Prob</span>
                            <input type="number" 
                                   class="form-input trade-prob-input" 
                                   value="${this.symbolData.tradeProbability}" 
                                   min="0.01" 
                                   max="1.0" 
                                   step="0.01">
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.element = card;
        this.attachEventListeners();
        return card;
    }

    attachEventListeners() {
        if (!this.element) return;

        // Collapse/expand functionality
        const header = this.element.querySelector('.card-header');
        header.addEventListener('click', (e) => {
            if (!e.target.matches('button, input')) {
                this.toggleCollapse();
            }
        });

        // Remove button
        const removeBtn = this.element.querySelector('.symbol-remove-btn');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.callbacks.onRemove) {
                this.callbacks.onRemove(this.symbolData.name);
            }
        });

        // Value change handlers
        const percentageInput = this.element.querySelector('.percentage-input');
        percentageInput.addEventListener('change', (e) => {
            const value = parseFloat(e.target.value);
            if (this.callbacks.onPercentageChange) {
                this.callbacks.onPercentageChange(this.symbolData.name, value);
            }
        });

        // Range sliders and other inputs would have similar professional event handling
        this.attachRangeSliderListeners();
    }

    attachRangeSliderListeners() {
        // Professional dual-range slider handling
        const priceMinSlider = this.element.querySelector('.price-min');
        const priceMaxSlider = this.element.querySelector('.price-max');
        
        if (priceMinSlider && priceMaxSlider) {
            [priceMinSlider, priceMaxSlider].forEach(slider => {
                slider.addEventListener('input', () => this.updateDualRange('price'));
            });
        }

        // Similar for quantity sliders
        const qtyMinSlider = this.element.querySelector('.qty-min');
        const qtyMaxSlider = this.element.querySelector('.qty-max');
        
        if (qtyMinSlider && qtyMaxSlider) {
            [qtyMinSlider, qtyMaxSlider].forEach(slider => {
                slider.addEventListener('input', () => this.updateDualRange('qty'));
            });
        }
    }

    updateDualRange(type) {
        const minSlider = this.element.querySelector(`.${type}-min`);
        const maxSlider = this.element.querySelector(`.${type}-max`);
        const minValue = this.element.querySelector(`.${type}-qty-grid .min-value`);
        const maxValue = this.element.querySelector(`.${type}-qty-grid .max-value`);

        if (minSlider && maxSlider) {
            const min = parseFloat(minSlider.value);
            const max = parseFloat(maxSlider.value);

            // Ensure min <= max
            if (min >= max) {
                minSlider.value = max - (type === 'price' ? 0.01 : 1);
            }
            if (max <= min) {
                maxSlider.value = min + (type === 'price' ? 0.01 : 1);
            }

            // Update display values
            if (minValue) minValue.textContent = type === 'price' ? `$${minSlider.value}` : minSlider.value;
            if (maxValue) maxValue.textContent = type === 'price' ? `$${maxSlider.value}` : maxSlider.value;

            // Notify parent of changes
            if (this.callbacks.onRangeChange) {
                this.callbacks.onRangeChange(this.symbolData.name, type, {
                    min: parseFloat(minSlider.value),
                    max: parseFloat(maxSlider.value)
                });
            }
        }
    }

    toggleCollapse() {
        this.isCollapsed = !this.isCollapsed;
        const content = this.element.querySelector('.card-content');
        const toggle = this.element.querySelector('.collapse-toggle');
        const header = this.element.querySelector('.card-header');

        if (this.isCollapsed) {
            this.element.classList.add('collapsed');
            toggle.textContent = '▶';
            header.setAttribute('aria-expanded', 'false');
        } else {
            this.element.classList.remove('collapsed');
            toggle.textContent = '▼';
            header.setAttribute('aria-expanded', 'true');
        }
    }

    updateData(newData) {
        this.symbolData = { ...this.symbolData, ...newData };
        // Re-render specific parts that changed
        this.updateDisplayValues();
    }

    updateDisplayValues() {
        // Update percentage
        const percentageInput = this.element.querySelector('.percentage-input');
        if (percentageInput) {
            percentageInput.value = this.symbolData.percentage;
        }

        // Update ranges
        this.updateDualRange('price');
        this.updateDualRange('qty');
    }

    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
        this.callbacks = null;
    }
}
