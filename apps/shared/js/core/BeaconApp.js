/**
 * Beacon HFT Platform - Professional Application Core
 * Provides consistent branding, navigation, and application lifecycle
 */

export class BeaconApp {
    constructor(config = {}) {
        this.config = {
            appName: 'Beacon Platform',
            friendlyName: config.friendlyName || 'Application',
            version: '1.0.0',
            navigation: config.navigation || [],
            ...config
        };
        
        this.isInitialized = false;
        this.components = new Map();
    }

    /**
     * Initialize the application with professional branding and navigation
     */
    async init() {
        if (this.isInitialized) return;
        
        try {
            // Create professional navigation header
            this.createNavigationHeader();
            
            // Initialize error handling
            this.initErrorHandling();
            
            // Initialize performance monitoring
            this.initPerformanceMonitoring();
            
            // Mark as initialized
            this.isInitialized = true;
            
            console.log(`✅ Beacon ${this.config.friendlyName} initialized successfully`);
            
        } catch (error) {
            console.error('❌ Failed to initialize Beacon application:', error);
            throw error;
        }
    }

    /**
     * Create consistent navigation header across all pages
     */
    createNavigationHeader() {
        // Check if header already exists
        if (document.getElementById('beacon-nav-header')) return;

        const header = document.createElement('header');
        header.id = 'beacon-nav-header';
        header.className = 'beacon-nav-header';
        
        header.innerHTML = `
            <nav class="beacon-nav">
                <div class="beacon-nav-brand">
                    <a href="/" class="beacon-brand-link">
                        <span class="beacon-brand-xs">Beacon.</span>
                        <span class="beacon-nav-separator">|</span>
                        <span class="beacon-nav-friendly-name">${this.config.friendlyName}</span>
                    </a>
                </div>
                <div class="beacon-nav-links">
                    ${this.renderNavigationLinks()}
                </div>
                <div class="beacon-nav-actions">
                    <button class="beacon-btn beacon-btn-primary beacon-nav-help" 
                            onclick="window.beaconApp?.showHelp()" 
                            title="Help & Documentation">
                        <span>Help</span>
                    </button>
                </div>
            </nav>
        `;

        // Add professional navigation styles
        this.addNavigationStyles();
        
        // Insert at the beginning of body
        document.body.insertBefore(header, document.body.firstChild);
        
        // Adjust body padding to account for fixed header
        document.body.style.paddingTop = '80px';
    }

    /**
     * Render navigation links based on configuration
     */
    renderNavigationLinks() {
        const defaultNavigation = [
            { name: 'Dataset Generator', href: '/apps/generator/', current: false },
            { name: 'Market Simulator', href: '/apps/playback/', current: false },
            { name: 'Algorithm Testing', href: '/apps/algorithm/', current: false },
            { name: 'Documentation', href: '/docs/', current: false }
        ];

        const navigation = this.config.navigation.length > 0 ? this.config.navigation : defaultNavigation;
        
        return navigation.map(item => `
            <a href="${item.href}" 
               class="beacon-nav-link ${item.current ? 'beacon-nav-link-current' : ''}"
               ${item.current ? 'aria-current="page"' : ''}>
                ${item.name}
            </a>
        `).join('');
    }

    /**
     * Add professional navigation styles
     */
    addNavigationStyles() {
        if (document.getElementById('beacon-nav-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'beacon-nav-styles';
        styles.textContent = `
            .beacon-nav-header {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: rgba(10, 10, 21, 0.95);
                backdrop-filter: blur(10px);
                border-bottom: 1px solid var(--border-primary);
                z-index: 1000;
            }

            .beacon-nav {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--spacing-md) var(--spacing-lg);
                max-width: 1200px;
                margin: 0 auto;
            }

            .beacon-nav-brand {
                display: flex;
                align-items: center;
            }

            .beacon-brand-link {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
                text-decoration: none;
                color: var(--text-primary);
            }

            .beacon-nav-separator {
                color: var(--text-muted);
                font-weight: 300;
            }

            .beacon-nav-friendly-name {
                font-size: 1rem;
                font-weight: var(--font-weight-medium);
                color: var(--beacon-primary);
            }

            .beacon-nav-links {
                display: flex;
                align-items: center;
                gap: var(--spacing-lg);
            }

            .beacon-nav-link {
                color: var(--text-secondary);
                text-decoration: none;
                font-size: 0.875rem;
                font-weight: var(--font-weight-medium);
                padding: var(--spacing-sm) 0;
                border-bottom: 2px solid transparent;
                transition: all var(--transition-normal);
            }

            .beacon-nav-link:hover {
                color: var(--text-primary);
                border-bottom-color: var(--beacon-primary);
            }

            .beacon-nav-link-current {
                color: var(--beacon-primary);
                border-bottom-color: var(--beacon-primary);
            }

            .beacon-nav-actions {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
            }

            .beacon-nav-help {
                font-size: 0.8rem;
                padding: var(--spacing-xs) var(--spacing-sm);
            }

            @media (max-width: 768px) {
                .beacon-nav {
                    padding: var(--spacing-sm) var(--spacing-md);
                }
                
                .beacon-nav-links {
                    display: none;
                }
                
                .beacon-brand-xs {
                    font-size: 1.5rem;
                }
            }
        `;

        document.head.appendChild(styles);
    }

    /**
     * Professional error handling system
     */
    initErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('🚨 Beacon Application Error:', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('🚨 Beacon Unhandled Promise Rejection:', event.reason);
        });
    }

    /**
     * Professional performance monitoring
     */
    initPerformanceMonitoring() {
        // Track page load performance
        window.addEventListener('load', () => {
            if (performance.timing) {
                const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
                console.log(`⚡ Beacon ${this.config.friendlyName} loaded in ${loadTime}ms`);
            }
        });
    }

    /**
     * Show help modal
     */
    showHelp() {
        console.log(`📚 Help requested for ${this.config.friendlyName}`);
        // TODO: Implement professional help system
        alert(`Help for ${this.config.friendlyName} - Coming Soon!`);
    }

    /**
     * Register a component with the application
     */
    registerComponent(name, component) {
        this.components.set(name, component);
        console.log(`📦 Registered component: ${name}`);
    }

    /**
     * Get a registered component
     */
    getComponent(name) {
        return this.components.get(name);
    }

    /**
     * Professional cleanup on page unload
     */
    destroy() {
        this.components.clear();
        this.isInitialized = false;
        console.log(`🧹 Beacon ${this.config.friendlyName} cleaned up`);
    }
}

// Global application instance
window.beaconApp = null;

// Initialize application helper
export function initBeaconApp(config) {
    if (window.beaconApp) {
        console.warn('Beacon application already initialized');
        return window.beaconApp;
    }

    window.beaconApp = new BeaconApp(config);
    return window.beaconApp;
}
