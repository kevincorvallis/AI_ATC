// AI ATC Training System - Main Application Logic

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
        this.currentCategory = null;
        this.currentScenario = null;
        this.currentScenarioId = null;
        this.conversationHistory = [];
        this.synthesis = window.speechSynthesis;
        this.isSpeaking = false;
        this.isWaitingForResponse = false;

        this.initEventListeners();
    }

    initEventListeners() {
        // Main menu navigation
        document.getElementById('trainingModeBtn').addEventListener('click', () => {
            this.showTrainingMode();
        });

        document.getElementById('customModeBtn').addEventListener('click', () => {
            this.showCustomMode();
        });

        document.getElementById('tutorialModeBtn').addEventListener('click', () => {
            this.showTutorialMode();
        });

        document.getElementById('liveAtcModeBtn').addEventListener('click', () => {
            this.showLiveAtcMode();
        });

        // Random buttons
        document.getElementById('randomScenarioBtn').addEventListener('click', () => {
            this.startRandomScenario();
        });

        document.getElementById('randomAirportBtn').addEventListener('click', () => {
            this.playRandomAirport();
        });

        // Map toggle
        document.getElementById('toggleMapBtn').addEventListener('click', () => {
            this.toggleAirportMap();
        });

        document.getElementById('closeMapBtn').addEventListener('click', () => {
            this.toggleAirportMap();
        });

        document.getElementById('backToMainMenu').addEventListener('click', () => {
            this.showMainMenu();
        });

        document.getElementById('backToMainMenuFromLive').addEventListener('click', () => {
            this.showMainMenu();
        });

        document.getElementById('backToCategories').addEventListener('click', () => {
            this.showCategorySelection();
        });

        // Category selection (Pattern Work, Ground Ops, etc.)
        document.querySelectorAll('.scenario-card[data-category]').forEach(card => {
            // Add accessibility attributes
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            card.setAttribute('aria-label', `Select ${card.querySelector('h3')?.textContent || 'scenario'} category`);

            card.addEventListener('click', (e) => {
                const category = e.currentTarget.dataset.category;
                this.showIndividualScenarios(category);
            });

            // Keyboard navigation - Enter/Space to select
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const category = e.currentTarget.dataset.category;
                    this.showIndividualScenarios(category);
                }
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
    }

    startScenario(category, scenarioId) {
        this.currentCategory = category;
        this.currentScenario = category; // Keep for backward compatibility
        this.currentScenarioId = scenarioId;
        this.conversationHistory = [];

        // Get scenario details
        const scenarioDetails = getScenarioDetails(category, scenarioId);
        const categoryData = getScenariosForCategory(category);

        if (!scenarioDetails || !categoryData) {
            console.error('Scenario not found:', category, scenarioId);
            return;
        }

        // Frequency mapping
        const frequencies = {
            pattern_work: '118.300',
            ground_operations: '121.900',
            flight_following: '124.350',
            emergency: '121.500'
        };

        // Update UI with scenario details
        document.getElementById('currentScenarioTitle').textContent = scenarioDetails.icon + ' ' + scenarioDetails.name;
        document.getElementById('currentScenarioDesc').textContent = scenarioDetails.description;
        document.getElementById('frequency').textContent = frequencies[category];

        // Clear conversation
        const conversation = document.getElementById('conversation');

        // Check if backend is available
        const isDemo = !API_ENDPOINT || API_ENDPOINT === 'YOUR_API_ENDPOINT_HERE/atc';
        const modeMessage = isDemo
            ? '<p style="color: #f59e0b;">💡 <strong>Demo Mode Active</strong> - Using pre-programmed responses. Your speech transcription works perfectly!</p>'
            : '';

        // Build scenario info message
        const scenarioInfo = `
            <div class="message system-message">
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

        this.updateStatus('Ready');
    }

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
    }

    handlePilotTransmission(transcript) {
        // Add pilot message to conversation
        this.addMessage('pilot', transcript);
        
        // Add to history
        this.conversationHistory.push({
            role: 'user',
            content: transcript
        });

        this.updateStatus('Waiting for ATC...');

        // Send to backend API
        this.sendToATC(transcript);
    }

    async sendToATC(message) {
        try {
            // Check if API endpoint is configured
            if (!API_ENDPOINT || API_ENDPOINT === 'YOUR_API_ENDPOINT_HERE/atc') {
                this.handleDemoMode(message);
                return;
            }

            // Limit conversation history to prevent memory growth (keep last 20 exchanges)
            const MAX_HISTORY = 20;
            if (this.conversationHistory.length > MAX_HISTORY) {
                this.conversationHistory = this.conversationHistory.slice(-MAX_HISTORY);
            }

            // Prepare request body
            const requestBody = {
                scenario: this.currentScenario,
                message: message,
                history: this.conversationHistory
            };

            // If custom mode is active, include the custom system prompt
            if (this.currentScenario === 'custom' && window.customMode && window.customMode.currentCustomScenario) {
                requestBody.customSystemPrompt = window.customMode.currentCustomScenario.systemPrompt;
            }

            // Create AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                // Backend error - switch to demo mode
                console.info('Backend not available (status ' + response.status + '). Using Demo Mode with pre-programmed responses.');

                this.addMessage('system', '💡 Using Demo Mode - Your transcription still works perfectly!');
                this.handleDemoMode(message);
                return;
            }

            let data;
            try {
                data = await response.json();
            } catch (parseError) {
                console.error('Failed to parse API response:', parseError);
                this.addMessage('system', 'Error communicating with ATC. Switching to Demo Mode...');
                this.handleDemoMode(message);
                return;
            }

            if (data.success) {
                // Add ATC response to conversation history
                this.conversationHistory.push({
                    role: 'assistant',
                    content: data.atc_response
                });

                // Display and speak ATC response
                this.handleATCResponse(data.atc_response, data.has_feedback);
            } else {
                this.updateStatus('Error: ' + (data.error || 'Unknown error'));
                this.addMessage('system', 'Error communicating with ATC. Switching to Demo Mode...');
                this.handleDemoMode(message);
            }

        } catch (error) {
            // Handle different error types
            if (error.name === 'AbortError') {
                console.info('Request timeout - switching to Demo Mode');
                this.updateStatus('Connection Timeout');
                this.addMessage('system', '⏱️ Request timed out. Switching to Demo Mode...');
            } else {
                // Network error - demo mode works fine
                console.info('Backend unavailable. Demo Mode active - all features work!');
                this.updateStatus('Demo Mode Active');
                this.addMessage('system', '💡 Demo Mode Active - Practice with pre-programmed ATC responses!');
            }
            this.handleDemoMode(message);
        }
    }

    handleDemoMode(pilotMessage) {
        // Intelligent contextual demo responses
        const messageLower = pilotMessage.toLowerCase();

        // Try to extract callsign from message or use default
        let callsign = 'Cessna 12345';
        const callsignMatch = pilotMessage.match(/([A-Z]-?[A-Z]{4}|N\d{3,5}[A-Z]?|[A-Za-z]+\s*\d{2,5})/i);
        if (callsignMatch) {
            callsign = callsignMatch[1].toUpperCase();
        }

        let response = '';

        // Contextual response logic based on pilot's message
        if (messageLower.includes('ready for departure') || messageLower.includes('ready for takeoff')) {
            response = `${callsign}, Tower, runway 27, cleared for takeoff, wind 270 at 8, make left traffic.`;
        } else if (messageLower.includes('downwind')) {
            response = `${callsign}, Tower, roger downwind, report base.`;
        } else if (messageLower.includes('base') || messageLower.includes('final')) {
            const fullStop = messageLower.includes('full stop');
            response = fullStop
                ? `${callsign}, cleared to land runway 27, wind 270 at 8.`
                : `${callsign}, cleared touch and go runway 27, wind 270 at 8.`;
        } else if (messageLower.includes('touch and go') || messageLower.includes('option')) {
            response = `${callsign}, cleared for the option runway 27, wind 270 at 8.`;
        } else if (messageLower.includes('taxi') && messageLower.includes('information')) {
            const atisLetter = messageLower.match(/information\s+([a-z])/i)?.[1]?.toUpperCase() || 'Alpha';
            response = `${callsign}, Ground, information ${atisLetter} is current, taxi to runway 27 via Alpha, hold short runway 27.`;
        } else if (messageLower.includes('hold short')) {
            response = `${callsign}, hold short runway 27.`;
        } else if (messageLower.includes('request') && messageLower.includes('flight following')) {
            response = `${callsign}, squawk 4521, radar contact, flight following approved, proceed on course.`;
        } else if (messageLower.includes('traffic in sight') || messageLower.includes('looking')) {
            response = messageLower.includes('in sight')
                ? `${callsign}, roger, maintain visual separation.`
                : `${callsign}, traffic no longer a factor.`;
        } else if (messageLower.includes('mayday') || messageLower.includes('emergency')) {
            response = `${callsign}, roger mayday, souls on board and fuel remaining? All emergency equipment standing by.`;
        } else if (messageLower.includes('minimum fuel') || messageLower.includes('low fuel')) {
            response = `${callsign}, roger minimum fuel, you're number one for runway 27, cleared to land, emergency equipment standing by.`;
        } else if (messageLower.includes('souls') || messageLower.includes('fuel remaining')) {
            response = `${callsign}, roger, runway 27 cleared for landing, winds calm, emergency equipment is standing by.`;
        } else if (messageLower.includes('inbound') || messageLower.includes('landing')) {
            response = `${callsign}, Tower, make straight in runway 27, report 2 mile final.`;
        } else if (messageLower.includes('clear') && messageLower.includes('runway')) {
            response = `${callsign}, roger, taxi to parking via Alpha.`;
        } else {
            // Fallback to category-based responses
            const categoryResponses = {
                'pattern_work': [
                    `${callsign}, Tower, roger, report entering downwind.`,
                    `${callsign}, extend downwind, I'll call your base.`,
                    `${callsign}, number 2 following traffic on short final.`
                ],
                'ground_operations': [
                    `${callsign}, Ground, say your request.`,
                    `${callsign}, hold your position, traffic crossing ahead.`,
                    `${callsign}, continue taxi to runway 27.`
                ],
                'flight_following': [
                    `${callsign}, traffic 10 o'clock, 3 miles, southwest bound, altitude indicates 4,500.`,
                    `${callsign}, roger, altimeter 30.12, frequency change approved.`,
                    `${callsign}, proceed direct to destination, report any weather deviations.`
                ],
                'emergency': [
                    `${callsign}, say nature of emergency.`,
                    `${callsign}, do you need assistance? Equipment is standing by.`,
                    `${callsign}, you're cleared to land any runway, do you need vectors?`
                ]
            };

            const responses = categoryResponses[this.currentScenario] || categoryResponses['pattern_work'];
            response = responses[Math.floor(Math.random() * responses.length)];
        }

        // Add to history
        this.conversationHistory.push({
            role: 'assistant',
            content: response
        });

        // Track transmission in progress
        if (window.appCore) {
            window.appCore.progress.incrementTransmissions();
        }

        // Simulate network delay
        setTimeout(() => {
            this.handleATCResponse(response, false);
        }, 800);
    }

    handleATCResponse(response, hasFeedback) {
        // Add message to UI
        this.addMessage('atc', response, hasFeedback);

        // Speak the response
        this.speak(response);
    }

    speak(text) {
        // Check if auto-play is enabled
        if (window.appCore && !window.appCore.settings.get('autoPlayATC')) {
            return;
        }

        // Check if speech synthesis is available
        if (!this.synthesis || !window.speechSynthesis) {
            console.warn('Speech synthesis not available');
            return;
        }

        // Cancel any ongoing speech
        this.synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Use settings for speech rate and volume with validation
        let rate = 0.9;
        let volume = 1.0;
        if (window.appCore) {
            rate = window.appCore.settings.get('speechRate') || 0.9;
            volume = window.appCore.settings.get('speechVolume') || 1.0;
        }
        // Validate ranges: rate [0.1, 10], volume [0, 1]
        utterance.rate = Math.max(0.1, Math.min(10, rate));
        utterance.volume = Math.max(0, Math.min(1, volume));
        utterance.pitch = 1.0;

        // Try to select an appropriate voice for ATC
        const voices = this.synthesis.getVoices();
        if (voices.length > 0) {
            // Prefer English voices, ideally male for realistic ATC
            const preferredVoice = window.appCore?.settings.get('atcVoice');
            if (preferredVoice) {
                const selectedVoice = voices.find(v => v.name === preferredVoice);
                if (selectedVoice) {
                    utterance.voice = selectedVoice;
                }
            } else {
                // Default: find a good English voice
                const englishVoice = voices.find(v =>
                    v.lang.startsWith('en') && (v.name.includes('Male') || v.name.includes('Daniel') || v.name.includes('Alex'))
                ) || voices.find(v => v.lang.startsWith('en-US')) || voices.find(v => v.lang.startsWith('en'));
                if (englishVoice) {
                    utterance.voice = englishVoice;
                }
            }
        }

        const signalIndicator = document.getElementById('signalIndicator');

        utterance.onstart = () => {
            this.isSpeaking = true;
            this.updateStatus('ATC Speaking...');
            if (signalIndicator) signalIndicator.classList.add('receiving');
        };

        utterance.onend = () => {
            this.isSpeaking = false;
            this.updateStatus('Ready');
            if (signalIndicator) signalIndicator.classList.remove('receiving');
        };

        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            this.isSpeaking = false;
            this.updateStatus('Ready');
            if (signalIndicator) signalIndicator.classList.remove('receiving');
        };

        this.synthesis.speak(utterance);
    }

    addMessage(sender, text, hasFeedback = false) {
        const conversation = document.getElementById('conversation');
        const messageDiv = document.createElement('div');
        
        let senderLabel = '';
        let messageClass = 'message';
        
        if (sender === 'pilot') {
            senderLabel = 'You';
            messageClass += ' pilot-message';
        } else if (sender === 'atc') {
            senderLabel = 'ATC';
            messageClass += ' atc-message';
            if (hasFeedback) {
                messageClass += ' has-feedback';
            }
        } else {
            messageClass += ' system-message';
        }

        messageDiv.className = messageClass;

        // Build message safely using DOM methods to prevent XSS
        if (sender !== 'system') {
            const strong = document.createElement('strong');
            strong.textContent = senderLabel + ':';
            messageDiv.appendChild(strong);
            messageDiv.appendChild(document.createTextNode(' '));
        }
        messageDiv.appendChild(document.createTextNode(text));
        if (hasFeedback) {
            const feedbackSpan = document.createElement('span');
            feedbackSpan.className = 'feedback-indicator';
            feedbackSpan.textContent = '💡 Feedback';
            messageDiv.appendChild(feedbackSpan);
        }

        conversation.appendChild(messageDiv);
        conversation.scrollTop = conversation.scrollHeight;
    }

    updateStatus(text) {
        document.getElementById('status').textContent = text;
    }

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
        });

        // Show individual scenario selection
        document.querySelector('.main-menu').style.display = 'none';
        document.querySelector('.scenario-selection').style.display = 'none';
        document.getElementById('individualScenarioSelection').style.display = 'block';
        document.getElementById('liveAtcInterface').style.display = 'none';
        document.getElementById('commInterface').style.display = 'none';
    }

    showTutorialMode() {
        startTutorial();
    }

    showCustomMode() {
        showCustomMode();
    }

    startRandomScenario() {
        // Get all categories
        const categories = Object.keys(TRAINING_SCENARIOS);
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];

        // Get all scenarios in that category
        const categoryData = getScenariosForCategory(randomCategory);
        const scenarios = categoryData.scenarios;
        const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];

        // Start the random scenario
        this.startScenario(randomCategory, randomScenario.id);
    }

    playRandomAirport() {
        // Get random airport
        const icaoCodes = Object.keys(AIRPORTS);
        const randomIcao = icaoCodes[Math.floor(Math.random() * icaoCodes.length)];
        const airport = AIRPORTS[randomIcao];

        // Open the airport's feed
        if (airport && airport.feeds && airport.feeds.length > 0) {
            const feed = airport.feeds[0];
            if (feed.external) {
                window.open(feed.url, 'liveatc_' + randomIcao, 'width=1000,height=700,menubar=no,toolbar=no,location=no');

                // Show notification
                this.addMessage('system', `🎲 Opening random airport: ${airport.name} (${randomIcao})`);
            }
        }
    }

    toggleAirportMap() {
        const mapContainer = document.getElementById('airportMapContainer');
        const toggleBtn = document.getElementById('toggleMapBtn');

        if (mapContainer && mapContainer.style.display === 'none') {
            mapContainer.style.display = 'block';
            if (toggleBtn) toggleBtn.textContent = '📋 Show List';
            showAirportMap();
        } else if (mapContainer) {
            mapContainer.style.display = 'none';
            if (toggleBtn) toggleBtn.textContent = '🗺️ Show Map';
        }
    }

    // Toast notification system
    showToast(message, type = 'info') {
        // Create toast container if it doesn't exist
        let toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icons = {
            info: 'ℹ️',
            success: '✓',
            warning: '⚠️',
            error: '✕'
        };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;

        toastContainer.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('toast-show');
        });

        // Auto-remove after 4 seconds
        setTimeout(() => {
            toast.classList.remove('toast-show');
            toast.classList.add('toast-hide');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
}

// Store app instance globally for tutorial access
let atcApp = null;

// Initialize Settings Panel
function initSettingsPanel() {
    const settingsBtn = document.getElementById('settingsButton');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettings = document.getElementById('closeSettings');
    const settingsOverlay = document.getElementById('settingsOverlay');
    const saveSettings = document.getElementById('saveSettings');
    const resetSettings = document.getElementById('resetSettings');
    const resetProgress = document.getElementById('resetProgress');

    // Open settings
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            if (settingsModal) {
                settingsModal.style.display = 'flex';
                loadSettingsValues();
                updateStatsDisplay();
            }
        });
    }

    // Close settings
    const closeSettingsModal = () => {
        if (settingsModal) {
            settingsModal.style.display = 'none';
        }
    };

    if (closeSettings) closeSettings.addEventListener('click', closeSettingsModal);
    if (settingsOverlay) settingsOverlay.addEventListener('click', closeSettingsModal);

    // Escape key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && settingsModal && settingsModal.style.display === 'flex') {
            closeSettingsModal();
        }
    });

    // Save settings
    if (saveSettings) {
        saveSettings.addEventListener('click', () => {
            saveSettingsValues();
            closeSettingsModal();
            if (window.atcApp) {
                window.atcApp.showToast('Settings saved!', 'success');
            }
        });
    }

    // Reset settings
    if (resetSettings) {
        resetSettings.addEventListener('click', () => {
            if (window.appCore) {
                window.appCore.settings.reset();
                loadSettingsValues();
                if (window.atcApp) {
                    window.atcApp.showToast('Settings reset to defaults', 'info');
                }
            }
        });
    }

    // Reset progress
    if (resetProgress) {
        resetProgress.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
                if (window.appCore) {
                    window.appCore.progress.reset();
                    updateStatsDisplay();
                    if (window.atcApp) {
                        window.atcApp.showToast('Progress reset', 'info');
                    }
                }
            }
        });
    }

    // Slider value updates
    const speechRate = document.getElementById('speechRate');
    const speechRateValue = document.getElementById('speechRateValue');
    if (speechRate && speechRateValue) {
        speechRate.addEventListener('input', () => {
            speechRateValue.textContent = `${speechRate.value}x`;
        });
    }

    const speechVolume = document.getElementById('speechVolume');
    const speechVolumeValue = document.getElementById('speechVolumeValue');
    if (speechVolume && speechVolumeValue) {
        speechVolume.addEventListener('input', () => {
            speechVolumeValue.textContent = `${Math.round(speechVolume.value * 100)}%`;
        });
    }
}

