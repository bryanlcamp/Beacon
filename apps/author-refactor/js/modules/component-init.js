/**
 * Component Initialization for Author App
 * Loads all modular components into their containers with server-friendly loading
 */

/**
 * Initialize all components with protection against race conditions
 *
 * This function prevents multiple simultaneous initializations that can occur
 * during rapid page refreshes, which was causing server overload and blank screens.
 *
 * @returns {Promise<boolean>} True if all components loaded successfully
 */
async function initializeComponents() {
    // Prevent race conditions during rapid refreshes
    if (window.componentsLoading) {
        console.log('⏳ Components already loading, waiting...');
        return new Promise(resolve => {
            const checkComplete = () => {
                if (window.componentsReady) {
                    resolve(true);
                } else {
                    setTimeout(checkComplete, 50);
                }
            };
            checkComplete();
        });
    }

    window.componentsLoading = true;
    console.log('🔧 Initializing modular components...');

    // Initialize component loader
    const loader = new ComponentLoader();

    // Define component configuration
    const components = [
        {
            name: 'main-content-layout',
            target: '#main-content-container',
            replace: true
        },
        {
            name: 'portfolio-sidebar',
            target: '#portfolio-sidebar-container',
            replace: true
        },
        {
            name: 'vertical-separator',
            target: '#vertical-separator-container',
            replace: true
        },
        {
            name: 'main-data-area',
            target: '#main-data-area-container',
            replace: true
        }
    ];

    try {
        // Load components in order
        const results = await loader.loadComponents(components);

        const successful = results.filter(r => r).length;
        console.log(`✅ Component initialization complete: ${successful}/${components.length} loaded`);

        // Initialize any component-specific behavior after loading
        if (successful === components.length) {
            console.log('🎯 All components loaded successfully');

            // Dispatch custom event to signal components are ready
            const event = new CustomEvent('componentsReady', {
                detail: { components: components.map(c => c.name) }
            });
            document.dispatchEvent(event);
        }

        // Clean up loading state flags
        window.componentsLoading = false;
        window.componentsReady = successful === components.length;
        return successful === components.length;

    } catch (error) {
        console.error('❌ Component initialization failed:', error);
        // Reset state flags on error
        window.componentsLoading = false;
        window.componentsReady = false;
        return false;
    }
}

// Auto-initialize when DOM is ready (handles both immediate and delayed loading)
if (document.readyState === 'complete') {
    initializeComponents();
} else {
    document.addEventListener('DOMContentLoaded', initializeComponents);
}
