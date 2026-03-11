/**
 * Portfolio Controls Module
 * Handles portfolio parameter controls, dropdowns, and form inputs
 */

class PortfolioControls {
    constructor() {
        this.toggleButton = null;
        this.container = null;
        this.toggleIcon = null;
        this.durationPicker = null;

        this.isExpanded = false;
        this.initialized = false;

        // Try to initialize immediately, but also listen for components ready
        this.init();

        // Also listen for componentsReady event in case components load later
        if (!this.initialized) {
            document.addEventListener('componentsReady', () => {
                console.log('📋 Portfolio Controls: Components ready event received, retrying initialization...');
                this.init();
            });
        }
    }

    init() {
        console.log('⚙️ Initializing Portfolio Controls...');

        // Try to find DOM elements
        this.toggleButton = document.getElementById('togglePortfolioParams');
        this.container = document.getElementById('portfolioParamsContainer');
        this.toggleIcon = document.getElementById('portfolioToggleIcon');
        this.durationPicker = document.getElementById('durationPicker');

        // Check if required elements exist
        if (!this.toggleButton || !this.container) {
            console.warn('⚠️ Portfolio Controls: Required DOM elements not found yet. Missing:', {
                toggleButton: !!this.toggleButton,
                container: !!this.container,
                toggleIcon: !!this.toggleIcon
            });
            return;
        }

        // Set up the controls
        this.setupPortfolioToggle();
        this.populateGlobalControls();
        this.setupTimeFormatting();

        this.initialized = true;
        console.log('✅ Portfolio Controls initialized successfully');
    }

    // Debug helper method
    checkElements() {
        const elements = {
            toggleButton: document.getElementById('togglePortfolioParams'),
            container: document.getElementById('portfolioParamsContainer'),
            toggleIcon: document.getElementById('portfolioToggleIcon'),
            symbolInput: document.getElementById('symbolInput')
        };

        console.log('🔍 Portfolio Controls Element Check:', {
            toggleButton: !!elements.toggleButton,
            container: !!elements.container,
            toggleIcon: !!elements.toggleIcon,
            symbolInput: !!elements.symbolInput,
            initialized: this.initialized
        });

        return elements;
    }