// Load settings values into the form
function loadSettingsValues() {
    if (!window.appCore) return;

    const settings = window.appCore.settings;

    // Speech settings
    const speechRate = document.getElementById('speechRate');
    const speechRateValue = document.getElementById('speechRateValue');
    if (speechRate) {
        speechRate.value = settings.get('speechRate');
        if (speechRateValue) speechRateValue.textContent = `${settings.get('speechRate')}x`;
    }

    const speechVolume = document.getElementById('speechVolume');
    const speechVolumeValue = document.getElementById('speechVolumeValue');
    if (speechVolume) {
        speechVolume.value = settings.get('speechVolume');
        if (speechVolumeValue) speechVolumeValue.textContent = `${Math.round(settings.get('speechVolume') * 100)}%`;
    }

    const autoPlayATC = document.getElementById('autoPlayATC');
    if (autoPlayATC) autoPlayATC.checked = settings.get('autoPlayATC');

    // Display settings
    const showKeyboardHints = document.getElementById('showKeyboardHints');
    if (showKeyboardHints) showKeyboardHints.checked = settings.get('showKeyboardHints');

    const enableSoundEffects = document.getElementById('enableSoundEffects');
    if (enableSoundEffects) enableSoundEffects.checked = settings.get('enableSoundEffects');

    // Pilot preferences
    const callsignPrefix = document.getElementById('callsignPrefix');
    if (callsignPrefix) callsignPrefix.value = settings.get('callsignPrefix');

    const preferredAircraft = document.getElementById('preferredAircraft');
    if (preferredAircraft) preferredAircraft.value = settings.get('preferredAircraft');
}

