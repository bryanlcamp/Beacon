/**
 * Portfolio Controls Module
 * Handles portfolio parameter controls, dropdowns, and form inputs
 */

class PortfolioControls {
    constructor() {
        this.toggleButton = document.getElementById('togglePortfolioParams');
        this.container = document.getElementById('portfolioParamsContainer');
        this.toggleIcon = document.getElementById('portfolioToggleIcon');
        this.durationPicker = document.getElementById('durationPicker');

        this.isExpanded = false;
        this.init();
    }

    init() {
        console.log('⚙️ Initializing Portfolio Controls...');

        this.setupPortfolioToggle();
        this.setupTimeFormatting();
        this.setupRangeInputSync();

        console.log('✅ Portfolio Controls initialized');
    }

    setupPortfolioToggle() {
        if (!this.toggleButton || !this.container) return;

        this.toggleButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.togglePortfolioParams();
        });
    }

    togglePortfolioParams() {
        this.isExpanded = !this.isExpanded;

        if (this.isExpanded) {
            this.container.style.display = 'block';
            this.toggleIcon.textContent = '▲';
            this.toggleIcon.style.transform = 'rotate(180deg)';
        } else {
            this.container.style.display = 'none';
            this.toggleIcon.textContent = '▼';
            this.toggleIcon.style.transform = 'rotate(0deg)';
        }

        console.log(`📊 Portfolio params ${this.isExpanded ? 'expanded' : 'collapsed'}`);
    }

    setupTimeFormatting() {
        if (!this.durationPicker) return;

        // Block invalid characters
        this.durationPicker.addEventListener('keypress', (e) => {
            if (!/[0-9:]/.test(e.key) && e.key.length === 1) {
                e.preventDefault();
            }
        });

        // Clean input as typing
        this.durationPicker.addEventListener('input', (e) => {
            const clean = e.target.value.replace(/[^0-9:]/g, '');
            if (e.target.value !== clean) {
                e.target.value = clean;
            }
        });

        // Format on blur
        this.durationPicker.addEventListener('blur', (e) => {
            e.target.value = this.formatTimeString(e.target.value);
        });
    }

    formatTimeString(timeStr) {
        let val = timeStr.trim();

        // Auto-complete patterns
        if (/^\d{1,2}$/.test(val)) {
            val = `00:${val.padStart(2, '0')}:00`;
        } else if (/^\d{1,2}:\d{1,2}$/.test(val)) {
            val = `${val}:00`;
        }

        // Validate HH:MM:SS format
        const match = val.match(/^(\d{1,2}):(\d{1,2}):(\d{1,2})$/);
        if (match) {
            const hours = Math.min(23, Math.max(0, parseInt(match[1]))).toString().padStart(2, '0');
            const minutes = Math.min(59, Math.max(0, parseInt(match[2]))).toString().padStart(2, '0');
            const seconds = Math.min(59, Math.max(0, parseInt(match[3]))).toString().padStart(2, '0');
            return `${hours}:${minutes}:${seconds}`;
        }

        // Default fallback
        return '00:30:00';
    }

    setupRangeInputSync() {
        // Find all range inputs with their corresponding number inputs
        const rangeGroups = document.querySelectorAll('.range-input-group');

        rangeGroups.forEach(group => {
            const rangeInput = group.querySelector('input[type="range"]');
            const numberInput = group.querySelector('input[type="number"]');

            if (rangeInput && numberInput) {
                this.syncRangeInputs(rangeInput, numberInput);
            }
        });
    }

    syncRangeInputs(rangeInput, numberInput) {
        // Sync range -> number
        rangeInput.addEventListener('input', () => {
            numberInput.value = rangeInput.value;
        });

        // Sync number -> range
        numberInput.addEventListener('input', () => {
            const val = parseFloat(numberInput.value);
            const min = parseFloat(rangeInput.min);
            const max = parseFloat(rangeInput.max);

            if (val >= min && val <= max) {
                rangeInput.value = val;
            }
            // Clamp if out of range
            else if (val < min) {
                numberInput.value = rangeInput.value = min;
            } else if (val > max) {
                numberInput.value = rangeInput.value = max;
            }
        });

        // Initialize with current values
        numberInput.value = rangeInput.value;
    }

    getPortfolioParams() {
        const params = {};

        // Collect all range input values
        const rangeInputs = this.container?.querySelectorAll('input[type="range"]') || [];
        rangeInputs.forEach(input => {
            if (input.id) {
                params[input.id] = parseFloat(input.value);
            }
        });

        // Add duration
        if (this.durationPicker) {
            params.duration = this.durationPicker.value;
        }

        return params;
    }

    setPortfolioParams(params) {
        Object.entries(params).forEach(([key, value]) => {
            const input = document.getElementById(key);
            if (input) {
                input.value = value;
                // Trigger sync if it's a range input
                input.dispatchEvent(new Event('input'));
            }
        });
    }
}

// Export for global access
window.PortfolioControls = PortfolioControls;
