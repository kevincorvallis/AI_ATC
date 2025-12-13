// AI ATC Training System - Simplified Main Application

// Scenario-specific suggestions for quick transmission
const SCENARIO_SUGGESTIONS = {
    pattern_work: {
        pattern_first_solo: [
            "Metro Tower, Cessna 12345, ready for departure runway 27, remaining in the pattern",
            "Metro Tower, Cessna 12345, left downwind runway 27",
            "Metro Tower, Cessna 12345, turning left base runway 27, full stop"
        ],
        pattern_touch_go: [
            "Metro Tower, Cessna 12345, left downwind runway 27, touch and go",
            "Metro Tower, Cessna 12345, turning left base runway 27",
            "Metro Tower, Cessna 12345, going around"
        ],
        pattern_crosswind: [
            "Metro Tower, Cessna 12345, ready for departure runway 27",
            "Metro Tower, Cessna 12345, left downwind runway 27, request wind check",
            "Metro Tower, Cessna 12345, short final runway 27, full stop"
        ],
        pattern_busy: [
            "Metro Tower, Cessna 12345, left downwind runway 27, number 2",
            "Metro Tower, Cessna 12345, traffic in sight",
            "Metro Tower, Cessna 12345, extending downwind"
        ],
        pattern_night: [
            "Metro Tower, Cessna 12345, ready for departure runway 27, night pattern",
            "Metro Tower, Cessna 12345, left downwind runway 27, runway in sight",
            "Metro Tower, Cessna 12345, short final runway 27, full stop"
        ]
    },
    ground_operations: {
        ground_first_taxi: [
            "Metro Ground, Cessna 12345, at the FBO, ready to taxi with information Alpha",
            "Cessna 12345, holding short runway 27",
            "Metro Ground, Cessna 12345, clear of runway 27"
        ],
        ground_complex_taxi: [
            "Metro Ground, Cessna 12345, at terminal 2, taxi to runway 27 with information Bravo",
            "Cessna 12345, confirm taxi via Alpha, Bravo, hold short runway 27",
            "Metro Ground, Cessna 12345, request progressive taxi"
        ],
        ground_runway_crossing: [
            "Metro Ground, Cessna 12345, holding short runway 27",
            "Cessna 12345, crossing runway 27",
            "Metro Ground, Cessna 12345, runway 27 clear"
        ],
        ground_busy_ramp: [
            "Metro Ground, Cessna 12345, at the west ramp, ready to taxi",
            "Cessna 12345, holding position",
            "Metro Ground, Cessna 12345, traffic in sight on the ramp"
        ],
        ground_progressive: [
            "Metro Ground, Cessna 12345, unfamiliar, request progressive taxi to runway 27",
            "Cessna 12345, roger, turning left",
            "Cessna 12345, holding short runway 27"
        ]
    },
    flight_following: {
        ff_initial_request: [
            "Seattle Center, Cessna 12345, request VFR flight following",
            "Cessna 12345, level 4,500, destination Portland",
            "Cessna 12345, squawking 4521"
        ],
        ff_position_reports: [
            "Seattle Center, Cessna 12345, position report",
            "Cessna 12345, level 5,500, 30 miles south of Seattle",
            "Cessna 12345, request altitude change to 6,500"
        ],
        ff_traffic_advisories: [
            "Cessna 12345, traffic in sight",
            "Cessna 12345, looking for traffic",
            "Cessna 12345, negative contact, request vectors"
        ],
        ff_class_b_transition: [
            "Seattle Approach, Cessna 12345, request Class Bravo transition",
            "Cessna 12345, squawking 0452",
            "Cessna 12345, cleared through Class Bravo as requested"
        ],
        ff_frequency_change: [
            "Cessna 12345, ready to copy new frequency",
            "Cessna 12345, contact Seattle Center 124.5",
            "Seattle Center, Cessna 12345, level 5,500"
        ]
    },
    emergency: {
        emerg_engine_failure: [
            "Mayday mayday mayday, Cessna 12345, engine failure",
            "Cessna 12345, 2 souls on board, 2 hours fuel",
            "Cessna 12345, airport in sight, request direct"
        ],
        emerg_lost_comms: [
            "Metro Tower, Cessna 12345, radio check",
            "Metro Tower, Cessna 12345, if you read, ident",
            "Cessna 12345, squawking 7600"
        ],
        emerg_low_fuel: [
            "Metro Tower, Cessna 12345, minimum fuel",
            "Cessna 12345, 20 minutes fuel remaining",
            "Cessna 12345, request priority handling"
        ],
        emerg_weather_diversion: [
            "Seattle Center, Cessna 12345, request diversion due weather",
            "Cessna 12345, request vectors to nearest suitable airport",
            "Cessna 12345, weather ahead, unable direct"
        ],
        emerg_medical: [
            "Mayday mayday mayday, Cessna 12345, medical emergency",
            "Cessna 12345, passenger medical emergency, request immediate landing",
            "Cessna 12345, 3 souls on board, need ambulance on arrival"
        ]
    }
};

