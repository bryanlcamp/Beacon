/**
 * Simple Component Loader for Author App
 * Loads HTML components and injects them into the page
 */

class ComponentLoader {
    constructor() {
        this.componentCache = new Map();
        this.componentsPath = 'components/';
    }

    /**
     * Load and inject a component
     * @param {string} componentName - Name of component file (without .html)
     * @param {string} targetSelector - CSS selector for injection target
     * @param {boolean} replace - Whether to replace content or append
     */
    async loadComponent(componentName, targetSelector, replace = true) {
        try {
            // Force fresh load with timestamp to bust component cache
            const timestamp = Date.now();

            // Fetch component with cache busting
            const response = await fetch(`${this.componentsPath}${componentName}.html?v=${timestamp}`);
            if (!response.ok) {
                throw new Error(`Component ${componentName} not found`);
            }
            const componentHTML = await response.text();

            // Clear old cache entry and set fresh
            this.componentCache.delete(componentName);
            this.componentCache.set(componentName, componentHTML);

            // Inject into page
            const target = document.querySelector(targetSelector);
            if (!target) {
                throw new Error(`Target element ${targetSelector} not found`);
            }

            if (replace) {
                target.innerHTML = componentHTML;
            } else {
                target.insertAdjacentHTML('beforeend', componentHTML);
            }

            console.log(`✅ Component ${componentName} loaded into ${targetSelector}`);
            return true;

        } catch (error) {
            console.error(`❌ Failed to load component ${componentName}:`, error);
            return false;
        }
    }

    /**
     * Load multiple components sequentially to avoid overwhelming development server
     *
     * This prevents the server overload issue where rapid page refreshes would
     * create bursts of simultaneous requests (4 components × 5 refreshes = 20 requests)
     * causing blank screens on simple development servers.
     *
     * @param {Array} components - Array of {name, target, replace} objects
     * @returns {Promise<Array>} Array of boolean results for each component
     */
    async loadComponents(components) {
        const results = [];
        let successful = 0;

        // Load components one by one to prevent server overload
        for (const comp of components) {
            const result = await this.loadComponentWithRetry(comp.name, comp.target, comp.replace);
            results.push(result);
            if (result) successful++;

            // Brief delay between requests to prevent overwhelming simple dev servers
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        console.log(`📦 Loaded ${successful}/${components.length} components`);
        return results;
    }

    /**
     * Load component with retry logic for reliability
     *
     * Handles temporary network issues or server hiccups gracefully
     * with exponential backoff between retry attempts.
     *
     * @param {string} componentName - Name of component file (without .html)
     * @param {string} targetSelector - CSS selector for injection target
     * @param {boolean} replace - Whether to replace content or append
     * @param {number} maxRetries - Maximum number of retry attempts
     * @returns {Promise<boolean>} True if successful, false otherwise
     */
    async loadComponentWithRetry(componentName, targetSelector, replace = true, maxRetries = 2) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            const result = await this.loadComponent(componentName, targetSelector, replace);
            if (result) return true;

            if (attempt < maxRetries) {
                console.warn(`🔄 Retrying component ${componentName} (attempt ${attempt + 1})`);
                // Exponential backoff: 100ms, then 200ms
                await new Promise(resolve => setTimeout(resolve, 100 * attempt));
            }
        }

        console.error(`❌ Failed to load ${componentName} after ${maxRetries} attempts`);
        return false;
    }
}

// Export for use
window.ComponentLoader = ComponentLoader;
