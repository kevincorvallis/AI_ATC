// Interactive Tutorial / Walkthrough Mode

class ATCTutorial {
    constructor(app) {
        this.app = app;
        this.currentStep = 0;
        this.isActive = false;
        this.lessons = this.createLessons();
    }

    createLessons() {
        return [
            // Lesson 1: Pattern Work Beginner
            {
                title: "Lesson 1: First Solo Pattern",
                description: "Learn the basics of pattern communications",
                steps: [
                    {
                        category: "pattern_work",
                        scenarioId: "pattern_first_solo",
                        instruction: "Welcome to your first solo pattern! You'll practice basic pattern calls in calm conditions. Start by requesting takeoff clearance.",
                        expectedPhrases: ["tower", "ready for departure", "runway"],
                        tip: "Say: '[Airport] Tower, [Your Callsign], ready for departure, runway 27, remaining in the pattern'"
                    },
                    {
                        category: "pattern_work",
                        scenarioId: "pattern_first_solo",
                        instruction: "Great! Now report when you're on the downwind leg.",
                        expectedPhrases: ["downwind"],
                        tip: "Say: '[Airport] Tower, [Callsign], left downwind, runway 27'"
                    },
                    {
                        category: "pattern_work",
                        scenarioId: "pattern_first_solo",
                        instruction: "Perfect! Now report when you turn base to final.",
                        expectedPhrases: ["base", "full stop"],
                        tip: "Say: '[Airport] Tower, [Callsign], left base, runway 27, full stop'"
                    }
                ]
            },

            // Lesson 2: Ground Operations
            {
                title: "Lesson 2: Taxi Operations",
                description: "Master ground control communications",
                steps: [
                    {
                        category: "ground_operations",
                        scenarioId: "ground_first_taxi",
                        instruction: "You're parked and ready to taxi. Request taxi clearance from Ground.",
                        expectedPhrases: ["ground", "taxi", "information"],
                        tip: "Say: '[Airport] Ground, [Callsign], at [location], taxi with information [ATIS letter]'"
                    },
                    {
                        category: "ground_operations",
                        scenarioId: "ground_first_taxi",
                        instruction: "Listen carefully and read back the taxi instructions, especially hold short points.",
                        expectedPhrases: ["taxi", "hold short"],
                        tip: "Read back: '[Callsign], taxi to runway [XX] via [taxiways], hold short runway [XX]'"
                    }
                ]
            },

            // Lesson 3: Flight Following
            {
                title: "Lesson 3: VFR Flight Following",
                description: "Learn to request radar services",
                steps: [
                    {
                        category: "flight_following",
                        scenarioId: "ff_initial_request",
                        instruction: "Request VFR flight following from Approach. Have your aircraft type, altitude, destination, and route ready.",
                        expectedPhrases: ["approach", "request", "flight following"],
                        tip: "Say: '[Approach], [Callsign], request VFR flight following to [destination], [altitude], [aircraft type]'"
                    },
                    {
                        category: "flight_following",
                        scenarioId: "ff_position_reports",
                        instruction: "Make proper position reports during flight following.",
                        expectedPhrases: ["position", "altitude", "heading"],
                        tip: "Say: '[Approach], [Callsign], position [location], [altitude], [destination]'"
                    }
                ]
            },

            // Lesson 4: Crosswind Practice
            {
                title: "Lesson 4: Crosswind Landings",
                description: "Handle challenging wind conditions",
                steps: [
                    {
                        category: "pattern_work",
                        scenarioId: "pattern_crosswind",
                        instruction: "Practice pattern work with crosswind conditions. Pay attention to wind updates from tower.",
                        expectedPhrases: ["tower", "pattern", "runway"],
                        tip: "Controllers will give you wind updates. Acknowledge and adjust your technique."
                    }
                ]
            },

            // Lesson 5: Emergency Procedures
            {
                title: "Lesson 5: Emergency Communications",
                description: "Practice declaring emergencies",
                steps: [
                    {
                        category: "emergency",
                        scenarioId: "emerg_low_fuel",
                        instruction: "Declare minimum fuel. State your fuel remaining in minutes and request priority.",
                        expectedPhrases: ["minimum fuel", "fuel remaining"],
                        tip: "Say: '[ATC], [Callsign], minimum fuel, [XX] minutes remaining, request priority landing'"
                    }
                ]
            }
        ];
    }

    start() {
        this.isActive = true;
        this.currentLessonIndex = 0;
        this.currentStepIndex = 0;
        this.showTutorialInterface();
        this.loadCurrentStep();
    }

    showTutorialInterface() {
        // Hide other interfaces
        document.querySelector('.main-menu').style.display = 'none';
        document.querySelector('.scenario-selection').style.display = 'none';
        document.getElementById('individualScenarioSelection').style.display = 'none';
        document.getElementById('liveAtcInterface').style.display = 'none';

        // Show tutorial interface
        const tutorialUI = document.getElementById('tutorialInterface');
        if (tutorialUI) {
            tutorialUI.style.display = 'block';
        }
    }

