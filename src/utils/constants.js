// Constants and Configuration
// Centralized configuration for the MinusPlus Calculator App

// Application Constants
export const APP_CONFIG = {
    name: 'MinusPlus Calculator',
    version: '1.0.0',
    domain: 'minusplus.app'
};

// Canvas Configuration
export const CANVAS_CONFIG = {
    // Zoom limits
    MIN_ZOOM: 0.1,
    MAX_ZOOM: 5.0,
    ZOOM_STEP: 0.1,
    ZOOM_SMOOTH_FACTOR: 1.1,

    // Grid settings
    GRID_SIZE: 50,
    GRID_OPACITY: 0.05,

    // Performance settings
    TARGET_FPS: 60,
    VIEWPORT_MARGIN: 100,
    MAX_ELEMENTS_RENDER: 1000
};

// Text Input Configuration
export const TEXT_CONFIG = {
    // Input sizing
    MIN_WIDTH: 120,
    MIN_HEIGHT: 40,
    MAX_WIDTH: 800,
    MAX_HEIGHT: 600,

    // Input behavior
    AUTO_RESIZE_DEBOUNCE: 10,
    CALCULATION_DEBOUNCE: 150,
    BLUR_CLEANUP_DELAY: 5000,

    // Font settings
    FONT_FAMILY: '"JetBrains Mono", monospace',
    FONT_SIZE: 16,
    LINE_HEIGHT: 1.5
};

// Calculation Configuration
export const CALC_CONFIG = {
    // Number parsing
    MAX_DECIMAL_PLACES: 6,
    DEFAULT_PRECISION: 2,

    // Supported number formats
    CURRENCY_SYMBOLS: ['$', '€', '£', '¥', '₹'],
    DECIMAL_SEPARATORS: ['.', ','],
    THOUSAND_SEPARATORS: [',', ' ', '.'],

    // Calculation limits
    MAX_NUMBERS: 10000,
    MAX_RESULT_VALUE: Number.MAX_SAFE_INTEGER,
    MIN_RESULT_VALUE: Number.MIN_SAFE_INTEGER
};

// Highlighting Configuration
export const HIGHLIGHT_CONFIG = {
    // Search settings
    MIN_SEARCH_LENGTH: 2,
    SEARCH_DEBOUNCE: 50,
    MAX_HIGHLIGHTS: 100,

    // Performance
    VIEWPORT_ONLY: false,
    CACHE_SEARCHES: true
};

// Storage Configuration
export const STORAGE_CONFIG = {
    // Keys
    MAIN_KEY: 'minusplus_canvas_data',
    BACKUP_KEY: 'minusplus_canvas_backup',

    // Auto-save
    AUTO_SAVE_INTERVAL: 30000, // 30 seconds
    MAX_STORAGE_SIZE: 5 * 1024 * 1024, // 5MB
    MAX_ELEMENTS_STORE: 1000,

    // Data retention
    CLEANUP_OLD_DATA: true,
    MAX_BACKUP_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days

    // Compression
    COMPRESS_THRESHOLD: 1024 * 1024, // 1MB
    COORDINATE_PRECISION: 2
};

// Clipboard Configuration
export const CLIPBOARD_CONFIG = {
    // Feedback
    FEEDBACK_DURATION: 2000,
    FEEDBACK_ANIMATION_DURATION: 300,

    // Auto-copy settings
    MIN_COPY_LENGTH: 1,
    MAX_DISPLAY_LENGTH: 20,

    // Debouncing
    SELECTION_DEBOUNCE: 100
};

// UI Configuration
export const UI_CONFIG = {
    // Help indicator
    HELP_FADE_IN_DELAY: 500,
    HELP_FADE_OUT_DELAY: 500,

    // Animations
    ANIMATION_DURATION: 300,
    TRANSITION_EASING: 'cubic-bezier(0.4, 0.0, 0.2, 1)',

    // Responsive breakpoints
    MOBILE_BREAKPOINT: 768,
    TABLET_BREAKPOINT: 1024,

    // Z-index layers
    Z_INDEX: {
        CANVAS: 1,
        INPUT: 1000,
        RESULT: 1001,
        OVERLAY: 1500,
        FEEDBACK: 2000,
        MODAL: 3000
    }
};

// Color Scheme
export const COLORS = {
    // Primary colors
    BG_PRIMARY: '#1a1a1a',
    BG_SECONDARY: '#2d2d2d',
    BG_TERTIARY: '#3a3a3a',

    // Text colors
    TEXT_PRIMARY: '#ffffff',
    TEXT_SECONDARY: '#b0b0b0',
    TEXT_MUTED: '#666666',

    // Accent colors
    ACCENT_BLUE: '#007acc',
    ACCENT_ORANGE: '#ffa500',
    ACCENT_GREEN: '#32cd32',
    ACCENT_RED: '#ff4444',

    // Highlight colors
    HIGHLIGHT_PRIMARY: 'rgba(0, 122, 204, 0.3)',
    HIGHLIGHT_MATCH: 'rgba(255, 165, 0, 0.3)',
    HIGHLIGHT_RESULT: 'rgba(50, 205, 50, 0.3)',

    // Border colors
    BORDER_DEFAULT: 'rgba(255, 255, 255, 0.2)',
    BORDER_FOCUS: '#007acc',
    BORDER_ERROR: '#ff4444'
};