class ATCTrainingApp {
    constructor() {
        this.currentView = 'categories';
        this.currentCategory = null;
        this.currentScenario = null;
        this.conversationHistory = [];
<<<<<<< HEAD
        this.synthesis = window.speechSynthesis;
        this.isSpeaking = false;
        this.isWaitingForResponse = false;
=======
        this.isWaitingForResponse = false;

        this.views = {
            categories: document.getElementById('categorySelection'),
            scenarios: document.getElementById('scenarioSelection'),
            training: document.getElementById('trainingInterface')
        };
>>>>>>> 03ae722809db7f308313d0a8422c44a760d9678e

        this.initEventListeners();
    }

<<<<<<< HEAD
=======
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

>>>>>>> 03ae722809db7f308313d0a8422c44a760d9678e
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
<<<<<<< HEAD
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

        // Change scenario button
        document.getElementById('changeScenario').addEventListener('click', () => {
            this.showScenarioSelection();
        });

        // Toggle reference guide
        document.getElementById('toggleReference').addEventListener('click', () => {
            const content = document.getElementById('referenceContent');
            const button = document.getElementById('toggleReference');
            if (content.style.display === 'none') {
                content.style.display = 'block';
                button.textContent = 'Hide Phraseology Guide';
            } else {
                content.style.display = 'none';
                button.textContent = 'Show Phraseology Guide';
            }
        });
=======
        }

        // Settings
        this.initSettings();
>>>>>>> 03ae722809db7f308313d0a8422c44a760d9678e
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
<<<<<<< HEAD
                <p><strong>Scenario Started:</strong> ${scenarioDetails.name}</p>
                <p>${scenarioDetails.description}</p>
                <p><strong>Difficulty:</strong> <span class="difficulty">${scenarioDetails.difficulty}</span></p>
                <p><strong>Conditions:</strong> ${scenarioDetails.conditions}</p>
                <div style="background: rgba(245, 158, 11, 0.1); padding: 12px; border-radius: 6px; margin-top: 12px;">
                    <p style="margin: 0;"><strong>💡 Tip:</strong> ${scenarioDetails.tips}</p>
                </div>
                ${modeMessage}
                <p style="margin-top: 12px;">Type your transmission below or click a suggestion to begin.</p>
            </div>
        `;

        conversation.innerHTML = scenarioInfo;

        // Populate suggestions for this scenario
        this.populateSuggestions(category, scenarioId);

        // Show communication interface
        document.querySelector('.main-menu').style.display = 'none';
        document.querySelector('.scenario-selection').style.display = 'none';
        document.getElementById('individualScenarioSelection').style.display = 'none';
        document.getElementById('liveAtcInterface').style.display = 'none';
        document.getElementById('commInterface').style.display = 'block';
=======
                <p><strong>${scenario.name}</strong></p>
                <p>${scenario.description}</p>
                <p><strong>Conditions:</strong> ${scenario.conditions}</p>
                <p style="margin-top: 10px;">Type your transmission below and press Enter or click Transmit.</p>
            </div>
        `;

        // Focus the input field
        document.getElementById('pilotInput')?.focus();
>>>>>>> 03ae722809db7f308313d0a8422c44a760d9678e

        this.showView('training');
        this.updateStatus('Ready');

