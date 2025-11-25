// ═══════════════════════════════════════════════════════════════════════════════
// AI ATC Training System - Core Architecture
// Provides: State Management, Event Bus, View Manager, Utilities, Settings
// ═══════════════════════════════════════════════════════════════════════════════

'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const APP_VERSION = '2.0.0';
const STORAGE_KEYS = {
    SETTINGS: 'atc_settings',
    PROGRESS: 'atc_progress',
    HISTORY: 'atc_history',
    RECENT_AIRPORTS: 'recentAirportDiagrams'
};

const VIEWS = {
    HOME: 'home',
    TRAINING_CATEGORIES: 'training-categories',
    TRAINING_SCENARIOS: 'training-scenarios',
    COMMUNICATION: 'communication',
    LIVE_ATC: 'live-atc',
    CUSTOM_MODE: 'custom-mode',
    TUTORIAL: 'tutorial'
};

const EVENTS = {
    // Navigation
    VIEW_CHANGE: 'view:change',
    VIEW_CHANGED: 'view:changed',

    // Scenario
    SCENARIO_START: 'scenario:start',
    SCENARIO_END: 'scenario:end',

    // Communication
    TRANSMISSION_START: 'transmission:start',
    TRANSMISSION_END: 'transmission:end',
    MESSAGE_SENT: 'message:sent',
    MESSAGE_RECEIVED: 'message:received',

    // Speech
    SPEECH_START: 'speech:start',
    SPEECH_END: 'speech:end',
    RECOGNITION_START: 'recognition:start',
    RECOGNITION_END: 'recognition:end',
    RECOGNITION_RESULT: 'recognition:result',
    RECOGNITION_ERROR: 'recognition:error',

    // Settings
    SETTINGS_CHANGED: 'settings:changed',

    // Progress
    PROGRESS_UPDATED: 'progress:updated',

    // Error
    ERROR: 'error'
};

const DEFAULT_SETTINGS = {
    speechRate: 0.9,
    speechVolume: 1.0,
    speechPitch: 1.0,
    autoPlayATC: true,
    showKeyboardHints: true,
    enableSoundEffects: true,
    theme: 'dark',
    callsignPrefix: 'N',
    preferredAircraft: 'Cessna 172'
};

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT BUS - Central communication hub for all components
// ═══════════════════════════════════════════════════════════════════════════════

class EventBus {
    constructor() {
        this.listeners = new Map();
        this.onceListeners = new Map();
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);