    setupPortfolioToggle() {
        if (!this.toggleButton || !this.container) {
            console.warn('⚠️ setupPortfolioToggle: Required elements missing');
            return;
        }

        this.toggleButton.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🔄 Update All button clicked - toggling portfolio params');
            this.togglePortfolioParams();
        });
    }

    togglePortfolioParams() {
        if (!this.container) {
            console.warn('⚠️ togglePortfolioParams: Container not found');
            return;
        }

        this.isExpanded = !this.isExpanded;

        if (this.isExpanded) {
            this.container.style.display = 'block';
            if (this.toggleIcon) {
                this.toggleIcon.textContent = '▲';
                this.toggleIcon.style.transform = 'rotate(180deg)';
            }
        } else {
            this.container.style.display = 'none';
            if (this.toggleIcon) {
                this.toggleIcon.textContent = '▼';
                this.toggleIcon.style.transform = 'rotate(0deg)';
            }
        }

        console.log(`📊 Portfolio params ${this.isExpanded ? 'expanded' : 'collapsed'}`);
    }

    populateGlobalControls() {
        // Ensure symbolManager is available (it's made globally available in author-app.js)
        if (!window.symbolManager) {
            console.warn('SymbolManager not available yet, will retry...');
            setTimeout(() => this.populateGlobalControls(), 100);
            return;
        }

        if (!this.container) {
            console.warn('Portfolio params container not found');
            return;
        }

        // Use the same template system as datacards
        try {
            const globalContent = window.symbolManager.createGlobalControlsContent();
            this.container.innerHTML = globalContent;

            // Add range input event listeners to update values like datacards
            this.setupGlobalRangeListeners();

            console.log('📊 Global controls populated using SymbolManager templates');
        } catch (error) {
            console.error('Error populating global controls:', error);
            // Fallback to keeping the existing static content
        }
    }

    setupGlobalRangeListeners() {
        // Add event listeners to all range inputs in the dropdown
        const rangeInputs = this.container.querySelectorAll('.range-input');
        rangeInputs.forEach(range => {
            range.addEventListener('input', (e) => {
                const parent = e.target.closest('.range-control');
                const valueDisplay = parent.querySelector('.range-value .value');
                const value = e.target.value;

                if (valueDisplay) {
                    valueDisplay.textContent = value;
                }
            });
        });

        // Add Enter key handling to number inputs - applies value to all datacards
        const numberInputs = this.container.querySelectorAll('.range-number-input');
        numberInputs.forEach(numberInput => {
            const group = numberInput.closest('.range-input-group');
            const rangeInput = group ? group.querySelector('.range-input') : null;

            numberInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    numberInput.blur();
                    if (rangeInput) {
                        rangeInput.value = numberInput.value;
                        rangeInput.dispatchEvent(new Event('input'));
                    }
                    this.applyGlobalValueToCards(numberInput);
                }
            });
        });

        // Also apply on slider change (drag release)
        rangeInputs.forEach(range => {
            range.addEventListener('change', (e) => {
                const parent = e.target.closest('.range-control');
                const numberInput = parent ? parent.querySelector('.range-number-input') : null;
                if (numberInput) {
                    numberInput.value = e.target.value;
                }
                this.applyGlobalValueToCards(numberInput || e.target);
            });
        });
    }

    applyGlobalValueToCards(sourceInput) {
        // Find which parameter this input controls by its label
        const control = sourceInput.closest('.range-control');
        if (!control) return;
        const labelEl = control.querySelector('.range-label');
        if (!labelEl) return;
        const labelText = labelEl.textContent.trim();
        const value = sourceInput.value || sourceInput.closest('.range-input-group')?.querySelector('.range-input')?.value;

        // Apply to all datacards
        const datacards = document.querySelectorAll('.datacard[data-symbol]');
        datacards.forEach(card => {
            const labels = card.querySelectorAll('.range-label');
            labels.forEach(cardLabel => {
                if (cardLabel.textContent.trim() === labelText) {
                    const cardControl = cardLabel.closest('.range-control');
                    if (!cardControl) return;
                    const cardSlider = cardControl.querySelector('.range-input');
                    const cardNumber = cardControl.querySelector('.range-number-input');
                    if (cardSlider) {
                        cardSlider.value = value;
                        cardSlider.dispatchEvent(new Event('input'));
                    }
                    if (cardNumber) {
                        cardNumber.value = value;
                    }
                }
            });
        });

        console.log(`📊 Applied ${labelText} = ${value} to all datacards`);
    }

    setupTimeFormatting() {
        if (!this.durationPicker) return;
        const input = this.durationPicker;
        const fileSizeEl = document.getElementById('fileSizeBlock');

        // Hidden span to measure rendered text width at same font
        const ruler = document.createElement('span');
        ruler.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;' +
            `font-family:${getComputedStyle(input).fontFamily};` +
            `font-size:${getComputedStyle(input).fontSize};` +
            `font-weight:${getComputedStyle(input).fontWeight};` +
            `letter-spacing:${getComputedStyle(input).letterSpacing};`;
        input.parentElement.appendChild(ruler);

        // Dynamically size input to match rendered text width
        const positionFileSize = () => {
            if (!fileSizeEl) return;
            ruler.textContent = input.value;
            const textWidth = ruler.offsetWidth;
            if (textWidth > 0) {
                input.style.width = textWidth + 'px';
            }
        };

        // Position on init — defer to ensure font is loaded and layout is ready
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => positionFileSize());
        } else {
            setTimeout(positionFileSize, 100);
        }
        // Also try immediately in case fonts are already loaded
        positionFileSize();

        // Position-to-digit map: pos 0→d0, 1→d1, 2→colon, 3→d2, 4→d3, 5→colon, 6→d4, 7→d5
        const posToDigit = { 0: 0, 1: 1, 3: 2, 4: 3, 6: 4, 7: 5 };
        const digitToPos  = [0, 1, 3, 4, 6, 7];

        const getDigits = () => input.value.replace(/\D/g, '').padEnd(6, '0').slice(0, 6);
        const buildValue = (d) => `${d[0]}${d[1]}:${d[2]}${d[3]}:${d[4]}${d[5]}`;

        // Snap to nearest digit position (skip colons forward)
        const snapPos = (pos) => {
            if (pos <= 0) return 0;
            if (pos >= 7) return 7;
            if (pos === 2) return 3;
            if (pos === 5) return 6;
            return pos;
        };

        const clampDigits = (digits) => {
            let d = digits.split('').map(c => parseInt(c) || 0);
            let hours   = d[0] * 10 + d[1];
            let minutes = d[2] * 10 + d[3];
            let seconds = d[4] * 10 + d[5];
            if (hours > 23)   { hours = 23; }
            if (minutes > 59) { minutes = 59; }
            if (seconds > 59) { seconds = 59; }
            return hours.toString().padStart(2, '0') +
                   minutes.toString().padStart(2, '0') +
                   seconds.toString().padStart(2, '0');
        };

        // Helper: set value and cursor in a single rAF to avoid Safari jitter
        const setValueAndCursor = (val, pos) => {
            input.value = val;
            positionFileSize();
            requestAnimationFrame(() => input.setSelectionRange(pos, pos));
        };

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' || e.ctrlKey || e.metaKey) return;
            e.preventDefault();

            let pos = snapPos(input.selectionStart);
            let digits = getDigits();

            if (/^[0-9]$/.test(e.key)) {
                const dIdx = posToDigit[pos];
                if (dIdx === undefined) return;

                // Place the digit as-is — no rejection
                let d = digits.split('');
                d[dIdx] = e.key;
                let newDigits = d.join('');

                // Clamp the affected pair immediately so it stays visually sane
                let clamped = clampDigits(newDigits);
                input.value = buildValue(clamped);
                positionFileSize();

                // Always advance cursor to next digit position
                const nextIdx = dIdx + 1;
                const nextPos = nextIdx < 6 ? digitToPos[nextIdx] : 8;
                requestAnimationFrame(() => input.setSelectionRange(nextPos, nextPos));

            } else if (e.key === 'Backspace') {
                const dIdx = posToDigit[pos];
                if (dIdx !== undefined && dIdx > 0) {
                    const prevIdx = dIdx - 1;
                    let d = digits.split('');
                    d[prevIdx] = '0';
                    const prevPos = digitToPos[prevIdx];
                    setValueAndCursor(buildValue(d.join('')), prevPos);
                } else if (dIdx === 0) {
                    let d = digits.split('');
                    d[0] = '0';
                    setValueAndCursor(buildValue(d.join('')), 0);
                }

            } else if (e.key === 'Delete') {
                const dIdx = posToDigit[pos];
                if (dIdx !== undefined) {
                    let d = digits.split('');
                    d[dIdx] = '0';
                    setValueAndCursor(buildValue(d.join('')), pos);
                }

            } else if (e.key === 'ArrowLeft') {
                const dIdx = posToDigit[pos];
                if (dIdx !== undefined && dIdx > 0) {
                    const p = digitToPos[dIdx - 1];
                    input.setSelectionRange(p, p);
                }

            } else if (e.key === 'ArrowRight') {
                const dIdx = posToDigit[pos];
                if (dIdx !== undefined && dIdx < 5) {
                    const p = digitToPos[dIdx + 1];
                    input.setSelectionRange(p, p);
                }

            } else if (e.key === 'Home') {
                input.setSelectionRange(0, 0);

            } else if (e.key === 'End') {
                input.setSelectionRange(7, 7);
            }
        });

        // Clicking — snap cursor to nearest digit position
        input.addEventListener('click', () => {
            const pos = snapPos(input.selectionStart);
            input.setSelectionRange(pos, pos);
        });

        // Prevent paste/drop from breaking the format
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pasted = (e.clipboardData || window.clipboardData).getData('text');
            const pastedDigits = pasted.replace(/\D/g, '').slice(0, 6).padEnd(6, '0');
            const validated = clampDigits(pastedDigits);
            input.value = buildValue(validated);
            positionFileSize();
        });

        // On blur — clamp values (allow 00:00:00)
        input.addEventListener('blur', () => {
            const digits = getDigits();
            const clamped = clampDigits(digits);
            input.value = buildValue(clamped);
        });

        // On focus — place cursor at start
        input.addEventListener('focus', () => {
            setTimeout(() => input.setSelectionRange(0, 0), 0);
        });
    }

    formatTimeString(timeStr) {
        let digits = timeStr.replace(/\D/g, '').padEnd(6, '0').slice(0, 6);
        let hours = parseInt(digits.slice(0, 2)) || 0;
        let minutes = parseInt(digits.slice(2, 4)) || 0;
        let seconds = parseInt(digits.slice(4, 6)) || 0;

        // Clamp — no rollover
        if (hours > 23)   { hours = 23; }
        if (minutes > 59) { minutes = 59; }
        if (seconds > 59) { seconds = 59; }

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