<<<<<<< HEAD
    showScenarioSelection() {
        document.querySelector('.scenario-selection').style.display = 'block';
        document.getElementById('individualScenarioSelection').style.display = 'none';
        document.getElementById('commInterface').style.display = 'none';
        this.currentCategory = null;
        this.currentScenario = null;
        this.currentScenarioId = null;
        this.conversationHistory = [];
    }

    handleTextTransmission() {
        const pilotInput = document.getElementById('pilotInput');
        if (!pilotInput) return;

        const text = pilotInput.value.trim();
        if (!text || this.isWaitingForResponse || this.isSpeaking) return;

        // Clear input
        pilotInput.value = '';

        // Process the transmission
        this.handlePilotTransmission(text);
    }

    populateSuggestions(category, scenarioId) {
        const suggestionsList = document.getElementById('suggestionsList');
        if (!suggestionsList) return;

        // Clear existing suggestions
        suggestionsList.innerHTML = '';

        // Get suggestions for this scenario
        const categorySuggestions = SCENARIO_SUGGESTIONS[category];
        if (!categorySuggestions) return;

        const scenarioSuggestions = categorySuggestions[scenarioId];
        if (!scenarioSuggestions || scenarioSuggestions.length === 0) return;

        // Create suggestion chips
        scenarioSuggestions.forEach(suggestion => {
            const chip = document.createElement('button');
            chip.className = 'suggestion-chip';
            chip.textContent = suggestion;
            chip.addEventListener('click', () => {
                const pilotInput = document.getElementById('pilotInput');
                if (pilotInput) {
                    pilotInput.value = suggestion;
                    pilotInput.focus();
                }
            });
            suggestionsList.appendChild(chip);
        });
=======
        if (window.appCore) {
            window.appCore.progress.incrementSessions();
        }
>>>>>>> 03ae722809db7f308313d0a8422c44a760d9678e
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

<<<<<<< HEAD
    showMainMenu() {
        document.querySelector('.main-menu').style.display = 'block';
        document.querySelector('.scenario-selection').style.display = 'none';
        document.getElementById('liveAtcInterface').style.display = 'none';
        document.getElementById('commInterface').style.display = 'none';

        // Hide custom mode if it exists
        const customInterface = document.getElementById('customModeInterface');
        if (customInterface) {
            customInterface.style.display = 'none';
        }
    }

    showTrainingMode() {
        document.querySelector('.main-menu').style.display = 'none';
        document.querySelector('.scenario-selection').style.display = 'block';
        document.getElementById('liveAtcInterface').style.display = 'none';
        document.getElementById('commInterface').style.display = 'none';
    }

    showLiveAtcMode() {
        document.querySelector('.main-menu').style.display = 'none';
        document.querySelector('.scenario-selection').style.display = 'none';
        document.getElementById('individualScenarioSelection').style.display = 'none';
        document.getElementById('liveAtcInterface').style.display = 'block';
        document.getElementById('commInterface').style.display = 'none';

        // Initialize live ATC player
        initLiveATC();
    }

    showCategorySelection() {
        document.querySelector('.main-menu').style.display = 'none';
        document.querySelector('.scenario-selection').style.display = 'block';
        document.getElementById('individualScenarioSelection').style.display = 'none';
        document.getElementById('liveAtcInterface').style.display = 'none';
        document.getElementById('commInterface').style.display = 'none';
    }

    showIndividualScenarios(category) {
        this.currentCategory = category;

        // Get scenario data
        const categoryData = getScenariosForCategory(category);
        if (!categoryData) return;

        // Update title
        document.getElementById('categoryTitle').textContent = categoryData.name;

        // Populate scenarios
        const container = document.getElementById('individualScenariosContainer');
        container.innerHTML = '';

        categoryData.scenarios.forEach(scenario => {
            const scenarioCard = document.createElement('div');
            scenarioCard.className = 'individual-scenario-card';
            scenarioCard.dataset.scenarioId = scenario.id;

            const difficultyClass = scenario.difficulty.toLowerCase();

            scenarioCard.innerHTML = `
                <div class="scenario-icon">${scenario.icon}</div>
                <div class="scenario-details">
                    <h3>${scenario.name}</h3>
                    <p class="scenario-description">${scenario.description}</p>
                    <div class="scenario-meta">
                        <span class="difficulty difficulty-${difficultyClass}">${scenario.difficulty}</span>
                        <span class="conditions">📍 ${scenario.conditions}</span>
                    </div>
                    <p class="scenario-tip">💡 ${scenario.tips}</p>
                </div>
            `;

            scenarioCard.addEventListener('click', () => {
                this.startScenario(category, scenario.id);
            });

            container.appendChild(scenarioCard);
=======
    // Settings
    initSettings() {
        const modal = document.getElementById('settingsModal');
        const overlay = document.getElementById('settingsOverlay');

        document.getElementById('settingsButton')?.addEventListener('click', () => {
            modal.style.display = 'flex';
            this.loadSettings();
>>>>>>> 03ae722809db7f308313d0a8422c44a760d9678e
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