// Event Configuration
export const EVENTS = {
    // Mouse events
    CLICK_DELAY: 0,
    DOUBLE_CLICK_DELAY: 300,
    DRAG_THRESHOLD: 5,

    // Touch events (for mobile)
    TOUCH_THRESHOLD: 10,
    PINCH_THRESHOLD: 10,

    // Keyboard shortcuts
    SHORTCUTS: {
        RESET_VIEW: ['Ctrl+0', 'Cmd+0'],
        SAVE: ['Ctrl+S', 'Cmd+S'],
        ESCAPE: ['Escape']
    }
};

// Performance Configuration
export const PERFORMANCE = {
    // Rendering
    USE_RAF: true,
    DIRTY_CHECKING: true,
    VIEWPORT_CULLING: true,

    // Memory management
    OBJECT_POOLING: true,
    MAX_POOL_SIZE: 100,
    CLEANUP_INTERVAL: 60000, // 1 minute

    // Debouncing
    RESIZE_DEBOUNCE: 150,
    INPUT_DEBOUNCE: 150,
    SCROLL_DEBOUNCE: 16, // ~60fps

    // Batch processing
    BATCH_SIZE: 50,
    BATCH_DELAY: 16
};

// Browser Compatibility
export const BROWSER_SUPPORT = {
    // Required features
    REQUIRED_APIS: [
        'Canvas',
        'localStorage',
        'requestAnimationFrame'
    ],

    // Optional features with fallbacks
    OPTIONAL_APIS: [
        'Clipboard',
        'IntersectionObserver',
        'ResizeObserver'
    ],

    // Minimum versions
    MIN_VERSIONS: {
        chrome: 80,
        firefox: 76,
        safari: 13,
        edge: 80
    }
};

// Error Messages
export const ERROR_MESSAGES = {
    CANVAS_NOT_FOUND: 'Canvas element not found',
    STORAGE_NOT_SUPPORTED: 'Local storage not supported',
    CLIPBOARD_NOT_SUPPORTED: 'Clipboard API not supported',
    CALCULATION_ERROR: 'Calculation error occurred',
    STORAGE_QUOTA_EXCEEDED: 'Storage quota exceeded',
    INVALID_NUMBER_FORMAT: 'Invalid number format',
    TOO_MANY_ELEMENTS: 'Too many elements on canvas'
};

// Regular Expressions
export const REGEX = {
    // Number patterns
    BASIC_NUMBER: /[-+]?[0-9]*\.?[0-9]+/g,
    CURRENCY_NUMBER: /[-+]?\$?[0-9]{1,3}(?:,?[0-9]{3})*(?:\.[0-9]{2})?/g,
    PERCENTAGE: /[-+]?[0-9]*\.?[0-9]+%/g,

    // Text patterns
    WHITESPACE: /\s+/g,
    LINE_BREAKS: /\r?\n/g,

    // Validation
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    URL: /^https?:\/\/.+/
};

// Utility Functions
export const UTILS = {
    // Math utilities
    clamp: (value, min, max) => Math.min(Math.max(value, min), max),
    lerp: (a, b, t) => a + (b - a) * t,
    round: (value, decimals = 0) => Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals),

    // String utilities
    truncate: (str, length) => str.length > length ? str.substring(0, length) + '...' : str,
    capitalize: (str) => str.charAt(0).toUpperCase() + str.slice(1),

    // Array utilities
    unique: (arr) => [...new Set(arr)],
    chunk: (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size)),

    // Object utilities
    deepClone: (obj) => JSON.parse(JSON.stringify(obj)),
    isEmpty: (obj) => Object.keys(obj).length === 0,

    // Performance utilities
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    throttle: (func, limit) => {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// Feature Flags
export const FEATURES = {
    GRID_DISPLAY: true,
    AUTO_SAVE: true,
    AUTO_COPY: true,
    TEXT_HIGHLIGHTING: true,
    KEYBOARD_SHORTCUTS: true,
    TOUCH_SUPPORT: true,
    STATISTICS_PANEL: false, // Future feature
    COLLABORATION: false,    // Future feature
    CLOUD_SYNC: false       // Future feature
};

export default {
    APP_CONFIG,
    CANVAS_CONFIG,
    TEXT_CONFIG,
    CALC_CONFIG,
    HIGHLIGHT_CONFIG,
    STORAGE_CONFIG,
    CLIPBOARD_CONFIG,
    UI_CONFIG,
    COLORS,
    EVENTS,
    PERFORMANCE,
    BROWSER_SUPPORT,
    ERROR_MESSAGES,
    REGEX,
    UTILS,
    FEATURES
};
