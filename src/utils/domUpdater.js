/**
 * DOM Updater Utilities
 *
 * Pure functions for updating specific UI elements. All DOM manipulation
 * is centralized here for easier testing and maintenance.
 *
 * @author Beacon Financial Technologies
 * @version 1.0.0
 */

/**
 * Update the file size display element
 * @param {string} formattedSize - Formatted size string (e.g., "~23 MB")
 * @param {string} elementId - ID of element to update (default: 'detailFileSize')
 * @returns {boolean} True if element was found and updated
 */
export const updateFileSizeDisplay = (formattedSize, elementId = 'detailFileSize') => {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = formattedSize;
        return true;
    }
    console.warn(`Element with ID '${elementId}' not found`);
    return false;
};

/**
 * Update the trading duration display element
 * @param {string} formattedDuration - Formatted duration string (e.g., "30:00")
 * @param {string} elementId - ID of element to update (default: 'tradingTime')
 * @returns {boolean} True if element was found and updated
 */
export const updateDurationDisplay = (formattedDuration, elementId = 'tradingTime') => {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = formattedDuration;
        return true;
    }
    console.warn(`Element with ID '${elementId}' not found`);
    return false;
};

/**
 * Update the generation time display element
 * @param {string} formattedTime - Formatted time string (e.g., "3m 45s")
 * @param {string} elementId - ID of element to update (default: 'generationTime')
 * @returns {boolean} True if element was found and updated
 */
export const updateGenerationTimeDisplay = (formattedTime, elementId = 'generationTime') => {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = formattedTime;
        return true;
    }
    console.warn(`Element with ID '${elementId}' not found`);
    return false;
};

/**
 * Update allocation status display with color coding
 * @param {number} percentage - Allocation percentage (0-100+)
 * @param {string} elementId - ID of element to update (default: 'allocationStatus')
 * @returns {boolean} True if element was found and updated
 */
export const updateAllocationDisplay = (percentage, elementId = 'allocationStatus') => {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = `${Math.round(percentage)}%`;

        // Update color based on allocation status
        const parentBox = document.getElementById('allocationStatusBox');
        if (parentBox) {
            let bgColor, borderColor, textColor;

            if (percentage === 100) {
                // Perfect allocation - green
                bgColor = 'rgba(107, 182, 65, 0.1)';
                borderColor = 'rgba(107, 182, 65, 0.3)';
                textColor = '#6bb641';
            } else if (percentage > 100) {
                // Over-allocated - red
                bgColor = 'rgba(255, 88, 88, 0.1)';
                borderColor = 'rgba(255, 88, 88, 0.3)';
                textColor = '#ff5858';
            } else if (percentage >= 80) {
                // Close to complete - orange
                bgColor = 'rgba(255, 145, 77, 0.1)';
                borderColor = 'rgba(255, 145, 77, 0.3)';
                textColor = '#ff914d';
            } else {
                // Under-allocated - default red
                bgColor = 'rgba(255, 88, 88, 0.1)';
                borderColor = 'rgba(255, 88, 88, 0.3)';
                textColor = '#ff5858';
            }

            parentBox.style.background = bgColor;
            parentBox.style.borderColor = borderColor;
            element.style.color = textColor;
        }

        return true;
    }
    console.warn(`Element with ID '${elementId}' not found`);
    return false;
};

/**
 * Update multiple status displays at once
 * @param {Object} updates - Object containing display updates
 * @param {string} updates.fileSize - File size string
 * @param {string} updates.duration - Duration string
 * @param {string} updates.generationTime - Generation time string
 * @param {number} updates.allocation - Allocation percentage
 * @returns {Object} Results of each update attempt
 */
export const updateAllStatusDisplays = (updates) => {
    const results = {};

    if (updates.fileSize !== undefined) {
        results.fileSize = updateFileSizeDisplay(updates.fileSize);
    }

    if (updates.duration !== undefined) {
        results.duration = updateDurationDisplay(updates.duration);
    }

    if (updates.generationTime !== undefined) {
        results.generationTime = updateGenerationTimeDisplay(updates.generationTime);
    }

    if (updates.allocation !== undefined) {
        results.allocation = updateAllocationDisplay(updates.allocation);
    }

    return results;
};

/**
 * Get current values from UI elements
 * @returns {Object} Current UI values
 */
export const getCurrentUIValues = () => {
    return {
        fileSize: document.getElementById('detailFileSize')?.textContent || '',
        duration: document.getElementById('tradingTime')?.textContent || '',
        generationTime: document.getElementById('generationTime')?.textContent || '',
        allocation: document.getElementById('allocationStatus')?.textContent || '0%'
    };
};
