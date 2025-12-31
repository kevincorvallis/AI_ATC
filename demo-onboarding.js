// Demo & Onboarding System for AI ATC Training
// Manages welcome flow, interactive demos, and help guide

'use strict';

class WelcomeFlow {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 3;
        this.modal = null;
    }

    show() {
        // Don't show if user has already seen it
        if (localStorage.getItem('atc_welcome_completed')) {
            return;
        }

        this.createModal();
        this.showStep(1);
    }

    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'welcome-modal';
        this.modal.innerHTML = `
            <div class="welcome-content">
                <div class="welcome-header">
                    <div class="logo">✈️ ATC Training System</div>
                    <button class="close-btn" id="welcomeClose">×</button>
                </div>
                <div class="welcome-body" id="welcomeBody"></div>
                <div class="welcome-footer">
                    <div class="step-indicators" id="stepIndicators">
                        <span class="step-dot active"></span>
                        <span class="step-dot"></span>
                        <span class="step-dot"></span>
                    </div>
                    <div class="welcome-buttons">
                        <button class="btn-secondary" id="welcomeSkip">Skip</button>
                        <button class="btn-primary" id="welcomeNext">Next</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.modal);

        // Event listeners
        document.getElementById('welcomeClose').addEventListener('click', () => this.skip());
        document.getElementById('welcomeSkip').addEventListener('click', () => this.skip());
        document.getElementById('welcomeNext').addEventListener('click', () => this.next());
    }

    showStep(step) {
        this.currentStep = step;
        const body = document.getElementById('welcomeBody');
        const nextBtn = document.getElementById('welcomeNext');

        // Update step indicators
        const dots = document.querySelectorAll('.step-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index < step);
        });

        // Show appropriate step content
        switch (step) {
            case 1:
                body.innerHTML = this.getStep1HTML();
                nextBtn.textContent = 'Next';
                break;
            case 2:
                body.innerHTML = this.getStep2HTML();
                nextBtn.textContent = 'Next';
                break;
            case 3:
                body.innerHTML = this.getStep3HTML();
                nextBtn.textContent = 'Start Training';
                break;
        }
    }

    getStep1HTML() {
        return `
            <h2>Welcome to ATC Training! 👋</h2>
            <p class="step-desc">Practice real air traffic control communications with AI-powered simulations.</p>

            <div class="feature-list">
                <div class="feature-item">
                    <span class="feature-icon">📚</span>
                    <div>
                        <strong>20 Realistic Scenarios</strong>
                        <p>Pattern work, ground ops, flight following, emergencies</p>
                    </div>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">🎯</span>
                    <div>
                        <strong>Real-Time Feedback</strong>
                        <p>Get instant phraseology scores and improvement tips</p>
                    </div>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">📈</span>
                    <div>
                        <strong>Adaptive Difficulty</strong>
                        <p>Adjust from student pilot to experienced pilot levels</p>
                    </div>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">🗺️</span>
                    <div>
                        <strong>Visual Position Tracking</strong>
                        <p>See your position in the pattern with live updates</p>
                    </div>
                </div>
            </div>

            <div class="demo-prompt">
                <p><strong>New to ATC communications?</strong></p>
                <button class="btn-demo" id="launchDemoFromWelcome">
                    📺 Watch a 2-Minute Demo First
                </button>
            </div>
        `;
    }

    getStep2HTML() {
        return `
            <h2>How It Works 🎮</h2>
            <p class="step-desc">Here's what you'll see during training:</p>

            <div class="interface-preview">
                <div class="preview-item">
                    <div class="preview-number">1</div>
                    <div class="preview-content">
                        <strong>Radio Panel</strong>
                        <p>Shows frequency and transmission status (🔴 transmitting, 🟢 receiving)</p>
                    </div>
                </div>
                <div class="preview-item">
                    <div class="preview-number">2</div>
                    <div class="preview-content">
                        <strong>Quick Suggestions</strong>
                        <p>Click example transmissions to auto-fill. Perfect for learning!</p>
                    </div>
                </div>
                <div class="preview-item">
                    <div class="preview-number">3</div>
                    <div class="preview-content">
                        <strong>Your Transmission</strong>
                        <p>Type or use suggestions, then press "Transmit" or Enter</p>
                    </div>
                </div>
                <div class="preview-item">
                    <div class="preview-number">4</div>
                    <div class="preview-content">
                        <strong>Feedback & Scoring</strong>
                        <p>Get instant feedback on phraseology, readbacks, and more</p>
                    </div>
                </div>
            </div>

            <div class="tip-box">
                <strong>💡 Pro Tip:</strong> Start with Pattern Work at Beginner difficulty.
                The suggestions will teach you proper phraseology!
            </div>
        `;
    }

    getStep3HTML() {
        return `
            <h2>Choose Your Level 🎓</h2>
            <p class="step-desc">Select your experience level (you can change this anytime in Settings):</p>

            <div class="difficulty-options">
                <label class="difficulty-option">
                    <input type="radio" name="welcomeDifficulty" value="beginner" checked>
                    <div class="difficulty-card">
                        <div class="difficulty-header">
                            <span class="difficulty-icon">🎓</span>
                            <strong>Student Pilot</strong>
                        </div>
                        <p>Detailed feedback, visible suggestions, step-by-step guidance</p>
                        <span class="difficulty-badge">Recommended for beginners</span>
                    </div>
                </label>

                <label class="difficulty-option">
                    <input type="radio" name="welcomeDifficulty" value="intermediate">
                    <div class="difficulty-card">
                        <div class="difficulty-header">
                            <span class="difficulty-icon">✈️</span>
                            <strong>Private Pilot</strong>
                        </div>
                        <p>Moderate feedback, hints instead of examples</p>
                        <span class="difficulty-badge">For building confidence</span>
                    </div>
                </label>

                <label class="difficulty-option">
                    <input type="radio" name="welcomeDifficulty" value="advanced">
                    <div class="difficulty-card">
                        <div class="difficulty-header">
                            <span class="difficulty-icon">👨‍✈️</span>
                            <strong>Experienced Pilot</strong>
                        </div>
                        <p>Minimal feedback, realistic ATC experience</p>
                        <span class="difficulty-badge">Proficiency practice</span>
                    </div>
                </label>
            </div>

            <div class="tip-box">
                <strong>📊 Track Your Progress:</strong> View your statistics anytime in Settings.
            </div>
        `;
    }

    next() {
        if (this.currentStep < this.totalSteps) {
            this.showStep(this.currentStep + 1);
        } else {
            this.complete();
        }
    }

    skip() {
        this.complete();
    }

    complete() {
        // Save selected difficulty
        const selected = document.querySelector('input[name="welcomeDifficulty"]:checked');
        if (selected && window.appCore && window.feedbackEngine) {
            const difficulty = selected.value;
            window.appCore.settings.set('difficulty', difficulty);
            window.feedbackEngine.setDifficulty(difficulty);
        }

        // Mark as completed
        localStorage.setItem('atc_welcome_completed', 'true');

        // Remove modal
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }
    }
}

class DemoPlayer {
    constructor() {
        this.currentDemo = null;
        this.currentExchange = 0;
        this.autoPlay = false;
        this.autoPlayInterval = null;
        this.modal = null;
    }

    showSelector() {
        this.createSelectorModal();
    }

    createSelectorModal() {
        if (this.modal) {
            this.modal.remove();
        }

        this.modal = document.createElement('div');
        this.modal.className = 'demo-modal';
        this.modal.innerHTML = `
            <div class="demo-selector">
                <div class="demo-header">
                    <h2>📺 Interactive Demos</h2>
                    <p>Watch realistic ATC conversations with proper phraseology</p>
                    <button class="close-btn" id="demoClose">×</button>
                </div>
                <div class="demo-grid">
                    ${this.getDemoCardsHTML()}
                </div>
            </div>
        `;

        document.body.appendChild(this.modal);

        // Event listeners
        document.getElementById('demoClose').addEventListener('click', () => this.close());

        // Add click listeners to demo cards
        Object.keys(DEMO_CONVERSATIONS).forEach(demoKey => {
            const btn = document.getElementById(`demoCard_${demoKey}`);
            if (btn) {
                btn.addEventListener('click', () => this.playDemo(demoKey));
            }
        });
    }

    getDemoCardsHTML() {
        return Object.entries(DEMO_CONVERSATIONS).map(([key, demo]) => `
            <div class="demo-card" id="demoCard_${key}">
                <div class="demo-card-icon">${demo.icon}</div>
                <h3>${demo.title}</h3>
                <p>${demo.description}</p>
                <span class="demo-difficulty ${demo.difficulty.toLowerCase()}">${demo.difficulty}</span>
                <span class="demo-duration">${demo.exchanges.length} exchanges</span>
            </div>
        `).join('');
    }

    playDemo(demoKey) {
        this.currentDemo = DEMO_CONVERSATIONS[demoKey];
        this.currentExchange = 0;
        this.showDemoPlayer();
    }

    showDemoPlayer() {
        if (!this.currentDemo) return;

        if (this.modal) {
            this.modal.remove();
        }

        this.modal = document.createElement('div');
        this.modal.className = 'demo-modal';
        this.modal.innerHTML = `
            <div class="demo-player">
                <div class="demo-player-header">
                    <button class="back-btn" id="demoBackToSelector">← All Demos</button>
                    <div class="demo-title">
                        <h2>${this.currentDemo.icon} ${this.currentDemo.title}</h2>
                        <p>${this.currentDemo.description}</p>
                    </div>
                    <button class="close-btn" id="demoPlayerClose">×</button>
                </div>
                <div class="demo-progress">
                    <span>Exchange <strong id="currentExchangeNum">1</strong> of <strong>${this.currentDemo.exchanges.length}</strong></span>
                    <div class="progress-bar">
                        <div class="progress-fill" id="demoProgressFill"></div>
                    </div>
                </div>
                <div class="demo-exchange-container" id="demoExchangeContainer"></div>
                <div class="demo-controls">
                    <button class="btn-secondary" id="demoPrevious" disabled>◀ Previous</button>
                    <button class="btn-secondary" id="demoAutoPlay">▶ Auto-Play</button>
                    <button class="btn-primary" id="demoNext">Next ▶</button>
                </div>
                <div class="demo-action">
                    <button class="btn-cta" id="demoTryScenario" style="display:none;">
                        🎮 Try This Scenario Yourself
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(this.modal);

        // Event listeners
        document.getElementById('demoPlayerClose').addEventListener('click', () => this.close());
        document.getElementById('demoBackToSelector').addEventListener('click', () => this.showSelector());
        document.getElementById('demoPrevious').addEventListener('click', () => this.previousExchange());
        document.getElementById('demoNext').addEventListener('click', () => this.nextExchange());
        document.getElementById('demoAutoPlay').addEventListener('click', () => this.toggleAutoPlay());
        document.getElementById('demoTryScenario').addEventListener('click', () => this.tryScenario());

        this.showExchange(0);
    }

    showExchange(index) {
        if (!this.currentDemo || index < 0 || index >= this.currentDemo.exchanges.length) {
            return;
        }

        this.currentExchange = index;
        const exchange = this.currentDemo.exchanges[index];

        // Update progress
        const progress = ((index + 1) / this.currentDemo.exchanges.length) * 100;
        document.getElementById('demoProgressFill').style.width = `${progress}%`;
        document.getElementById('currentExchangeNum').textContent = index + 1;

        // Update button states
        document.getElementById('demoPrevious').disabled = index === 0;
        document.getElementById('demoNext').textContent =
            index === this.currentDemo.exchanges.length - 1 ? 'Finish' : 'Next ▶';

        // Show "Try Scenario" button on last exchange
        const tryBtn = document.getElementById('demoTryScenario');
        if (tryBtn) {
            tryBtn.style.display = index === this.currentDemo.exchanges.length - 1 ? 'block' : 'none';
        }

        // Render exchange
        const container = document.getElementById('demoExchangeContainer');
        container.innerHTML = `
            <div class="radio-display">
                <div class="radio-freq">📻 COM1: ${this.getFrequency()}</div>
                <div class="signal-indicator ${exchange.critical ? 'critical' : ''}">
                    ${exchange.critical ? '⚠️' : '🟢'}
                </div>
            </div>

            <div class="exchange-messages">
                <div class="demo-message pilot-message">
                    <div class="message-header">
                        <span class="message-label">You (Pilot):</span>
                    </div>
                    <div class="message-text">"${exchange.pilot}"</div>
                    ${exchange.highlights ? `
                        <div class="phraseology-breakdown">
                            ${exchange.highlights.map(h => `<div class="breakdown-item">${h}</div>`).join('')}
                        </div>
                    ` : ''}
                </div>

                <div class="demo-message atc-message">
                    <div class="message-header">
                        <span class="message-label">ATC Response:</span>
                    </div>
                    <div class="message-text">"${exchange.atc}"</div>
                </div>
            </div>

            <div class="demo-feedback ${exchange.improvement ? 'improvement' : ''}">
                <div class="feedback-header">
                    <span class="feedback-score ${this.getScoreClass(exchange.score)}">
                        Score: ${exchange.score}/100 ${this.getScoreStars(exchange.score)}
                    </span>
                </div>
                <div class="feedback-content">
                    <p><strong>${exchange.feedback}</strong></p>
                    ${exchange.tip ? `<p class="feedback-tip">💡 <em>${exchange.tip}</em></p>` : ''}
                </div>
            </div>
        `;
    }

    getFrequency() {
        const freqs = {
            pattern_work: '118.300',
            ground_operations: '121.900',
            flight_following: '124.350',
            emergency: '121.500'
        };
        return freqs[this.currentDemo.category] || '118.300';
    }

    getScoreClass(score) {
        if (score >= 95) return 'excellent';
        if (score >= 85) return 'good';
        if (score >= 75) return 'fair';
        return 'needs-improvement';
    }

    getScoreStars(score) {
        if (score >= 95) return '⭐⭐⭐';
        if (score >= 85) return '⭐⭐';
        if (score >= 75) return '⭐';
        return '';
    }

    nextExchange() {
        if (this.currentExchange < this.currentDemo.exchanges.length - 1) {
            this.showExchange(this.currentExchange + 1);
        } else {
            // On last exchange, "Finish" button shows try scenario or goes back to selector
            const tryBtn = document.getElementById('demoTryScenario');
            if (tryBtn && tryBtn.style.display !== 'none') {
                // Button is visible, let them click it
            } else {
                this.showSelector();
            }
        }
    }

    previousExchange() {
        if (this.currentExchange > 0) {
            this.showExchange(this.currentExchange - 1);
        }
    }

    toggleAutoPlay() {
        this.autoPlay = !this.autoPlay;
        const btn = document.getElementById('demoAutoPlay');

        if (this.autoPlay) {
            btn.textContent = '⏸ Pause';
            this.startAutoPlay();
        } else {
            btn.textContent = '▶ Auto-Play';
            this.stopAutoPlay();
        }
    }

    startAutoPlay() {
        this.autoPlayInterval = setInterval(() => {
            if (this.currentExchange < this.currentDemo.exchanges.length - 1) {
                this.nextExchange();
            } else {
                this.stopAutoPlay();
                const btn = document.getElementById('demoAutoPlay');
                if (btn) btn.textContent = '▶ Auto-Play';
            }
        }, 5000); // 5 seconds per exchange
    }

    stopAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
        this.autoPlay = false;
    }

    tryScenario() {
        // Close demo and launch the actual scenario
        this.close();

        if (window.atcApp && this.currentDemo) {
            const category = this.currentDemo.category;
            const scenarioId = this.currentDemo.scenarioId;

            // Find the scenario in TRAINING_SCENARIOS
            const categoryData = TRAINING_SCENARIOS[category];
            if (categoryData) {
                const scenario = categoryData.scenarios.find(s => s.id === scenarioId);
                if (scenario) {
                    window.atcApp.startScenario(category, scenario);
                }
            }
        }
    }

    close() {
        this.stopAutoPlay();
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }
        this.currentDemo = null;
        this.currentExchange = 0;
    }
}

