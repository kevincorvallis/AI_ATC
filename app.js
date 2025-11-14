// AI ATC Training System - Main Application Logic

class ATCTrainingApp {
    constructor() {
        this.currentScenario = null;
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

        document.getElementById('liveAtcModeBtn').addEventListener('click', () => {
            this.showLiveAtcMode();
        });

        document.getElementById('backToMainMenu').addEventListener('click', () => {
            this.showMainMenu();
        });

        document.getElementById('backToMainMenuFromLive').addEventListener('click', () => {
            this.showMainMenu();
        });

        // Scenario selection
        document.querySelectorAll('.scenario-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const scenario = e.currentTarget.dataset.scenario;
                this.startScenario(scenario);
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

    startScenario(scenario) {
        this.currentScenario = scenario;
        this.conversationHistory = [];
        
        const scenarios = {
            pattern_work: {
                title: 'Pattern Work Training',
                desc: 'Practice traffic pattern communications at a Class D airport',
                freq: '118.300'
            },
            ground_operations: {
                title: 'Ground Operations Training',
                desc: 'Master ground control communications and taxi procedures',
                freq: '121.900'
            },
            flight_following: {
                title: 'Flight Following Training',
                desc: 'Practice VFR flight following requests and position reports',
                freq: '124.350'
            },
            emergency: {
                title: 'Emergency Procedures Training',
                desc: 'Learn to handle emergency situations and communications',
                freq: '121.500'
            }
        };

        const scenarioInfo = scenarios[scenario];
        document.getElementById('currentScenarioTitle').textContent = scenarioInfo.title;
        document.getElementById('currentScenarioDesc').textContent = scenarioInfo.desc;
        document.getElementById('frequency').textContent = scenarioInfo.freq;

        // Clear conversation
        const conversation = document.getElementById('conversation');
        conversation.innerHTML = '<div class="message system-message"><p><strong>Scenario Started:</strong> ' + scenarioInfo.title + '</p><p>' + scenarioInfo.desc + '</p><p>Press and hold "Push to Talk" or spacebar to begin communication.</p></div>';

        // Show communication interface
        document.querySelector('.scenario-selection').style.display = 'none';
        document.getElementById('commInterface').style.display = 'block';
        
        this.updateStatus('Ready');
    }

    showScenarioSelection() {
        document.querySelector('.scenario-selection').style.display = 'block';
        document.getElementById('commInterface').style.display = 'none';
        this.currentScenario = null;
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
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    scenario: this.currentScenario,
                    message: message,
                    history: this.conversationHistory
                })
            });

            if (!response.ok) {
                throw new Error('HTTP error! status: ' + response.status);
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
                this.addMessage('system', 'Error communicating with ATC. Please try again.');
            }

        } catch (error) {
            console.error('Error calling ATC API:', error);
            this.updateStatus('Error: Network issue');
            this.addMessage('system', 'Unable to reach ATC. Check your API configuration and try again.');
        }
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
        document.getElementById('liveAtcInterface').style.display = 'block';
        document.getElementById('commInterface').style.display = 'none';

        // Initialize live ATC player
        initLiveATC();
    }
}

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ATCTrainingApp();
});
