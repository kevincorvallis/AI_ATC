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
        this.currentScenarioId = null;
        this.conversationHistory = [];
        this.isWaitingForResponse = false;
        this.lastATCMessage = null;

        // Aviation enhancement modules - will be assigned when ready
        this.stateMachine = null;
        this.feedbackEngine = null;
        this.aviationVisual = null;
        this.phraseologyValidator = null;

        this.views = {
            categories: document.getElementById('categorySelection'),
            scenarios: document.getElementById('scenarioSelection'),
            training: document.getElementById('trainingInterface')
        };

        this.initEventListeners();

        // Initialize modules after ensuring they're loaded
        this.initModules();
    }

    initModules() {
        // Wait for all modules to be available
        const checkModules = () => {
            this.stateMachine = window.scenarioStateMachine;
            this.feedbackEngine = window.feedbackEngine;
            this.aviationVisual = window.aviationVisual;
            this.phraseologyValidator = window.phraseologyValidator;

            if (!this.stateMachine || !this.feedbackEngine ||
                !this.aviationVisual || !this.phraseologyValidator) {
                // Retry after a short delay
                setTimeout(checkModules, 50);
            } else {
                console.log('All modules loaded successfully');
            }
        };
        checkModules();
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

    populateSuggestions(category, scenarioId) {
        const suggestionsList = document.getElementById('suggestionsList');
        if (!suggestionsList) return;

        suggestionsList.innerHTML = '';

        const categorySuggestions = SCENARIO_SUGGESTIONS[category];
        if (!categorySuggestions) return;

        const scenarioSuggestions = categorySuggestions[scenarioId];
        if (!scenarioSuggestions || scenarioSuggestions.length === 0) return;

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
        this.currentScenarioId = scenario.id;
        this.conversationHistory = [];
        this.lastATCMessage = null;

        // Initialize aviation systems
        if (this.stateMachine) {
            this.stateMachine.initialize(category);
        }
        if (this.feedbackEngine) {
            this.feedbackEngine.resetSession();
        }
        if (this.aviationVisual) {
            this.aviationVisual.initialize(scenario);
        }

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
                <p><strong>Difficulty:</strong> <span id="difficultyIndicator">Student Pilot</span></p>
                <p style="margin-top: 10px;">Type your transmission below or click a suggestion.</p>
            </div>
        `;

        // Populate suggestions
        this.populateSuggestions(category, scenario.id);

        // Update visual interface
        if (this.aviationVisual) {
            const state = this.stateMachine?.getCurrentState();
            if (state) {
                this.aviationVisual.updateProgress(state);
            }
        }

        // Focus input
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

        // Increment transmission counter (for both API and demo mode)
        if (window.appCore) {
            window.appCore.progress.incrementTransmissions();
        }

        this.sendToATC(transcript);
    }

    async sendToATC(message) {
        try {
            if (!API_ENDPOINT || API_ENDPOINT === 'YOUR_API_ENDPOINT_HERE/atc') {
                console.warn('API endpoint not configured, using demo mode');
                this.addMessage('system', '⚠️ Demo mode: API not configured');
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
                console.error(`API error: ${response.status} ${response.statusText}`);
                this.addMessage('system', `⚠️ API error (${response.status}), switching to demo mode`);
                this.handleDemoMode(message);
                return;
            }

            const data = await response.json();
            if (data.success) {
                this.conversationHistory.push({ role: 'assistant', content: data.atc_response });
                this.handleATCResponse(data.atc_response);
            } else {
                console.error('API returned success:false:', data.error);
                this.addMessage('system', `⚠️ ${data.error || 'API error'}, switching to demo mode`);
                this.handleDemoMode(message);
            }
        } catch (error) {
            const errorMsg = error.name === 'AbortError' ?
                'Request timeout (15s)' :
                `Network error: ${error.message}`;
            console.error('API call failed:', errorMsg);
            this.addMessage('system', `⚠️ ${errorMsg}, switching to demo mode`);
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

        setTimeout(() => this.handleATCResponse(response), 600);
    }

    handleATCResponse(response) {
        this.isWaitingForResponse = false;
        this.lastATCMessage = response;
        document.getElementById('signalIndicator')?.classList.remove('transmitting');
        document.getElementById('signalIndicator')?.classList.add('receiving');
        this.addMessage('atc', response);

        // Get the last pilot message
        const lastPilotMessage = this.conversationHistory
            .filter(m => m.role === 'user')
            .pop()?.content || '';

        // Update state machine with the conversation
        if (this.stateMachine) {
            const state = this.stateMachine.update(lastPilotMessage, response);

            // Update visual interface
            if (this.aviationVisual) {
                this.aviationVisual.updateProgress(state);
                const hint = this.stateMachine.getCurrentHint();
                if (hint) {
                    this.aviationVisual.updateNextAction(hint);
                }
            }
        }

        // Generate and display feedback
        if (this.feedbackEngine && lastPilotMessage) {
            const scenarioState = this.stateMachine?.getCurrentState();
            const feedbackData = this.feedbackEngine.processFeedback(
                lastPilotMessage,
                this.lastATCMessage,
                scenarioState
            );

            // Display feedback
            this.feedbackEngine.displayFeedback(feedbackData);

            // Check if difficulty adjustment is suggested
            const difficultyAdjustment = this.feedbackEngine.suggestDifficultyAdjustment();
            if (difficultyAdjustment && this.conversationHistory.length >= 20) {
                this.showDifficultyAdjustmentPrompt(difficultyAdjustment);
            }
        }

        this.updateStatus('Ready');

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

    initSettings() {
        const modal = document.getElementById('settingsModal');
        const overlay = document.getElementById('settingsOverlay');

        document.getElementById('settingsButton')?.addEventListener('click', () => {
            if (modal) {
                modal.style.display = 'flex';
                this.loadSettings();
            }
        });

        document.getElementById('closeSettings')?.addEventListener('click', () => {
            if (modal) modal.style.display = 'none';
        });

        overlay?.addEventListener('click', () => {
            if (modal) modal.style.display = 'none';
        });

        document.getElementById('saveSettings')?.addEventListener('click', () => {
            this.saveSettings();
            if (modal) modal.style.display = 'none';
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

        const stats = window.appCore.progress.getStatistics();
        const sessions = document.getElementById('statSessions');
        const transmissions = document.getElementById('statTransmissions');
        if (sessions) sessions.textContent = stats.totalSessions || 0;
        if (transmissions) transmissions.textContent = stats.totalTransmissions || 0;

        // Load difficulty setting
        const savedDifficulty = window.appCore.settings.get('difficulty') || 'beginner';
        const difficultySelect = document.getElementById('difficultySelect');
        if (difficultySelect) {
            difficultySelect.value = savedDifficulty;
        }

        // Apply difficulty to feedbackEngine
        if (this.feedbackEngine) {
            this.feedbackEngine.setDifficulty(savedDifficulty);
        } else {
            // Retry after modules load
            setTimeout(() => {
                if (this.feedbackEngine) {
                    this.feedbackEngine.setDifficulty(savedDifficulty);
                }
            }, 100);
        }
    }

    saveSettings() {
        // Save difficulty preference
        const difficultySelect = document.getElementById('difficultySelect');
        if (difficultySelect && this.feedbackEngine && window.appCore) {
            const difficulty = difficultySelect.value;
            this.feedbackEngine.setDifficulty(difficulty);
            window.appCore.settings.set('difficulty', difficulty);
        }
    }

    showDifficultyAdjustmentPrompt(adjustment) {
        // Only show once per session
        if (this.difficultyPromptShown) return;
        this.difficultyPromptShown = true;

        const conversation = document.getElementById('conversation');
        const promptDiv = document.createElement('div');
        promptDiv.className = 'message system-message difficulty-prompt';

        const title = document.createElement('p');
        title.innerHTML = '<strong>Performance Update</strong>';

        const reason = document.createElement('p');
        reason.textContent = adjustment.reason;

        const upgradeBtn = document.createElement('button');
        upgradeBtn.className = 'btn-primary';
        upgradeBtn.textContent = `Switch to ${adjustment.suggested.charAt(0).toUpperCase() + adjustment.suggested.slice(1)}`;
        upgradeBtn.addEventListener('click', () => {
            this.adjustDifficulty(adjustment.suggested);
        });

        const stayBtn = document.createElement('button');
        stayBtn.className = 'btn-secondary';
        stayBtn.textContent = 'Stay at current level';
        stayBtn.addEventListener('click', () => {
            promptDiv.remove();
        });

        promptDiv.appendChild(title);
        promptDiv.appendChild(reason);
        promptDiv.appendChild(upgradeBtn);
        promptDiv.appendChild(stayBtn);

        conversation.appendChild(promptDiv);
        conversation.scrollTop = conversation.scrollHeight;
    }

    adjustDifficulty(newDifficulty) {
        if (this.feedbackEngine) {
            this.feedbackEngine.setDifficulty(newDifficulty);
            const difficultySelect = document.getElementById('difficultySelect');
            if (difficultySelect) {
                difficultySelect.value = newDifficulty;
            }
            this.addMessage('system', `Difficulty adjusted to ${newDifficulty}. ${
                newDifficulty === 'advanced' ? 'You will now receive minimal feedback - fly like a pro!' :
                newDifficulty === 'intermediate' ? 'You will receive moderate feedback on important items.' :
                'You will receive detailed feedback on every transmission.'
            }`);
        }
        // Remove difficulty prompt
        document.querySelector('.difficulty-prompt')?.remove();
    }
}

// Initialize
let atcApp = null;
document.addEventListener('DOMContentLoaded', () => {
    atcApp = new ATCTrainingApp();
    window.atcApp = atcApp;
});