class HelpGuide {
    constructor() {
        this.modal = null;
        this.currentTab = 'interface_tour';
    }

    show() {
        this.createModal();
        this.showTab('interface_tour');
    }

    createModal() {
        if (this.modal) {
            this.modal.remove();
        }

        this.modal = document.createElement('div');
        this.modal.className = 'help-modal';
        this.modal.innerHTML = `
            <div class="help-content">
                <div class="help-header">
                    <h2>📚 Help & Guide</h2>
                    <button class="close-btn" id="helpClose">×</button>
                </div>
                <div class="help-tabs">
                    <button class="help-tab active" data-tab="interface_tour">Interface Tour</button>
                    <button class="help-tab" data-tab="difficulty_levels">Difficulty Levels</button>
                    <button class="help-tab" data-tab="phraseology_tips">Phraseology Tips</button>
                    <button class="help-tab" data-tab="scenario_categories">Categories</button>
                </div>
                <div class="help-body" id="helpBody"></div>
            </div>
        `;

        document.body.appendChild(this.modal);

        // Event listeners
        document.getElementById('helpClose').addEventListener('click', () => this.close());

        document.querySelectorAll('.help-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.showTab(tabName);
            });
        });
    }

    showTab(tabName) {
        this.currentTab = tabName;

        // Update active tab
        document.querySelectorAll('.help-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Show content
        const content = HELP_CONTENT[tabName];
        const body = document.getElementById('helpBody');

        if (tabName === 'interface_tour') {
            body.innerHTML = this.renderInterfaceTour(content);
        } else if (tabName === 'difficulty_levels') {
            body.innerHTML = this.renderDifficultyLevels(content);
        } else if (tabName === 'phraseology_tips') {
            body.innerHTML = this.renderPhraseologyTips(content);
        } else if (tabName === 'scenario_categories') {
            body.innerHTML = this.renderCategories(content);
        }
    }

    renderInterfaceTour(content) {
        return `
            <h3>${content.title}</h3>
            <div class="interface-sections">
                ${content.sections.map(section => `
                    <div class="interface-section">
                        <div class="section-icon">${section.icon}</div>
                        <div class="section-content">
                            <h4>${section.heading}</h4>
                            <p>${section.content}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderDifficultyLevels(content) {
        return `
            <h3>${content.title}</h3>
            <div class="difficulty-levels">
                ${content.levels.map(level => `
                    <div class="level-card">
                        <h4>${level.name}</h4>
                        <ul class="level-features">
                            ${level.features.map(f => `<li>${f}</li>`).join('')}
                        </ul>
                        <p class="level-best-for"><strong>Best for:</strong> ${level.bestFor}</p>
                    </div>
                `).join('')}
            </div>
            <p class="help-note">${content.note}</p>
        `;
    }

    renderPhraseologyTips(content) {
        return `
            <h3>${content.title}</h3>
            <div class="tips-grid">
                <div class="tips-column">
                    <h4 class="tips-heading do">✅ DO</h4>
                    <ul class="tips-list">
                        ${content.dos.map(tip => `<li>${tip}</li>`).join('')}
                    </ul>
                </div>
                <div class="tips-column">
                    <h4 class="tips-heading dont">❌ DON'T</h4>
                    <ul class="tips-list">
                        ${content.donts.map(tip => `<li>${tip}</li>`).join('')}
                    </ul>
                </div>
            </div>
            <div class="readback-section">
                <h4>📋 Must Read Back (FAA AIM 4-4-7):</h4>
                <ul class="readback-list">
                    ${content.readbacks.map(item => `<li>${item}</li>`).join('')}
                </ul>
                <p class="help-note">${content.note}</p>
            </div>
        `;
    }

    renderCategories(content) {
        return `
            <h3>${content.title}</h3>
            <div class="categories-list">
                ${content.categories.map(cat => `
                    <div class="category-info">
                        <h4>${cat.name}</h4>
                        <div class="category-details">
                            <p><strong>Frequency:</strong> ${cat.frequency}</p>
                            <p><strong>Scenarios:</strong> ${cat.scenarios}</p>
                            <p><strong>Focus:</strong> ${cat.focus}</p>
                            <p><strong>Skills:</strong> ${cat.skills}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    close() {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }
    }
}

// Global instances
let welcomeFlow, demoPlayer, helpGuide;

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    welcomeFlow = new WelcomeFlow();
    demoPlayer = new DemoPlayer();
    helpGuide = new HelpGuide();

    // Show welcome for first-time users (with small delay to let page load)
    setTimeout(() => {
        welcomeFlow.show();

        // Add demo launch listener if button exists in welcome
        const launchDemoBtn = document.getElementById('launchDemoFromWelcome');
        if (launchDemoBtn) {
            launchDemoBtn.addEventListener('click', () => {
                welcomeFlow.complete();
                demoPlayer.playDemo('pattern_work_demo');
            });
        }
    }, 500);
});

// Export for global access
window.welcomeFlow = welcomeFlow;
window.demoPlayer = demoPlayer;
window.helpGuide = helpGuide;
