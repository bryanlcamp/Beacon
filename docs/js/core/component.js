/**
 * Beacon Component System
 * Reactive components that automatically update based on state changes
 * Modular, testable, and scalable architecture
 */

import { ApplicationState } from './state.js';

export class Component {
    constructor(elementId, initialState = {}) {
        this.elementId = elementId;
        this.element = document.getElementById(elementId);
        
        if (!this.element) {
            throw new Error(`Element with id '${elementId}' not found`);
        }
        
        // Component state management
        this.state = new ApplicationState(initialState);
        this.subscriptions = [];
        
        // Bind methods to preserve 'this' context
        this.render = this.render.bind(this);
        this.handleStateChange = this.handleStateChange.bind(this);
        
        // Subscribe to own state changes
        this.subscriptions.push(
            this.state.subscribe(this.handleStateChange)
        );
        
        // Initialize component
        this.init();
        this.render();
    }

    /**
     * Override in subclasses for component-specific initialization
     */
    init() {
        // Default implementation - override in subclasses
    }

    /**
     * Override in subclasses for component-specific rendering
     */
    render() {
        // Default implementation - override in subclasses
    }

    /**
     * Handle state changes - triggers re-render by default
     */
    handleStateChange(newState, previousState) {
        // Prevent automatic re-rendering to avoid infinite loops
        // Components should call render() manually when needed
        if (this.shouldAutoRender !== false) {
            this.render();
        }
    }

    /**
     * Update component state
     */
    setState(updates) {
        return this.state.setState(updates);
    }

    /**
     * Get component state
     */
    getState() {
        return this.state.getState();
    }

    /**
     * Subscribe to external state changes
     */
    subscribe(externalState, callback) {
        const unsubscribe = externalState.subscribe(callback);
        this.subscriptions.push(unsubscribe);
        return unsubscribe;
    }

    /**
     * Create DOM element with attributes and content
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
            } else if (key.startsWith('on')) {
                // Event handlers
                const eventName = key.slice(2).toLowerCase();
                element.addEventListener(eventName, value);
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
                } else if (child instanceof HTMLElement) {
                    element.appendChild(child);
                }
            });
        }
        
        return element;
    }

    /**
     * Clean up component - call when removing from DOM
     */
    destroy() {
        // Unsubscribe from all subscriptions
        this.subscriptions.forEach(unsubscribe => unsubscribe());
        this.subscriptions = [];
        
        // Clear element
        if (this.element) {
            this.element.innerHTML = '';
        }
    }
}

/**
 * Component registry for managing component instances
 */
export class ComponentRegistry {
    constructor() {
        this.components = new Map();
    }

    /**
     * Register a component instance
     */
    register(id, component) {
        if (this.components.has(id)) {
            console.warn(`Component '${id}' already registered. Destroying previous instance.`);
            this.components.get(id).destroy();
        }
        
        this.components.set(id, component);
        return component;
    }

    /**
     * Get component instance
     */
    get(id) {
        return this.components.get(id);
    }

    /**
     * Unregister and destroy component
     */
    unregister(id) {
        const component = this.components.get(id);
        if (component) {
            component.destroy();
            this.components.delete(id);
        }
    }

    /**
     * Destroy all components
     */
    destroyAll() {
        for (const [id, component] of this.components) {
            component.destroy();
        }
        this.components.clear();
    }
}

// Global component registry
export const componentRegistry = new ComponentRegistry();