        // Return unsubscribe function
        return () => this.off(event, callback);
    }

    /**
     * Subscribe to an event once
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    once(event, callback) {
        if (!this.onceListeners.has(event)) {
            this.onceListeners.set(event, new Set());
        }
        this.onceListeners.get(event).add(callback);
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
        if (this.onceListeners.has(event)) {
            this.onceListeners.get(event).delete(callback);
        }
    }

    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data = null) {
        // Regular listeners
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }

        // Once listeners
        if (this.onceListeners.has(event)) {
            this.onceListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in once listener for ${event}:`, error);
                }
            });
            this.onceListeners.get(event).clear();
        }
    }

    /**
     * Clear all listeners for an event
     * @param {string} event - Event name
     */
    clear(event) {
        if (event) {
            this.listeners.delete(event);
            this.onceListeners.delete(event);
        } else {
            this.listeners.clear();
            this.onceListeners.clear();
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATE MANAGER - Centralized application state
// ═══════════════════════════════════════════════════════════════════════════════

class StateManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.state = {
            // Current view
            currentView: VIEWS.HOME,
            previousView: null,
            viewHistory: [VIEWS.HOME],

            // Scenario state
            currentCategory: null,
            currentScenarioId: null,
            currentScenario: null,
            conversationHistory: [],

            // Communication state
            isListening: false,
            isSpeaking: false,
            isTransmitting: false,

            // Custom mode state
            customScenario: null,

            // Tutorial state
            tutorialActive: false,
            tutorialLesson: 0,
            tutorialStep: 0,

            // Live ATC state
            liveATCPlaying: false,
            currentAirport: null,
            currentFeed: null,

            // Session stats
            sessionStats: {
                transmissions: 0,
                scenariosCompleted: 0,
                totalTime: 0,
                startTime: Date.now()
            }
        };
    }

    /**
     * Get current state or a specific key
     * @param {string} key - Optional state key (supports dot notation)
     * @returns {*} State value
     */
    get(key = null) {
        if (!key) return { ...this.state };

        return key.split('.').reduce((obj, k) => obj?.[k], this.state);
    }

    /**
     * Set state value
     * @param {string} key - State key (supports dot notation)
     * @param {*} value - New value
     */
    set(key, value) {
        const keys = key.split('.');
        let obj = this.state;

        for (let i = 0; i < keys.length - 1; i++) {
            if (!(keys[i] in obj)) {
                obj[keys[i]] = {};
            }
            obj = obj[keys[i]];
        }

        const lastKey = keys[keys.length - 1];
        const oldValue = obj[lastKey];
        obj[lastKey] = value;

        // Emit change event
        this.eventBus.emit(`state:${key}`, { oldValue, newValue: value });
    }

    /**
     * Update multiple state values
     * @param {Object} updates - Object with key-value pairs
     */
    update(updates) {
        Object.entries(updates).forEach(([key, value]) => {
            this.set(key, value);
        });
    }

    /**
     * Reset state to initial values
     */
    reset() {
        this.state.currentCategory = null;
        this.state.currentScenarioId = null;
        this.state.currentScenario = null;
        this.state.conversationHistory = [];
        this.state.customScenario = null;
        this.state.tutorialActive = false;
    }

    /**
     * Add message to conversation history
     * @param {Object} message - Message object
     */
    addMessage(message) {
        this.state.conversationHistory.push({
            ...message,
            timestamp: Date.now()
        });
        this.eventBus.emit(EVENTS.MESSAGE_RECEIVED, message);
    }

    /**
     * Get conversation history
     * @returns {Array} Conversation history
     */
    getConversation() {
        return [...this.state.conversationHistory];
    }

    /**
     * Clear conversation history
     */
    clearConversation() {
        this.state.conversationHistory = [];
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS MANAGER - User preferences with persistence
// ═══════════════════════════════════════════════════════════════════════════════

class SettingsManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.settings = this.load();
    }

    /**
     * Load settings from localStorage
     * @returns {Object} Settings object
     */
    load() {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            if (saved) {
                return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
        return { ...DEFAULT_SETTINGS };
    }

    /**
     * Save settings to localStorage
     */
    save() {
        try {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
            this.eventBus.emit(EVENTS.SETTINGS_CHANGED, this.settings);
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    /**
     * Get a setting value
     * @param {string} key - Setting key
     * @returns {*} Setting value
     */
    get(key) {
        return this.settings[key] ?? DEFAULT_SETTINGS[key];
    }

    /**
     * Set a setting value
     * @param {string} key - Setting key
     * @param {*} value - Setting value
     */
    set(key, value) {
        this.settings[key] = value;
        this.save();
    }

    /**
     * Get all settings
     * @returns {Object} All settings
     */
    getAll() {
        return { ...this.settings };
    }

    /**
     * Reset settings to defaults
     */
    reset() {
        this.settings = { ...DEFAULT_SETTINGS };
        this.save();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROGRESS MANAGER - Track user progress and achievements
// ═══════════════════════════════════════════════════════════════════════════════

class ProgressManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.progress = this.load();
    }

    /**
     * Load progress from localStorage
     * @returns {Object} Progress object
     */
    load() {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.PROGRESS);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('Failed to load progress:', error);
        }
        return this.getInitialProgress();
    }

    /**
     * Get initial progress structure
     * @returns {Object} Initial progress
     */
    getInitialProgress() {
        return {
            completedScenarios: [],
            tutorialProgress: {
                completed: false,
                currentLesson: 0,
                lessonsCompleted: []
            },
            statistics: {
                totalSessions: 0,
                totalTransmissions: 0,
                totalTime: 0,
                scenariosByCategory: {
                    pattern_work: 0,
                    ground_operations: 0,
                    flight_following: 0,
                    emergency: 0,
                    custom: 0
                }
            },
            lastSession: null
        };
    }

    /**
     * Save progress to localStorage
     */
    save() {
        try {
            localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(this.progress));
            this.eventBus.emit(EVENTS.PROGRESS_UPDATED, this.progress);
        } catch (error) {
            console.error('Failed to save progress:', error);
        }
    }

    /**
     * Mark a scenario as completed
     * @param {string} category - Scenario category
     * @param {string} scenarioId - Scenario ID
     */
    completeScenario(category, scenarioId) {
        const key = `${category}:${scenarioId}`;
        if (!this.progress.completedScenarios.includes(key)) {
            this.progress.completedScenarios.push(key);
        }

        if (this.progress.statistics.scenariosByCategory[category] !== undefined) {
            this.progress.statistics.scenariosByCategory[category]++;
        }

        this.save();
    }

    /**
     * Check if a scenario is completed
     * @param {string} category - Scenario category
     * @param {string} scenarioId - Scenario ID
     * @returns {boolean} Whether scenario is completed
     */
    isScenarioCompleted(category, scenarioId) {
        return this.progress.completedScenarios.includes(`${category}:${scenarioId}`);
    }

    /**
     * Update tutorial progress
     * @param {number} lesson - Lesson number
     * @param {boolean} completed - Whether lesson is completed
     */
    updateTutorialProgress(lesson, completed = false) {
        this.progress.tutorialProgress.currentLesson = lesson;
        if (completed && !this.progress.tutorialProgress.lessonsCompleted.includes(lesson)) {
            this.progress.tutorialProgress.lessonsCompleted.push(lesson);
        }
        this.save();
    }

    /**
     * Mark tutorial as complete
     */
    completeTutorial() {
        this.progress.tutorialProgress.completed = true;
        this.save();
    }

    /**
     * Increment transmission count
     */
    incrementTransmissions() {
        this.progress.statistics.totalTransmissions++;
        this.save();
    }

    /**
     * Start a new session
     */
    startSession() {
        this.progress.statistics.totalSessions++;
        this.progress.lastSession = {
            startTime: Date.now(),
            transmissions: 0,
            scenarios: []
        };
        this.save();
    }

    /**
     * End current session
     * @param {number} duration - Session duration in ms
     */
    endSession(duration) {
        this.progress.statistics.totalTime += duration;
        if (this.progress.lastSession) {
            this.progress.lastSession.endTime = Date.now();
            this.progress.lastSession.duration = duration;
        }
        this.save();
    }

    /**
     * Get statistics
     * @returns {Object} Statistics
     */
    getStatistics() {
        return { ...this.progress.statistics };
    }

    /**
     * Reset all progress
     */
    reset() {
        this.progress = this.getInitialProgress();
        this.save();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEW MANAGER - Unified view management
// ═══════════════════════════════════════════════════════════════════════════════

class ViewManager {
    constructor(eventBus, stateManager) {
        this.eventBus = eventBus;
        this.stateManager = stateManager;

        // View element mappings
        this.viewElements = {
            [VIEWS.HOME]: '.main-menu',
            [VIEWS.TRAINING_CATEGORIES]: '.scenario-selection',
            [VIEWS.TRAINING_SCENARIOS]: '#individualScenarioSelection',
            [VIEWS.COMMUNICATION]: '#commInterface',
            [VIEWS.LIVE_ATC]: '#liveAtcInterface',
            [VIEWS.CUSTOM_MODE]: '#customModeInterface',
            [VIEWS.TUTORIAL]: '#tutorialInterface'
        };

        // Breadcrumb labels
        this.viewLabels = {
            [VIEWS.HOME]: 'Home',
            [VIEWS.TRAINING_CATEGORIES]: 'AI Training',
            [VIEWS.TRAINING_SCENARIOS]: 'Scenarios',
            [VIEWS.COMMUNICATION]: 'Training',
            [VIEWS.LIVE_ATC]: 'Live ATC',
            [VIEWS.CUSTOM_MODE]: 'Custom Mode',
            [VIEWS.TUTORIAL]: 'Tutorial'
        };
    }

    /**
     * Navigate to a view
     * @param {string} view - View name from VIEWS constant
     * @param {Object} options - Navigation options
     */
    navigateTo(view, options = {}) {
        const currentView = this.stateManager.get('currentView');

        // Emit pre-navigation event
        this.eventBus.emit(EVENTS.VIEW_CHANGE, { from: currentView, to: view, options });

        // Hide all views
        this.hideAllViews();

        // Show target view
        this.showView(view);

        // Update state
        if (!options.skipHistory) {
            const history = this.stateManager.get('viewHistory') || [];
            history.push(view);
            this.stateManager.set('viewHistory', history);
        }

        this.stateManager.update({
            previousView: currentView,
            currentView: view
        });

        // Update breadcrumbs
        this.updateBreadcrumbs();

        // Update back button
        this.updateBackButton();

        // Emit post-navigation event
        this.eventBus.emit(EVENTS.VIEW_CHANGED, { from: currentView, to: view, options });
    }

    /**
     * Hide all view elements
     */
    hideAllViews() {
        Object.values(this.viewElements).forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.style.display = 'none';
                element.classList.remove('animate__animated', 'animate__fadeIn');
            }
        });
    }

    /**
     * Show a specific view
     * @param {string} view - View name
     */
    showView(view) {
        const selector = this.viewElements[view];
        if (!selector) return;

        const element = document.querySelector(selector);
        if (element) {
            element.style.display = 'block';
            element.classList.add('animate__animated', 'animate__fadeIn', 'animate__faster');

            // Remove animation classes after animation
            setTimeout(() => {
                element.classList.remove('animate__animated', 'animate__fadeIn', 'animate__faster');
            }, 500);
        }
    }

    /**
     * Go back to previous view
     */
    goBack() {
        const history = this.stateManager.get('viewHistory') || [];
        if (history.length > 1) {
            history.pop(); // Remove current
            const previousView = history[history.length - 1];
            this.stateManager.set('viewHistory', history);
            this.navigateTo(previousView, { skipHistory: true });
        }
    }

    /**
     * Go to home view
     */
    goHome() {
        this.stateManager.set('viewHistory', [VIEWS.HOME]);
        this.navigateTo(VIEWS.HOME, { skipHistory: true });
    }

    /**
     * Update breadcrumbs display
     */
    updateBreadcrumbs() {
        const breadcrumbs = document.getElementById('breadcrumbs');
        if (!breadcrumbs) return;

        const history = this.stateManager.get('viewHistory') || [];
        const uniqueHistory = [...new Set(history)]; // Remove duplicates while preserving order

        breadcrumbs.innerHTML = uniqueHistory.map((view, index) => {
            const label = this.viewLabels[view] || view;
            const isActive = index === uniqueHistory.length - 1;
            return `<span class="breadcrumb-item ${isActive ? 'active' : ''}">${label}</span>`;
        }).join('');
    }

    /**
     * Update back button visibility
     */
    updateBackButton() {
        const backButton = document.getElementById('backButton');
        if (!backButton) return;

        const history = this.stateManager.get('viewHistory') || [];
        backButton.style.display = history.length > 1 ? 'flex' : 'none';
    }

    /**
     * Get current view
     * @returns {string} Current view name
     */
    getCurrentView() {
        return this.stateManager.get('currentView');
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

const Utils = {
    /**
     * Safely get DOM element
     * @param {string} selector - CSS selector or ID
     * @returns {HTMLElement|null} Element or null
     */
    $(selector) {
        if (selector.startsWith('#') || selector.startsWith('.')) {
            return document.querySelector(selector);
        }
        return document.getElementById(selector);
    },

    /**
     * Safely get multiple DOM elements
     * @param {string} selector - CSS selector
     * @returns {NodeList} Elements
     */
    $$(selector) {
        return document.querySelectorAll(selector);
    },

    /**
     * Create element with attributes and content
     * @param {string} tag - HTML tag
     * @param {Object} attrs - Attributes
     * @param {string|HTMLElement} content - Content
     * @returns {HTMLElement} Created element
     */
    createElement(tag, attrs = {}, content = '') {
        const element = document.createElement(tag);
        Object.entries(attrs).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'dataset') {
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    element.dataset[dataKey] = dataValue;
                });
            } else if (key.startsWith('on')) {
                element.addEventListener(key.slice(2).toLowerCase(), value);
            } else {
                element.setAttribute(key, value);
            }
        });

        if (typeof content === 'string') {
            element.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            element.appendChild(content);
        }

        return element;
    },

    /**
     * Debounce function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
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

    /**
     * Throttle function
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in ms
     * @returns {Function} Throttled function
     */
    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Format time duration
     * @param {number} ms - Duration in milliseconds
     * @returns {string} Formatted duration
     */
    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        }
        return `${seconds}s`;
    },

    /**
     * Generate random callsign
     * @param {string} prefix - Callsign prefix (default: N)
     * @returns {string} Random callsign
     */
    generateCallsign(prefix = 'N') {
        const numbers = Math.floor(Math.random() * 90000) + 10000;
        const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        return `${prefix}${numbers}${letter}`;
    },

    /**
     * Generate random squawk code
     * @returns {string} 4-digit squawk code
     */
    generateSquawk() {
        return (1200 + Math.floor(Math.random() * 6700)).toString().padStart(4, '0');
    },

    /**
     * Parse phonetic alphabet
     * @param {string} text - Text to convert
     * @returns {string} Phonetic version
     */
    toPhonetic(text) {
        const phonetic = {
            'A': 'Alpha', 'B': 'Bravo', 'C': 'Charlie', 'D': 'Delta',
            'E': 'Echo', 'F': 'Foxtrot', 'G': 'Golf', 'H': 'Hotel',
            'I': 'India', 'J': 'Juliet', 'K': 'Kilo', 'L': 'Lima',
            'M': 'Mike', 'N': 'November', 'O': 'Oscar', 'P': 'Papa',
            'Q': 'Quebec', 'R': 'Romeo', 'S': 'Sierra', 'T': 'Tango',
            'U': 'Uniform', 'V': 'Victor', 'W': 'Whiskey', 'X': 'X-ray',
            'Y': 'Yankee', 'Z': 'Zulu',
            '0': 'Zero', '1': 'One', '2': 'Two', '3': 'Three', '4': 'Four',
            '5': 'Five', '6': 'Six', '7': 'Seven', '8': 'Eight', '9': 'Niner'
        };

        return text.toUpperCase().split('').map(char => phonetic[char] || char).join(' ');
    },

    /**
     * Deep clone object
     * @param {Object} obj - Object to clone
     * @returns {Object} Cloned object
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * Check if speech recognition is supported
     * @returns {boolean} Support status
     */
    isSpeechRecognitionSupported() {
        return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    },

    /**
     * Check if speech synthesis is supported
     * @returns {boolean} Support status
     */
    isSpeechSynthesisSupported() {
        return 'speechSynthesis' in window;
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// APPLICATION CORE - Main application instance
// ═══════════════════════════════════════════════════════════════════════════════

class AppCore {
    constructor() {
        // Initialize core systems
        this.eventBus = new EventBus();
        this.state = new StateManager(this.eventBus);
        this.settings = new SettingsManager(this.eventBus);
        this.progress = new ProgressManager(this.eventBus);
        this.viewManager = new ViewManager(this.eventBus, this.state);

        // Start session tracking
        this.progress.startSession();

        // Setup global error handler
        this.setupErrorHandler();

        // Log initialization
        console.log(`ATC Training System v${APP_VERSION} initialized`);
    }

    /**
     * Setup global error handler
     */
    setupErrorHandler() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.eventBus.emit(EVENTS.ERROR, {
                type: 'runtime',
                message: event.message,
                error: event.error
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.eventBus.emit(EVENTS.ERROR, {
                type: 'promise',
                message: event.reason?.message || 'Unknown error',
                error: event.reason
            });
        });
    }

    /**
     * Get event bus
     * @returns {EventBus} Event bus instance
     */
    getEventBus() {
        return this.eventBus;
    }

    /**
     * Get state manager
     * @returns {StateManager} State manager instance
     */
    getState() {
        return this.state;
    }

    /**
     * Get settings manager
     * @returns {SettingsManager} Settings manager instance
     */
    getSettings() {
        return this.settings;
    }

    /**
     * Get progress manager
     * @returns {ProgressManager} Progress manager instance
     */
    getProgress() {
        return this.progress;
    }

    /**
     * Get view manager
     * @returns {ViewManager} View manager instance
     */
    getViewManager() {
        return this.viewManager;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

// Create global app core instance
let appCore = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    appCore = new AppCore();
    window.appCore = appCore;

    // Expose utilities globally
    window.Utils = Utils;
    window.EVENTS = EVENTS;
    window.VIEWS = VIEWS;
});

// Handle page unload - save session data
window.addEventListener('beforeunload', () => {
    if (appCore) {
        const sessionStart = appCore.state.get('sessionStats.startTime');
        const duration = Date.now() - sessionStart;
        appCore.progress.endSession(duration);
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AppCore,
        EventBus,
        StateManager,
        SettingsManager,
        ProgressManager,
        ViewManager,
        Utils,
        EVENTS,
        VIEWS,
        STORAGE_KEYS,
        DEFAULT_SETTINGS
    };
}
