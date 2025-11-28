    /**
     * THE UI update function - single place where UI changes happen
     */
    updateUI(validationResults) {
        const { isValid, errors, derivedState, fieldErrors } = validationResults;
        
        console.log('Updating UI with validation results:', validationResults);

        // Update percentage remaining indicator
        this.updatePercentageIndicator(derivedState);
        
        // Update button states
        this.updateButtonStates(derivedState);
        
        // Update field error states
        this.updateFieldErrors(fieldErrors);
        
        // Update global error display
        this.updateErrorDisplay(errors);
    }

    /**
     * Update percentage remaining indicator
     */
    updatePercentageIndicator(derivedState) {
        const indicator = document.getElementById('percentageRemaining');
        if (!indicator) return;

        const { remainingPercentage, percentageTotal } = derivedState;

        if (Math.abs(percentageTotal - 100) < 0.01) {
            indicator.textContent = '✓ 100% allocated';
            indicator.style.color = '#00ff64';
        } else if (remainingPercentage > 0) {
            indicator.textContent = `${remainingPercentage.toFixed(1)}% remaining`;
            indicator.style.color = 'rgba(255, 255, 255, 0.7)';
        } else {
            indicator.textContent = `${Math.abs(remainingPercentage).toFixed(1)}% over limit!`;
            indicator.style.color = '#ff4444';
        }
    }

    /**
     * Update all button states based on validation
     */
    updateButtonStates(derivedState) {
        const { canAddSymbol, canSave, canRun } = derivedState;
        
        // Add Symbol button
        const addBtn = document.getElementById('addSymbolBtn');
        if (addBtn) {
            if (canAddSymbol) {
                this.enable(addBtn);
            } else {
                this.disable(addBtn);
            }
        }
        
        // Save button  
        const saveBtn = document.getElementById('saveDatasetBtn');
        if (saveBtn) {
            if (canSave) {
                this.enable(saveBtn);
            } else {
                this.disable(saveBtn);
            }
        }
        
        // Run button
        const runBtn = document.getElementById('runDatasetBtn');
        if (runBtn) {
            if (canRun) {
                this.enable(runBtn);
            } else {
                this.disable(runBtn);
            }
        }
    }

    /**
     * Update field-specific error states
     */
    updateFieldErrors(fieldErrors) {
        // Total Messages field
        const totalMessagesInput = document.getElementById('totalMessages');
        if (totalMessagesInput) {
            if (fieldErrors.has('totalMessages')) {
                totalMessagesInput.style.borderColor = '#ff4444';
                totalMessagesInput.title = fieldErrors.get('totalMessages');
            } else {
                totalMessagesInput.style.borderColor = '';
                totalMessagesInput.title = '';
            }
        }
    }

    /**
     * Update global error display
     */
    updateErrorDisplay(errors) {
        // For now, just console log errors
        // Later we can add a dedicated error display area
        if (errors.length > 0) {
            console.warn('Validation errors:', errors);
        }
    }