// Save settings values from the form
function saveSettingsValues() {
    if (!window.appCore) return;

    const settings = window.appCore.settings;

    const speechRate = document.getElementById('speechRate');
    if (speechRate) settings.set('speechRate', parseFloat(speechRate.value));

    const speechVolume = document.getElementById('speechVolume');
    if (speechVolume) settings.set('speechVolume', parseFloat(speechVolume.value));

    const autoPlayATC = document.getElementById('autoPlayATC');
    if (autoPlayATC) settings.set('autoPlayATC', autoPlayATC.checked);

    const showKeyboardHints = document.getElementById('showKeyboardHints');
    if (showKeyboardHints) {
        settings.set('showKeyboardHints', showKeyboardHints.checked);
        const keyboardHint = document.querySelector('.keyboard-hint');
        if (keyboardHint) {
            keyboardHint.style.display = showKeyboardHints.checked ? 'inline-flex' : 'none';
        }
    }

    const enableSoundEffects = document.getElementById('enableSoundEffects');
    if (enableSoundEffects) settings.set('enableSoundEffects', enableSoundEffects.checked);

    const callsignPrefix = document.getElementById('callsignPrefix');
    if (callsignPrefix) settings.set('callsignPrefix', callsignPrefix.value);

    const preferredAircraft = document.getElementById('preferredAircraft');
    if (preferredAircraft) settings.set('preferredAircraft', preferredAircraft.value);
}

// Update stats display
function updateStatsDisplay() {
    if (!window.appCore) return;

    const stats = window.appCore.progress.getStatistics();

    const statSessions = document.getElementById('statSessions');
    if (statSessions) statSessions.textContent = stats.totalSessions;

    const statTransmissions = document.getElementById('statTransmissions');
    if (statTransmissions) statTransmissions.textContent = stats.totalTransmissions;

    const statTime = document.getElementById('statTime');
    if (statTime) {
        const minutes = Math.floor(stats.totalTime / 60000);
        const hours = Math.floor(minutes / 60);
        if (hours > 0) {
            statTime.textContent = `${hours}h ${minutes % 60}m`;
        } else {
            statTime.textContent = `${minutes}m`;
        }
    }
}

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', () => {
    atcApp = new ATCTrainingApp();
    window.atcApp = atcApp; // Make available globally for tutorial

    // Initialize settings panel
    initSettingsPanel();

    // Apply saved settings
    if (window.appCore) {
        const showKeyboardHints = window.appCore.settings.get('showKeyboardHints');
        const keyboardHint = document.querySelector('.keyboard-hint');
        if (keyboardHint && !showKeyboardHints) {
            keyboardHint.style.display = 'none';
        }
    }
});