    loadCurrentStep() {
        const lesson = this.lessons[this.currentLessonIndex];
        const step = lesson.steps[this.currentStepIndex];

        // Update tutorial UI
        this.updateTutorialUI(lesson, step);

        // Load the scenario
        this.app.startScenario(step.category, step.scenarioId);

        // Show instruction overlay
        this.showInstructionOverlay(step);
    }

    updateTutorialUI(lesson, step) {
        const tutorialProgress = document.getElementById('tutorialProgress');
        if (tutorialProgress) {
            tutorialProgress.innerHTML = `
                <div class="tutorial-header">
                    <h2>📚 ${lesson.title}</h2>
                    <p>${lesson.description}</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${((this.currentStepIndex + 1) / lesson.steps.length) * 100}%"></div>
                    </div>
                    <p class="step-counter">Step ${this.currentStepIndex + 1} of ${lesson.steps.length}</p>
                </div>
            `;
        }
    }

    showInstructionOverlay(step) {
        const overlay = document.getElementById('tutorialOverlay');
        if (!overlay) {
            const newOverlay = document.createElement('div');
            newOverlay.id = 'tutorialOverlay';
            newOverlay.className = 'tutorial-overlay';
            document.body.appendChild(newOverlay);
        }

        const overlayContent = document.getElementById('tutorialOverlay');
        overlayContent.innerHTML = `
            <div class="tutorial-instruction-card">
                <h3>📋 Your Task</h3>
                <p class="instruction-text">${step.instruction}</p>
                <div class="instruction-tip">
                    <strong>💡 Example:</strong>
                    <p>${step.tip}</p>
                </div>
                <button class="btn-primary" onclick="tutorial.hideInstructionOverlay()">Got it! Let's practice</button>
                <button class="btn-secondary" onclick="tutorial.skipStep()">Skip this step</button>
            </div>
        `;
        overlayContent.style.display = 'flex';
    }

    hideInstructionOverlay() {
        const overlay = document.getElementById('tutorialOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    checkProgress(userMessage) {
        if (!this.isActive) return;

        const lesson = this.lessons[this.currentLessonIndex];
        const step = lesson.steps[this.currentStepIndex];

        // Check if user's message contains expected phrases (case insensitive)
        const messageLower = userMessage.toLowerCase();
        const hasExpectedPhrases = step.expectedPhrases.some(phrase =>
            messageLower.includes(phrase.toLowerCase())
        );

        if (hasExpectedPhrases) {
            // Show success and move to next step
            setTimeout(() => {
                this.nextStep();
            }, 2000);
        }
    }

    nextStep() {
        const lesson = this.lessons[this.currentLessonIndex];

        if (this.currentStepIndex < lesson.steps.length - 1) {
            // Move to next step in current lesson
            this.currentStepIndex++;
            this.loadCurrentStep();
        } else {
            // Lesson complete
            this.showLessonComplete();
        }
    }

    skipStep() {
        this.hideInstructionOverlay();
        this.nextStep();
    }

    showLessonComplete() {
        const lesson = this.lessons[this.currentLessonIndex];

        const overlay = document.getElementById('tutorialOverlay');
        overlay.innerHTML = `
            <div class="tutorial-complete-card">
                <h2>🎉 Lesson Complete!</h2>
                <h3>${lesson.title}</h3>
                <p>Great job! You've completed this lesson.</p>
                <div class="complete-buttons">
                    ${this.currentLessonIndex < this.lessons.length - 1
                        ? '<button class="btn-primary" onclick="tutorial.nextLesson()">Next Lesson →</button>'
                        : '<button class="btn-primary" onclick="tutorial.completeTutorial()">Finish Tutorial 🎓</button>'
                    }
                    <button class="btn-secondary" onclick="tutorial.exit()">Exit Tutorial</button>
                </div>
            </div>
        `;
        overlay.style.display = 'flex';
    }

    nextLesson() {
        if (this.currentLessonIndex < this.lessons.length - 1) {
            this.currentLessonIndex++;
            this.currentStepIndex = 0;
            this.loadCurrentStep();
        }
    }

    completeTutorial() {
        const overlay = document.getElementById('tutorialOverlay');
        overlay.innerHTML = `
            <div class="tutorial-complete-card">
                <h2>🎓 Tutorial Complete!</h2>
                <p>Congratulations! You've completed all tutorial lessons.</p>
                <p>You're now ready to practice independently!</p>
                <button class="btn-primary" onclick="tutorial.exit()">Return to Main Menu</button>
            </div>
        `;
    }

    exit() {
        this.isActive = false;
        this.hideInstructionOverlay();

        // Return to main menu
        if (this.app) {
            this.app.showMainMenu();
        }
    }
}

// Global tutorial instance
let tutorial = null;

// Initialize tutorial
function startTutorial() {
    if (window.atcApp) {
        tutorial = new ATCTutorial(window.atcApp);
        tutorial.start();
    }
}
