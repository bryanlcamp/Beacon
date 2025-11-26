/**
 * Beacon UI Controller Base Class
 * Handles DOM manipulation and component management
 * Modern ES6+ with native browser APIs
 */

export class UIController {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.components = new Map();
        this.eventListeners = new Map();
        
        if (!this.container) {
            throw new Error(`Container element with id '${containerId}' not found`);
        }
    }

    /**
     * Create a DOM element with attributes and content
     */
    createElement(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        
        // Set attributes
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'dataset') {
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    element.dataset[dataKey] = dataValue;
                });
            } else {
                element.setAttribute(key, value);
            }
        });
        
        // Set content
        if (typeof content === 'string') {
            element.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            element.appendChild(content);
        } else if (Array.isArray(content)) {
            content.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else {
                    element.appendChild(child);
                }
            });
        }
        
        return element;
    }

    /**
     * Add event listener with automatic cleanup tracking
     */
    addEventListener(element, event, handler, options = {}) {
        element.addEventListener(event, handler, options);
        
        // Track for cleanup
        if (!this.eventListeners.has(element)) {
            this.eventListeners.set(element, []);
        }
        this.eventListeners.get(element).push({ event, handler, options });
    }

    /**
     * Remove all event listeners for an element
     */
    removeEventListeners(element) {
        const listeners = this.eventListeners.get(element);
        if (listeners) {
            listeners.forEach(({ event, handler, options }) => {
                element.removeEventListener(event, handler, options);
            });
            this.eventListeners.delete(element);
        }
    }

    /**
     * Show/hide elements with smooth transitions
     */
    show(element, display = 'block') {
        element.style.display = display;
        element.style.opacity = '0';
        element.offsetHeight; // Force reflow
        element.style.transition = 'opacity 0.3s ease';
        element.style.opacity = '1';
    }

    hide(element) {
        element.style.transition = 'opacity 0.3s ease';
        element.style.opacity = '0';
        setTimeout(() => {
            element.style.display = 'none';
        }, 300);
    }

    /**
     * Enable/disable elements with visual feedback
     */
    enable(element) {
        element.disabled = false;
        element.style.opacity = '1';
        element.style.cursor = '';
    }

    disable(element) {
        element.disabled = true;
        element.style.opacity = '0.5';
        element.style.cursor = 'not-allowed';
    }

    /**
     * Add component to management system
     */
    registerComponent(id, component) {
        this.components.set(id, component);
    }

    /**
     * Get managed component
     */
    getComponent(id) {
        return this.components.get(id);
    }

    /**
     * Clean up all managed resources
     */
    destroy() {
        // Remove all event listeners
        for (const [element] of this.eventListeners) {
            this.removeEventListeners(element);
        }
        
        // Clear components
        this.components.clear();
        
        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}