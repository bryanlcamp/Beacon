// =============================================================================
// BEACON AUTHOR - MICROSTRUCTURE CONTROLS MODULE
// =============================================================================

export const MicrostructureControls = {

    // Toggle micro-periods dropdown display
    togglePeriodsDropdown(indicator) {
        const datacard = indicator.closest('.datacard');
        const dropdown = datacard.querySelector('.periods-dropdown');
        const type = indicator.getAttribute('data-type');

        // Close all other dropdowns first
        document.querySelectorAll('.periods-dropdown').forEach(d => {
            if (d !== dropdown) {
                d.style.display = 'none';
                d.parentElement.querySelectorAll('.periods-indicator').forEach(ind => {
                    ind.classList.remove('active');
                });
            }
        });

        if (dropdown.style.display === 'none' || !dropdown.style.display) {
            dropdown.style.display = 'block';
            dropdown.setAttribute('data-type', type);
            indicator.classList.add('active');

            // Update dropdown title
            const title = dropdown.querySelector('.dropdown-title');
            title.textContent = type === 'volatility' ? 'Volatility Periods' : 'Trend Periods';

            // Load periods for this type
            this.loadPeriodsForType(dropdown, type);
        } else {
            // Store current periods before closing
            if (dropdown.currentType) {
                this.storePeriods(dropdown, dropdown.currentType);
            }
            dropdown.style.display = 'none';
            indicator.classList.remove('active');

            // Update datacard background after storing
            this.updateDatacardBackground(datacard);
        }
    },

    // Load stored periods for specific type (volatility/trend)
    loadPeriodsForType(dropdown, type) {
        // Store current periods before switching
        if (dropdown.currentType && dropdown.currentType !== type) {
            this.storePeriods(dropdown, dropdown.currentType);
        }

        // Clear content
        const content = dropdown.querySelector('.dropdown-content');
        content.innerHTML = '';

        // Load stored periods for this type
        const datacard = dropdown.closest('.datacard');
        const storageKey = `${type}Periods`;
        if (!datacard[storageKey]) {
            datacard[storageKey] = [];
        }

        datacard[storageKey].forEach(periodData => {
            this.createPeriodFromData(dropdown, type, periodData);
        });

        dropdown.currentType = type;

        // Update count for this specific type only
        this.updatePeriodsCount(dropdown);
        this.updateDatacardBackground(datacard);
    },

    // Store periods data for later retrieval
    storePeriods(dropdown, type) {
        const datacard = dropdown.closest('.datacard');
        const storageKey = `${type}Periods`;
        const periods = [];

        dropdown.querySelectorAll('.micro-period:not(.invalid-range)').forEach(period => {
            const inputs = period.querySelectorAll('.period-range-input');
            const slider = period.querySelector('.range-input');
            const start = parseInt(inputs[0].value);
            const end = parseInt(inputs[1].value);
            const value = parseInt(slider.value);

            if (start > 0 && end > 0 && start <= end) {
                periods.push({ start, end, value });
            }
        });

        datacard[storageKey] = periods;
    },

    // Create period control from stored data
    createPeriodFromData(dropdown, type, data) {
        const content = dropdown.querySelector('.dropdown-content');
        const periodRow = document.createElement('div');
        periodRow.className = 'micro-period';

        const isVolatility = type === 'volatility';
        const valueLabel = isVolatility ? '%' : '';
        const minVal = isVolatility ? '1' : '-50';
        const maxVal = isVolatility ? '100' : '50';
        const displayValue = isVolatility ? `${data.value}%` :
            data.value === 0 ? '0 (Neutral)' :
            data.value > 0 ? `${data.value} (Bullish)` : `${data.value} (Bearish)`;

        periodRow.innerHTML = `
            <div class="period-range">
                <input type="number" class="period-range-input" min="1" max="100" value="${data.start}" placeholder="1">
                <span class="range-separator">-</span>
                <input type="number" class="period-range-input" min="1" max="100" value="${data.end}" placeholder="10">
            </div>
            <div class="period-value">
                <input type="range" class="range-input" min="${minVal}" max="${maxVal}" value="${data.value}">
                <span class="period-value-display">${displayValue}</span>
            </div>
            <button class="remove-micro-period" onclick="removeMicroPeriod(this)">×</button>
        `;

        content.appendChild(periodRow);
        this.setupPeriodEventListeners(periodRow, dropdown, isVolatility);
    },

    // Add new micro period control
    addMicroPeriod(button) {
        const dropdown = button.closest('.periods-dropdown');
        const content = dropdown.querySelector('.dropdown-content');
        const type = dropdown.getAttribute('data-type');

        const periodRow = document.createElement('div');
        periodRow.className = 'micro-period';

        const isVolatility = type === 'volatility';
        const valueLabel = isVolatility ? '%' : '';
        const minVal = isVolatility ? '1' : '-50';
        const maxVal = isVolatility ? '100' : '50';
        const defaultVal = isVolatility ? '50' : '0';
        const defaultDisplay = isVolatility ? '50%' : '0 (Neutral)';

        // Get smart range suggestion
        const suggestedRange = this.getNextValidRange(dropdown);

        periodRow.innerHTML = `
            <div class="period-range">
                <input type="number" class="period-range-input" min="1" max="100" value="${suggestedRange.start}" placeholder="1">
                <span class="range-separator">-</span>
                <input type="number" class="period-range-input" min="1" max="100" value="${suggestedRange.end}" placeholder="10">
            </div>
            <div class="period-value">
                <input type="range" class="range-input" min="${minVal}" max="${maxVal}" value="${defaultVal}">
                <span class="period-value-display">${defaultDisplay}</span>
            </div>
            <button class="remove-micro-period" onclick="removeMicroPeriod(this)">×</button>
        `;

        content.appendChild(periodRow);
        this.setupPeriodEventListeners(periodRow, dropdown, isVolatility);

        // Update the count and validate ranges
        setTimeout(() => {
            this.validatePeriodRanges(dropdown);
            this.updatePeriodsCount(dropdown);
        }, 50);
    },

    // Remove micro period control
    removeMicroPeriod(button) {
        const dropdown = button.closest('.periods-dropdown');
        const datacard = dropdown.closest('.datacard');
        button.closest('.micro-period').remove();
        this.validatePeriodRanges(dropdown);
        this.updatePeriodsCount(dropdown);

        // Store updated periods and update background
        if (dropdown.currentType) {
            this.storePeriods(dropdown, dropdown.currentType);
        }
        this.updateDatacardBackground(datacard);
    },

    // Setup event listeners for period controls
    setupPeriodEventListeners(periodRow, dropdown, isVolatility) {
        const slider = periodRow.querySelector('.range-input');
        const valueDisplay = periodRow.querySelector('.period-value-display');
        const rangeInputs = periodRow.querySelectorAll('.period-range-input');

        // Validate ranges on input with debounce
        rangeInputs.forEach(input => {
            let timeout;
            input.addEventListener('input', () => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    const startInput = rangeInputs[0];
                    const endInput = rangeInputs[1];
                    const start = parseInt(startInput.value);
                    const end = parseInt(endInput.value);

                    // Fix invalid ranges
                    if (start > end && end > 0) {
                        endInput.value = start;
                    }

                    this.validatePeriodRanges(dropdown);
                    this.updatePeriodsCount(dropdown);

                    // Store updated periods after a brief delay
                    setTimeout(() => {
                        if (dropdown.currentType) {
                            this.storePeriods(dropdown, dropdown.currentType);
                        }
                    }, 100);
                }, 150);
            });
        });

        slider.addEventListener('input', (e) => {
            const val = e.target.value;
            if (isVolatility) {
                valueDisplay.textContent = val + '%';
            } else {
                const desc = val == 0 ? 'Neutral' : (val > 0 ? 'Bullish' : 'Bearish');
                valueDisplay.textContent = `${val} (${desc})`;
            }

            // Store updated periods when slider value changes
            if (dropdown.currentType) {
                this.storePeriods(dropdown, dropdown.currentType);
            }
        });
    },

    // Get next valid range suggestion for new periods
    getNextValidRange(dropdown) {
        const existingRanges = [];
        dropdown.querySelectorAll('.micro-period').forEach(period => {
            const inputs = period.querySelectorAll('.period-range-input');
            const start = parseInt(inputs[0].value);
            const end = parseInt(inputs[1].value);
            if (start > 0 && end > 0) {
                existingRanges.push({ start, end });
            }
        });

        if (existingRanges.length === 0) {
            return { start: 1, end: 10 };
        }

        // Sort ranges by start position
        existingRanges.sort((a, b) => a.start - b.start);

        // Find first gap
        let nextStart = 1;
        for (const range of existingRanges) {
            if (nextStart < range.start) {
                return { start: nextStart, end: Math.min(nextStart + 9, range.start - 1) };
            }
            nextStart = Math.max(nextStart, range.end + 1);
        }

        // No gaps found, start after last range
        return { start: nextStart, end: nextStart + 9 };
    },

    // Validate period ranges for overlaps
    validatePeriodRanges(dropdown) {
        const periods = dropdown.querySelectorAll('.micro-period');
        let hasInvalid = false;

        // Clear all previous invalid states
        periods.forEach(period => {
            period.classList.remove('invalid-range');
        });

        // Check for overlapping ranges
        const ranges = [];
        periods.forEach(period => {
            const inputs = period.querySelectorAll('.period-range-input');
            const start = parseInt(inputs[0].value);
            const end = parseInt(inputs[1].value);

            if (start > 0 && end > 0 && start <= end) {
                ranges.push({ period, start, end });
            }
        });

        // Check overlaps
        for (let i = 0; i < ranges.length; i++) {
            for (let j = i + 1; j < ranges.length; j++) {
                const range1 = ranges[i];
                const range2 = ranges[j];

                if (range1.start <= range2.end && range2.start <= range1.end) {
                    range1.period.classList.add('invalid-range');
                    range2.period.classList.add('invalid-range');
                    hasInvalid = true;
                }
            }
        }

        dropdown.dataset.hasInvalidRanges = hasInvalid.toString();
        return !hasInvalid;
    },

    // Update periods count display
    updatePeriodsCount(dropdown) {
        const datacard = dropdown.closest('.datacard');
        const type = dropdown.getAttribute('data-type') || dropdown.currentType;
        if (!type) return;

        const indicator = datacard.querySelector(`.periods-indicator[data-type="${type}"]`);
        if (!indicator) return;

        const count = dropdown.querySelectorAll('.micro-period:not(.invalid-range)').length;
        const hasInvalid = dropdown.dataset.hasInvalidRanges === 'true';

        indicator.textContent = count;

        // Visual indication of invalid state
        if (hasInvalid && count > 0) {
            indicator.style.background = 'rgba(255, 80, 80, 0.3)';
            indicator.style.borderColor = 'rgba(255, 120, 120, 0.8)';
            indicator.style.color = 'rgba(255, 200, 200, 0.9)';
            indicator.classList.remove('has-periods');
        } else {
            // Reset to default styles
            indicator.style.background = '';
            indicator.style.borderColor = '';
            indicator.style.color = '';

            // Add has-periods class if count > 0
            if (count > 0) {
                indicator.classList.add('has-periods');
            } else {
                indicator.classList.remove('has-periods');
            }
        }

        // Update datacard background based on all indicators
        this.updateDatacardBackground(datacard);
    },

    // Update datacard visual state based on micro-periods
    updateDatacardBackground(datacard) {
        const volIndicator = datacard.querySelector('.periods-indicator[data-type="volatility"]');
        const trendIndicator = datacard.querySelector('.periods-indicator[data-type="trend"]');

        const volCount = parseInt(volIndicator?.textContent || '0');
        const trendCount = parseInt(trendIndicator?.textContent || '0');

        if (volCount > 0 || trendCount > 0) {
            datacard.classList.add('has-micro-periods');
        } else {
            datacard.classList.remove('has-micro-periods');
        }
    },

    // Get valid periods data for export
    getValidPeriods(datacard, type) {
        const dropdown = datacard.querySelector('.periods-dropdown');
        if (dropdown.dataset.hasInvalidRanges === 'true') {
            console.warn(`⚠️ Cannot extract ${type} periods - overlapping ranges detected`);
            return [];
        }

        const validPeriods = [];
        const periods = dropdown.querySelectorAll('.micro-period:not(.invalid-range)');

        periods.forEach(period => {
            const inputs = period.querySelectorAll('.period-range-input');
            const slider = period.querySelector('.range-input');
            const start = parseInt(inputs[0].value);
            const end = parseInt(inputs[1].value);
            const value = parseInt(slider.value);

            if (start > 0 && end > 0 && start <= end) {
                validPeriods.push({ start, end, value });
            }
        });

        return validPeriods;
    },

    // Initialize global click handler for closing dropdowns
    initializeGlobalHandlers() {
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.periods-dropdown') && !e.target.closest('.periods-indicator')) {
                document.querySelectorAll('.periods-dropdown').forEach(dropdown => {
                    // Store current periods before closing
                    if (dropdown.currentType && dropdown.style.display !== 'none') {
                        this.storePeriods(dropdown, dropdown.currentType);
                        // Update background after storing
                        const datacard = dropdown.closest('.datacard');
                        if (datacard) {
                            this.updateDatacardBackground(datacard);
                        }
                    }
                    dropdown.style.display = 'none';
                });
                document.querySelectorAll('.periods-indicator').forEach(indicator => {
                    indicator.classList.remove('active');
                });
            }
        });
    }
};

// Make available globally for compatibility
if (typeof window !== 'undefined') {
    window.MicrostructureControls = MicrostructureControls;

    // Legacy global function support
    window.togglePeriodsDropdown = MicrostructureControls.togglePeriodsDropdown.bind(MicrostructureControls);
    window.addMicroPeriod = MicrostructureControls.addMicroPeriod.bind(MicrostructureControls);
    window.removeMicroPeriod = MicrostructureControls.removeMicroPeriod.bind(MicrostructureControls);
    window.getValidPeriods = MicrostructureControls.getValidPeriods.bind(MicrostructureControls);

    // Initialize global handlers when module loads
    MicrostructureControls.initializeGlobalHandlers();
}
