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
        this.sessionId = 0;
        this.requestController = null;
        this.demoTimer = null;
        this.signalTimer = null;

        // Aviation enhancement modules - will be assigned when ready
        this.stateMachine = null;
        this.feedbackEngine = null;
        this.aviationVisual = null;
        this.phraseologyValidator = null;

        this.views = {
            categories: document.getElementById('categorySelection'),
            scenarios: document.getElementById('scenarioSelection'),
            training: document.getElementById('trainingInterface'),
            departure: document.getElementById('departureLesson')
        };

        this.initEventListeners();

        // Initialize modules after ensuring they're loaded
        this.initModules();
    }

    initModules() {
        this.stateMachine = window.scenarioStateMachine;
        this.feedbackEngine = window.feedbackEngine;
        this.aviationVisual = window.aviationVisual;
        this.phraseologyValidator = window.phraseologyValidator;
        this.applyDifficulty();
        const modeLabel = document.getElementById('modeLabel');
        if (modeLabel) modeLabel.textContent = this.isLiveMode() ? 'Live AI training' : 'Scripted practice · no account required';
    }

    isLiveMode() {
        return typeof ATC_CONFIG !== 'undefined' && ATC_CONFIG.mode === 'live' &&
            /^https:\/\//.test(ATC_CONFIG.apiEndpoint || '');
    }

    cancelPendingResponse() {
        this.sessionId += 1;
        this.requestController?.abort();
        this.requestController = null;
        clearTimeout(this.demoTimer);
        clearTimeout(this.signalTimer);
        this.setWaiting(false);
        document.getElementById('signalIndicator')?.classList.remove('transmitting', 'receiving');
    }

    setWaiting(waiting) {
        this.isWaitingForResponse = waiting;
        const button = document.getElementById('transmitButton');
        if (button) button.disabled = waiting;
        document.getElementById('conversation')?.setAttribute('aria-busy', String(waiting));
    }

    applyDifficulty() {
        const difficulty = window.appCore?.settings.get('difficulty') || 'beginner';
        this.feedbackEngine?.setDifficulty(difficulty);
    }

    // Navigation
    showView(viewName) {
        if (this.currentView === 'departure' && viewName !== 'departure') window.WilcoDeparture?.stop();
        Object.entries(this.views).forEach(([name, el]) => {
            if (el) el.style.display = name === viewName ? 'block' : 'none';
        });
        if (this.currentView === 'training' && viewName !== 'training') this.cancelPendingResponse();
        this.currentView = viewName;
        document.body.classList.toggle('departure-active', viewName === 'departure');
        const skipLink = document.querySelector('.skip-link');
        if (skipLink && this.views[viewName]) skipLink.href = '#' + this.views[viewName].id;
        const heading = this.views[viewName]?.querySelector('h2');
        if (heading) { heading.tabIndex = -1; heading.focus(); }

        const backBtn = document.getElementById('backButton');
        if (backBtn) {
            backBtn.style.display = viewName === 'categories' ? 'none' : 'block';
        }
    }

    goBack() {
        if (this.currentView === 'departure') {
            this.showView('categories');
        } else if (this.currentView === 'training') {
            this.showScenarios(this.currentCategory);
        } else if (this.currentView === 'scenarios') {
            this.showView('categories');
            this.currentCategory = null;
        }
    }

    initEventListeners() {
        document.getElementById('startDepartureLesson')?.addEventListener('click', () => window.WilcoDeparture?.start());
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

        // Demo button
        const demoBtn = document.getElementById('demoButton');
        if (demoBtn) {
            demoBtn.addEventListener('click', () => {
                demoBtn.focus();
                if (window.demoPlayer) {
                    window.demoPlayer.showSelector();
                }
            });
        }

        // Help button
        const helpBtn = document.getElementById('helpButton');
        if (helpBtn) {
            helpBtn.addEventListener('click', () => {
                helpBtn.focus();
                if (window.helpGuide) {
                    window.helpGuide.show();
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
        if (text.length > 1000) { this.updateStatus('Please keep transmissions under 1,000 characters.'); return; }

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
            const card = document.createElement('button');
            card.type = 'button';
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
        this.cancelPendingResponse();
        this.currentCategory = category;
        this.difficultyPromptShown = false;
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

        this.applyDifficulty();
        this.showView('training');
        document.getElementById('pilotInput').value = '';
        document.getElementById('pilotInput')?.focus();
        this.updateStatus('Ready');

        if (window.appCore) {
            window.appCore.progress.incrementSessions();
        }
    }

    handlePilotTransmission(transcript) {
        if (this.isWaitingForResponse || this.currentView !== 'training' || typeof transcript !== 'string' ||
            !transcript.trim() || transcript.length > 1000) return;
        this.setWaiting(true);
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
        const sessionId = this.sessionId;
        if (!this.isLiveMode()) {
            this.handleDemoMode(message, sessionId);
            return;
        }
        const controller = new AbortController();
        this.requestController = controller;
        const timeoutId = setTimeout(() => controller.abort(), ATC_CONFIG.requestTimeoutMs || 15000);
        try {
            const response = await fetch(ATC_CONFIG.apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scenario: this.currentScenario,
                    message,
                    history: this.conversationHistory.slice(0, -1).slice(-20)
                }),
                signal: controller.signal
            });
            if (!response.ok) throw new Error('The live service is unavailable.');
            const data = await response.json();
            if (!data.success || typeof data.atc_response !== 'string' || !data.atc_response.trim() || data.atc_response.length > 10000) {
                throw new Error('The live service returned an invalid response.');
            }
            if (sessionId !== this.sessionId) return;
            this.conversationHistory.push({ role: 'assistant', content: data.atc_response });
            this.handleATCResponse(data.atc_response);
        } catch (error) {
            if (sessionId !== this.sessionId) return;
            this.addMessage('system', 'Live AI is unavailable. This response uses the offline scripted demo.');
            this.handleDemoMode(message, sessionId);
        } finally {
            clearTimeout(timeoutId);
            if (this.requestController === controller) this.requestController = null;
        }
    }

    handleDemoMode(pilotMessage, sessionId = this.sessionId) {
        const response = this.getDemoResponse(pilotMessage);
        this.demoTimer = setTimeout(() => {
            if (sessionId !== this.sessionId) return;
            this.conversationHistory.push({ role: 'assistant', content: response });
            this.handleATCResponse(response);
        }, 450);
    }

    getDemoResponse(pilotMessage) {
        const msg = pilotMessage.toLowerCase();
        const match = pilotMessage.match(/\b(?:N[0-9]{1,5}[A-Z]{0,2}|(?:Cessna|Piper|Skyhawk|Cirrus|Bonanza)\s+[0-9]{2,5}[A-Z]{0,2})\b/i);
        const callsign = match ? match[0] : 'Cessna 12345';
        // These are illustrative responses, never operational clearances.
        if (/mayday|emergency|engine failure|engine rough/.test(msg)) {
            return `${callsign}, roger, say position, persons on board, fuel remaining, and intentions.`;
        }
        if (this.currentScenario === 'emergency') {
            if (/souls|persons|fuel|ambulance/.test(msg)) return `${callsign}, roger, assistance requested. Say your intentions.`;
            if (/radio check/.test(msg)) return `${callsign}, Metro Tower, loud and clear.`;
            return `${callsign}, roger, say position and intentions.`;
        }
        if (this.currentScenario === 'ground_operations') {
            if (/clear of|runway 27 clear/.test(msg)) return `${callsign}, taxi to parking via Alpha.`;
            if (/holding short/.test(msg)) return this.currentScenarioId === 'ground_runway_crossing'
                ? `${callsign}, cross runway 27 at Alpha, report clear.`
                : `${callsign}, contact Tower 118.3.`;
            if (/hold short|holding position|crossing/.test(msg)) return `${callsign}, roger.`;
            if (/taxi/.test(msg)) return `${callsign}, runway 27, taxi via Alpha, hold short runway 27.`;
            return `${callsign}, hold position, say your request.`;
        }
        if (this.currentScenario === 'flight_following') {
            if (/flight following|initial request/.test(msg)) return `${callsign}, squawk 4521, say position, altitude, and destination.`;
            if (/squawk/.test(msg)) return `${callsign}, radar contact, proceed on course.`;
            if (/traffic in sight/.test(msg)) return `${callsign}, roger, traffic no factor.`;
            if (/looking|negative contact/.test(msg)) return `${callsign}, roger, advise when traffic in sight.`;
            if (/frequency|contact seattle/.test(msg)) return `${callsign}, contact Seattle Center 124.5.`;
            if (/class bravo/.test(msg)) return `${callsign}, remain outside Class Bravo, standby.`;
            return `${callsign}, roger, report any changes to your request.`;
        }
        if (/going around/.test(msg)) return `${callsign}, roger, make left traffic runway 27.`;
        if (/cleared/.test(msg)) return `${callsign}, roger, report left downwind.`;
        if (/ready for departure|ready for takeoff/.test(msg)) return `${callsign}, runway 27, cleared for takeoff.`;
        if (/downwind/.test(msg)) return `${callsign}, roger, report base.`;
        if (/base|final/.test(msg)) return `${callsign}, runway 27, cleared ${/touch and go/.test(msg) ? 'touch and go' : 'to land'}.`;
        return `${callsign}, say your position and request.`;
    }

    handleATCResponse(response) {
        this.setWaiting(false);
        const previousATCMessage = this.lastATCMessage;
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
                previousATCMessage,
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

        this.conversationHistory = this.conversationHistory.slice(-100);
        this.updateStatus('Ready');

        this.signalTimer = setTimeout(() => {
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
        while (conversation.children.length > 100) conversation.firstElementChild.remove();
        conversation.scrollTop = conversation.scrollHeight;
    }

    updateStatus(text) {
        const status = document.getElementById('status');
        if (status) status.textContent = text;
    }

    initSettings() {
        const modal = document.getElementById('settingsModal');
        const overlay = document.getElementById('settingsOverlay');

        const closeSettings = () => {
            if (modal) modal.style.display = 'none';
            this.releaseSettingsDialog?.();
            this.releaseSettingsDialog = null;
        };
        document.getElementById('settingsButton')?.addEventListener('click', event => {
            event.currentTarget.focus();
            if (modal) {
                modal.style.display = 'flex';
                this.loadSettings();
                this.releaseSettingsDialog = window.activateDialog(modal, 'Settings', closeSettings);
            }
        });

        document.getElementById('closeSettings')?.addEventListener('click', () => {
            closeSettings();
        });

        overlay?.addEventListener('click', () => {
            closeSettings();
        });

        document.getElementById('saveSettings')?.addEventListener('click', () => {
            this.saveSettings();
            closeSettings();
        });

        document.getElementById('resetProgress')?.addEventListener('click', () => {
            if (confirm('Reset all progress?')) {
                window.appCore?.progress.reset();
                try { localStorage.removeItem('wilco_departure_progress'); } catch { /* Storage is optional. */ }
                const lessonProgress = document.getElementById('departureRecent');
                if (lessonProgress) lessonProgress.textContent = '';
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
            window.appCore?.settings.set('difficulty', newDifficulty);
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
