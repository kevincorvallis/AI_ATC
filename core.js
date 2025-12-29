// AI ATC Training System - Simplified Core

'use strict';

const STORAGE_KEYS = {
    SETTINGS: 'atc_settings',
    PROGRESS: 'atc_progress'
};

const DEFAULT_SETTINGS = {
    speechRate: 0.9,
    autoPlayATC: true,
    difficulty: 'beginner'
};

// Simple Event Bus
class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
        return () => this.off(event, callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
    }

    emit(event, data = null) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(cb => {
                try { cb(data); } catch (e) { console.error(e); }
            });
        }
    }
}

// Settings Manager
class SettingsManager {
    constructor() {
        this.settings = { ...DEFAULT_SETTINGS };
        this.load();
    }

    load() {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            if (stored) {
                this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
            }
        } catch (e) {
            console.error('Failed to load settings:', e);
        }
    }

    save() {
        try {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
        } catch (e) {
            console.error('Failed to save settings:', e);
        }
    }

    get(key) {
        return this.settings[key];
    }

    set(key, value) {
        this.settings[key] = value;
        this.save();
    }

    reset() {
        this.settings = { ...DEFAULT_SETTINGS };
        this.save();
    }
}

// Progress Manager
class ProgressManager {
    constructor() {
        this.progress = {
            totalSessions: 0,
            totalTransmissions: 0,
            startTime: null
        };
        this.load();
    }

    load() {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.PROGRESS);
            if (stored) {
                this.progress = JSON.parse(stored);
            }
        } catch (e) {
            console.error('Failed to load progress:', e);
        }
    }

    save() {
        try {
            localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(this.progress));
        } catch (e) {
            console.error('Failed to save progress:', e);
        }
    }

    incrementSessions() {
        this.progress.totalSessions++;
        this.progress.startTime = Date.now();
        this.save();
    }

    incrementTransmissions() {
        this.progress.totalTransmissions++;
        this.save();
    }

    getStatistics() {
        return {
            totalSessions: this.progress.totalSessions || 0,
            totalTransmissions: this.progress.totalTransmissions || 0
        };
    }

    reset() {
        this.progress = {
            totalSessions: 0,
            totalTransmissions: 0,
            startTime: null
        };
        this.save();
    }
}

// App Core - Main orchestrator
class AppCore {
    constructor() {
        this.eventBus = new EventBus();
        this.settings = new SettingsManager();
        this.progress = new ProgressManager();
    }
}

// Initialize core on load
let appCore = null;
document.addEventListener('DOMContentLoaded', () => {
    appCore = new AppCore();
    window.appCore = appCore;
});
