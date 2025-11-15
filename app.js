// AI ATC Training System - Main Application Logic

class ATCTrainingApp {
    constructor() {
        this.currentCategory = null;
        this.currentScenario = null;
        this.currentScenarioId = null;
        this.conversationHistory = [];
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.isSpeaking = false;

        this.initSpeechRecognition();
        this.initEventListeners();
    }

    initSpeechRecognition() {
        // Check for browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            alert('Speech recognition not supported in this browser. Please use Chrome or Edge.');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true; // Enable real-time transcription
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
            this.isListening = true;
            this.updateStatus('Listening... Speak now');
            document.getElementById('pttButton').classList.add('active');
            document.getElementById('signalIndicator').classList.add('transmitting');

            // Show live transcription box
            this.showLiveTranscription();
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            // Update live transcription display
            if (interimTranscript) {
                this.updateLiveTranscription(interimTranscript);
            }

            // When final result, send to ATC
            if (finalTranscript) {
                this.hideLiveTranscription();
                this.handlePilotTransmission(finalTranscript);
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.updateStatus(`Error: ${event.error}`);
            this.isListening = false;
            document.getElementById('pttButton').classList.remove('active');
            document.getElementById('signalIndicator').classList.remove('transmitting');
            this.hideLiveTranscription();
        };

        this.recognition.onend = () => {
            this.isListening = false;
            document.getElementById('pttButton').classList.remove('active');
            document.getElementById('signalIndicator').classList.remove('transmitting');
            this.hideLiveTranscription();
            if (!this.isSpeaking) {
                this.updateStatus('Ready');
            }
        };
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
            card.addEventListener('click', (e) => {
                const category = e.currentTarget.dataset.category;
                this.showIndividualScenarios(category);
            });
        });

        // PTT button (mouse)
        const pttButton = document.getElementById('pttButton');
        pttButton.addEventListener('mousedown', () => this.startListening());
        pttButton.addEventListener('mouseup', () => this.stopListening());
        pttButton.addEventListener('mouseleave', () => this.stopListening());

        // PTT button (touch)
        pttButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startListening();
        });
        pttButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopListening();
        });

        // Spacebar for PTT
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.isListening && this.currentScenario) {
                e.preventDefault();
                this.startListening();
            }
        });
        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space' && this.isListening) {
                e.preventDefault();
                this.stopListening();
            }
        });

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
                <p style="margin-top: 12px;">Press and hold "Push to Talk" or spacebar to begin communication.</p>
            </div>
        `;

        conversation.innerHTML = scenarioInfo;

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

    startListening() {
        if (!this.currentScenario || this.isListening || this.isSpeaking) {
            return;
        }

        try {
            this.recognition.start();
        } catch (error) {
            console.error('Error starting recognition:', error);
        }
    }

    stopListening() {
        if (this.isListening) {
            this.recognition.stop();
        }
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

            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                // Backend error - switch to demo mode
                console.info('Backend not available (status ' + response.status + '). Using Demo Mode with pre-programmed responses.');

                this.addMessage('system', '💡 Using Demo Mode - Your transcription still works perfectly!');
                this.handleDemoMode(message);
                return;
            }

            const data = await response.json();

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
            // Network error - demo mode works fine
            console.info('Backend unavailable. Demo Mode active - all features work!');
            this.updateStatus('Demo Mode Active');
            this.addMessage('system', '💡 Demo Mode Active - Practice with pre-programmed ATC responses!');
            this.handleDemoMode(message);
        }
    }

    handleDemoMode(pilotMessage) {
        // Demo responses for testing transcription feature
        const demoResponses = {
            'pattern_work': [
                "Cessna 12345, Tower, runway 27, cleared for takeoff, make left traffic.",
                "Cessna 12345, roger, report when entering downwind.",
                "Cessna 12345, cleared to land runway 27, wind 270 at 8.",
                "Cessna 12345, roger, taxi to parking via taxiway Alpha."
            ],
            'ground_operations': [
                "Cessna 12345, Ground, taxi to runway 27 via taxiway Alpha, hold short of runway 27.",
                "Cessna 12345, cross runway 27, continue on Alpha.",
                "Cessna 12345, contact Tower on 118.3."
            ],
            'flight_following': [
                "Cessna 12345, radar contact, squawk 1234, flight following approved.",
                "Cessna 12345, traffic 2 o'clock, 5 miles, northbound, altitude indicates 3,500.",
                "Cessna 12345, roger, radar service terminated, squawk VFR, frequency change approved."
            ],
            'emergency': [
                "Cessna 12345, say souls on board and fuel remaining.",
                "Cessna 12345, roger, emergency equipment is standing by, runway 27 is clear for landing.",
                "Cessna 12345, you're doing great, cleared to land any runway."
            ]
        };

        const responses = demoResponses[this.currentScenario] || demoResponses['pattern_work'];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];

        // Add to history
        this.conversationHistory.push({
            role: 'assistant',
            content: randomResponse
        });

        // Simulate network delay
        setTimeout(() => {
            this.handleATCResponse(randomResponse, false);
        }, 800);
    }

    handleATCResponse(response, hasFeedback) {
        // Add message to UI
        this.addMessage('atc', response, hasFeedback);

        // Speak the response
        this.speak(response);
    }

    speak(text) {
        // Cancel any ongoing speech
        this.synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9; // Slightly slower for clarity
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onstart = () => {
            this.isSpeaking = true;
            this.updateStatus('ATC Speaking...');
            document.getElementById('signalIndicator').classList.add('receiving');
        };

        utterance.onend = () => {
            this.isSpeaking = false;
            this.updateStatus('Ready');
            document.getElementById('signalIndicator').classList.remove('receiving');
        };

        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            this.isSpeaking = false;
            this.updateStatus('Ready');
            document.getElementById('signalIndicator').classList.remove('receiving');
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
        
        let html = '';
        if (sender !== 'system') {
            html += '<strong>' + senderLabel + ':</strong> ';
        }
        html += text;
        if (hasFeedback) {
            html += '<span class="feedback-indicator">💡 Feedback</span>';
        }
        
        messageDiv.innerHTML = html;

        conversation.appendChild(messageDiv);
        conversation.scrollTop = conversation.scrollHeight;
    }

    updateStatus(text) {
        document.getElementById('status').textContent = text;
    }

    showLiveTranscription() {
        // Create live transcription element if it doesn't exist
        let liveBox = document.getElementById('liveTranscription');
        if (!liveBox) {
            liveBox = document.createElement('div');
            liveBox.id = 'liveTranscription';
            liveBox.className = 'live-transcription';
            liveBox.innerHTML = '<div class="transcription-header">You are saying:</div><div class="transcription-text"></div>';

            const conversation = document.getElementById('conversation');
            conversation.parentNode.insertBefore(liveBox, conversation);
        }
        liveBox.style.display = 'block';
    }

    updateLiveTranscription(text) {
        const liveBox = document.getElementById('liveTranscription');
        if (liveBox) {
            const textElement = liveBox.querySelector('.transcription-text');
            if (textElement) {
                textElement.textContent = text;
            }
        }
    }

    hideLiveTranscription() {
        const liveBox = document.getElementById('liveTranscription');
        if (liveBox) {
            liveBox.style.display = 'none';
        }
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

        if (mapContainer.style.display === 'none') {
            mapContainer.style.display = 'block';
            toggleBtn.textContent = '📋 Show List';
            showAirportMap();
        } else {
            mapContainer.style.display = 'none';
            toggleBtn.textContent = '🗺️ Show Map';
        }
    }
}

// Store app instance globally for tutorial access
let atcApp = null;

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', () => {
    atcApp = new ATCTrainingApp();
    window.atcApp = atcApp; // Make available globally for tutorial
});
