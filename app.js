// AI ATC Training System - Simplified Main Application

class ATCTrainingApp {
    constructor() {
        this.currentView = 'categories';
        this.currentCategory = null;
        this.currentScenario = null;
        this.conversationHistory = [];
        this.isWaitingForResponse = false;

        this.views = {
            categories: document.getElementById('categorySelection'),
            scenarios: document.getElementById('scenarioSelection'),
            training: document.getElementById('trainingInterface')
        };

        this.initEventListeners();
    }

    // Navigation
    showView(viewName) {
        Object.entries(this.views).forEach(([name, el]) => {
            if (el) el.style.display = name === viewName ? 'block' : 'none';
        });
        this.currentView = viewName;

        const backBtn = document.getElementById('backButton');
        if (backBtn) {
            backBtn.style.display = viewName === 'categories' ? 'none' : 'block';
        }
    }

    goBack() {
        if (this.currentView === 'training') {
            this.showView('scenarios');
        } else if (this.currentView === 'scenarios') {
            this.showView('categories');
            this.currentCategory = null;
        }
    }

    initEventListeners() {
        // Back button
        document.getElementById('backButton')?.addEventListener('click', () => this.goBack());

        // Category cards
        document.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', () => {
                const category = card.dataset.category;
                if (category) this.showScenarios(category);
            });
        });

        // Text input for transmissions
        const pilotInput = document.getElementById('pilotInput');
        const transmitButton = document.getElementById('transmitButton');

        if (transmitButton) {
            transmitButton.addEventListener('click', () => this.handleTextTransmission());
        }

        if (pilotInput) {
            pilotInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleTextTransmission();
                }
            });
        }

        // Settings
        this.initSettings();
    }

    handleTextTransmission() {
        const input = document.getElementById('pilotInput');
        const text = input?.value.trim();

        if (!text || !this.currentScenario || this.isWaitingForResponse) return;

        input.value = '';
        this.handlePilotTransmission(text);
    }

    showScenarios(category) {
        this.currentCategory = category;
        const categoryData = getScenariosForCategory(category);
        if (!categoryData) return;

        document.getElementById('categoryTitle').textContent = categoryData.name;

        const container = document.getElementById('scenariosContainer');
        container.innerHTML = '';

        categoryData.scenarios.forEach(scenario => {
            const card = document.createElement('div');
            card.className = 'scenario-card';
            card.innerHTML = `
                <h3>${scenario.icon} ${scenario.name}</h3>
                <p>${scenario.description}</p>
                <span class="difficulty">${scenario.difficulty}</span>
            `;
            card.addEventListener('click', () => this.startScenario(category, scenario));
            container.appendChild(card);
        });

        this.showView('scenarios');
    }

    startScenario(category, scenario) {
        this.currentScenario = category;
        this.conversationHistory = [];

        const frequencies = {
            pattern_work: '118.300',
            ground_operations: '121.900',
            flight_following: '124.350',
            emergency: '121.500'
        };

        document.getElementById('currentScenarioTitle').textContent = `${scenario.icon} ${scenario.name}`;
        document.getElementById('currentScenarioDesc').textContent = scenario.description;
        document.getElementById('frequency').textContent = frequencies[category] || '118.300';

        const conversation = document.getElementById('conversation');
        conversation.innerHTML = `
            <div class="message system-message">
                <p><strong>${scenario.name}</strong></p>
                <p>${scenario.description}</p>
                <p><strong>Conditions:</strong> ${scenario.conditions}</p>
                <p style="margin-top: 10px;">Type your transmission below and press Enter or click Transmit.</p>
            </div>
        `;

        // Focus the input field
        document.getElementById('pilotInput')?.focus();

        this.showView('training');
        this.updateStatus('Ready');

        if (window.appCore) {
            window.appCore.progress.incrementSessions();
        }
    }

    handlePilotTransmission(transcript) {
        this.isWaitingForResponse = true;
        this.addMessage('pilot', transcript);
        this.conversationHistory.push({ role: 'user', content: transcript });
        this.updateStatus('Waiting for ATC...');
        document.getElementById('signalIndicator')?.classList.add('transmitting');
        this.sendToATC(transcript);
    }

    async sendToATC(message) {
        try {
            if (!API_ENDPOINT || API_ENDPOINT === 'YOUR_API_ENDPOINT_HERE/atc') {
                this.handleDemoMode(message);
                return;
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scenario: this.currentScenario,
                    message: message,
                    history: this.conversationHistory.slice(-20)
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                this.handleDemoMode(message);
                return;
            }

            const data = await response.json();
            if (data.success) {
                this.conversationHistory.push({ role: 'assistant', content: data.atc_response });
                this.handleATCResponse(data.atc_response);
            } else {
                this.handleDemoMode(message);
            }
        } catch (error) {
            this.handleDemoMode(message);
        }
    }

    handleDemoMode(pilotMessage) {
        const msg = pilotMessage.toLowerCase();
        let callsign = 'Cessna 12345';
        const match = pilotMessage.match(/([A-Z]-?[A-Z]{4}|N\d{3,5}[A-Z]?|[A-Za-z]+\s*\d{2,5})/i);
        if (match) callsign = match[1].toUpperCase();

        let response = '';

        if (msg.includes('ready for departure') || msg.includes('ready for takeoff')) {
            response = `${callsign}, runway 27, cleared for takeoff, wind 270 at 8.`;
        } else if (msg.includes('downwind')) {
            response = `${callsign}, roger, report base.`;
        } else if (msg.includes('base') || msg.includes('final')) {
            response = `${callsign}, cleared to land runway 27.`;
        } else if (msg.includes('taxi')) {
            response = `${callsign}, taxi to runway 27 via Alpha, hold short.`;
        } else if (msg.includes('flight following')) {
            response = `${callsign}, squawk 4521, radar contact, proceed on course.`;
        } else if (msg.includes('mayday') || msg.includes('emergency')) {
            response = `${callsign}, roger mayday, say souls and fuel. Emergency equipment standing by.`;
        } else {
            const defaults = {
                pattern_work: `${callsign}, roger, continue.`,
                ground_operations: `${callsign}, hold position.`,
                flight_following: `${callsign}, radar contact.`,
                emergency: `${callsign}, say intentions.`
            };
            response = defaults[this.currentScenario] || `${callsign}, roger.`;
        }

        this.conversationHistory.push({ role: 'assistant', content: response });

        if (window.appCore) {
            window.appCore.progress.incrementTransmissions();
        }

        setTimeout(() => this.handleATCResponse(response), 600);
    }

    handleATCResponse(response) {
        this.isWaitingForResponse = false;
        document.getElementById('signalIndicator')?.classList.remove('transmitting');
        document.getElementById('signalIndicator')?.classList.add('receiving');
        this.addMessage('atc', response);
        this.updateStatus('Ready');

        // Brief visual indicator that ATC responded
        setTimeout(() => {
            document.getElementById('signalIndicator')?.classList.remove('receiving');
        }, 1000);
    }

    addMessage(sender, text) {
        const conversation = document.getElementById('conversation');
        const div = document.createElement('div');
        div.className = `message ${sender}-message`;

        if (sender !== 'system') {
            const label = document.createElement('strong');
            label.textContent = sender === 'pilot' ? 'You: ' : 'ATC: ';
            div.appendChild(label);
        }
        div.appendChild(document.createTextNode(text));

        conversation.appendChild(div);
        conversation.scrollTop = conversation.scrollHeight;
    }

    updateStatus(text) {
        const status = document.getElementById('status');
        if (status) status.textContent = text;
    }

    // Settings
    initSettings() {
        const modal = document.getElementById('settingsModal');
        const overlay = document.getElementById('settingsOverlay');

        document.getElementById('settingsButton')?.addEventListener('click', () => {
            modal.style.display = 'flex';
            this.loadSettings();
        });

        document.getElementById('closeSettings')?.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        overlay?.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        document.getElementById('saveSettings')?.addEventListener('click', () => {
            this.saveSettings();
            modal.style.display = 'none';
        });

        document.getElementById('resetProgress')?.addEventListener('click', () => {
            if (confirm('Reset all progress?')) {
                window.appCore?.progress.reset();
                this.loadSettings();
            }
        });
    }

    loadSettings() {
        if (!window.appCore) return;

        // Stats
        const stats = window.appCore.progress.getStatistics();
        const sessions = document.getElementById('statSessions');
        const transmissions = document.getElementById('statTransmissions');
        if (sessions) sessions.textContent = stats.totalSessions || 0;
        if (transmissions) transmissions.textContent = stats.totalTransmissions || 0;
    }

    saveSettings() {
        // No settings to save currently
    }
}

// Initialize
let atcApp = null;
document.addEventListener('DOMContentLoaded', () => {
    atcApp = new ATCTrainingApp();
    window.atcApp = atcApp;
});
