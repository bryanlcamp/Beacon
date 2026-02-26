/**
 * Shared Constants Module
 * Contains all application constants used across multiple pages
 */

/**
 * Validation feedback types for form inputs
 */
export const FeedbackType = {
    REQUIRED: 'required',
    SUCCESS: 'success',
    ERROR: 'error',
    DUPLICATE: 'duplicate',
    WARNING: 'warning'
};

/**
 * DOM event types
 */
export const EVENT_TYPES = {
    // Input events
    INPUT: 'input',
    CHANGE: 'change',
    BLUR: 'blur',
    FOCUS: 'focus',
    
    // Keyboard events
    KEYDOWN: 'keydown',
    KEYUP: 'keyup',
    KEYPRESS: 'keypress',
    
    // Mouse events
    CLICK: 'click',
    MOUSEENTER: 'mouseenter',
    MOUSELEAVE: 'mouseleave',
    MOUSEOVER: 'mouseover',
    MOUSEOUT: 'mouseout',
    
    // Clipboard events
    PASTE: 'paste',
    CUT: 'cut',
    COPY: 'copy',
    
    // Document events
    DOM_CONTENT_LOADED: 'DOMContentLoaded',
    LOAD: 'load',
    RESIZE: 'resize',
    SCROLL: 'scroll',
    
    // Error events
    ERROR: 'error',
    UNHANDLED_REJECTION: 'unhandledrejection'
};

/**
 * Keyboard key constants
 */
export const KEYS = {
    ENTER: 'Enter',
    ESCAPE: 'Escape',
    TAB: 'Tab',
    SPACE: ' ',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    BACKSPACE: 'Backspace',
    DELETE: 'Delete'
};

/**
 * CSS cursor values
 */
export const CURSOR_TYPES = {
    POINTER: 'pointer',
    NOT_ALLOWED: 'not-allowed',
    DEFAULT: 'default',
    GRAB: 'grab',
    GRABBING: 'grabbing',
    MOVE: 'move',
    RESIZE: 'resize',
    TEXT: 'text',
    WAIT: 'wait',
    HELP: 'help'
};

/**
 * CSS display values
 */
export const DISPLAY_TYPES = {
    NONE: 'none',
    BLOCK: 'block',
    INLINE: 'inline',
    INLINE_BLOCK: 'inline-block',
    FLEX: 'flex',
    GRID: 'grid'
};

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
};

/**
 * Common CSS selectors used across the application
 */
export const SELECTORS = {
    // Form elements
    SYMBOL_INPUT: '#symbolInput',
    ADD_BUTTON: '#addSymbol',
    EXCHANGE_SELECT: '#exchangeSelect',
    GENERATE_BUTTON: '#generateDataset',
    
    // Containers
    SYMBOL_CONTAINER: '#symbolsContainer',
    DATACARD_CONTAINER: '#datacardContainer',
    SYMBOL_INPUT_CONTROL: '.symbol-input-control',
    
    // Content elements
    SYMBOL_NAME: '.symbol-name',
    DEMO_BANNER: '#demo-banner',
    
    // Common classes
    VALUE: '.value',
    VALUE_INPUT: '.value-input',
    REMOVE_SYMBOL: '.remove-symbol',
    DATACARD: '.datacard'
};

/**
 * Application configuration constants
 */
export const APP_CONFIG = {
    INIT_TIMEOUT: 5000,
    VALIDATION_DELAY: 0,
    DEFAULT_EXCHANGE: 'NASDAQ',
    MAX_SYMBOLS: 50,
    DEMO_MODE_PARAM: 'demo=true'
};

/**
 * Animation and timing constants
 */
export const TIMING = {
    DEBOUNCE_DELAY: 300,
    ANIMATION_DURATION: 250,
    TOOLTIP_DELAY: 500,
};