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
                const value = JSON.parse(stored);
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    if (['beginner', 'intermediate', 'advanced'].includes(value.difficulty)) {
                        this.settings.difficulty = value.difficulty;
                    }
                    if (typeof value.autoPlayATC === 'boolean') this.settings.autoPlayATC = value.autoPlayATC;
                    if (Number.isFinite(value.speechRate) && value.speechRate >= 0.5 && value.speechRate <= 2) {
                        this.settings.speechRate = value.speechRate;
                    }
                }
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
        if (!Object.hasOwn(DEFAULT_SETTINGS, key)) return;
        if (key === 'difficulty' && !['beginner', 'intermediate', 'advanced'].includes(value)) return;
        if (key === 'autoPlayATC' && typeof value !== 'boolean') return;
        if (key === 'speechRate' && (!Number.isFinite(value) || value < 0.5 || value > 2)) return;
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
                const value = JSON.parse(stored);
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    for (const key of ['totalSessions', 'totalTransmissions']) {
                        if (Number.isSafeInteger(value[key]) && value[key] >= 0) this.progress[key] = value[key];
                    }
                    if (Number.isFinite(value.startTime) && value.startTime > 0) this.progress.startTime = value.startTime;
                }
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

// Shared keyboard behavior for modal dialogs, including focus restoration.
window.activateDialog = function activateDialog(modal, label, onClose) {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const inertElements = Array.from(document.body.children).filter(element =>
        element !== modal && !element.contains(modal) && !element.inert);
    const container = document.querySelector('.container');
    if (container && container.contains(modal)) {
        inertElements.push(...Array.from(container.children).filter(element => element !== modal && !element.inert));
    }
    inertElements.forEach(element => { element.inert = true; });
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', label);
    modal.tabIndex = -1;
    modal.querySelectorAll('.close-btn').forEach(button => button.setAttribute('aria-label', 'Close ' + label));
    document.body.style.overflow = 'hidden';
    const focusable = () => Array.from(modal.querySelectorAll('button, input, select, a[href], [tabindex="0"]'))
        .filter(element => !element.disabled && element.getClientRects().length > 0);
    const onKey = event => {
        if (event.key === 'Escape') {
            event.preventDefault();
            onClose();
        } else if (event.key === 'Tab') {
            const elements = focusable();
            if (!elements.length) { event.preventDefault(); modal.focus(); return; }
            const first = elements[0];
            const last = elements[elements.length - 1];
            if (event.shiftKey && (document.activeElement === first || !elements.includes(document.activeElement))) {
                event.preventDefault(); last.focus();
            } else if (!event.shiftKey && (document.activeElement === last || !elements.includes(document.activeElement))) {
                event.preventDefault(); first.focus();
            }
        }
    };
    modal.addEventListener('keydown', onKey);
    (focusable()[0] || modal).focus();
    return () => {
        modal.removeEventListener('keydown', onKey);
        inertElements.forEach(element => { element.inert = false; });
        document.body.style.overflow = previousOverflow;
        if (previousFocus?.isConnected) previousFocus.focus();
    };
};
