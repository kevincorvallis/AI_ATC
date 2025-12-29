// Aviation Visual Interface - Airport diagrams, position tracking, visual aids
// Provides visual context for training scenarios

class AviationVisualInterface {
    constructor() {
        this.currentAirport = null;
        this.aircraftPosition = null;
        this.activeRunway = null;
        this.canvas = null;
        this.ctx = null;
    }

    /**
     * Initialize visual interface for a scenario
     */
    initialize(scenario) {
        this.createVisualElements();
        this.loadScenarioVisuals(scenario);
    }

    /**
     * Create visual elements in the DOM
     */
    createVisualElements() {
        const trainingInterface = document.getElementById('trainingInterface');
        if (!trainingInterface) return;

        // Check if visual panel already exists
        if (document.getElementById('aviationVisualPanel')) return;

        // Create visual panel
        const visualPanel = document.createElement('div');
        visualPanel.id = 'aviationVisualPanel';
        visualPanel.className = 'aviation-visual-panel';
        visualPanel.innerHTML = `
            <div class="visual-header">
                <h3>Situational Awareness</h3>
                <button class="toggle-visual" id="toggleVisual">Hide</button>
            </div>
            <div class="visual-content">
                <!-- Airport Diagram Canvas -->
                <div class="airport-diagram-container">
                    <canvas id="airportDiagram" width="400" height="300"></canvas>
                    <div class="diagram-legend">
                        <span class="legend-item"><span class="legend-color" style="background: #4CAF50;"></span> Your Position</span>
                        <span class="legend-item"><span class="legend-color" style="background: #ff9800;"></span> Active Runway</span>
                        <span class="legend-item"><span class="legend-color" style="background: #2196F3;"></span> Taxiways</span>
                    </div>
                </div>

                <!-- Flight Progress Indicator -->
                <div class="flight-progress-container">
                    <div class="progress-header">
                        <span class="progress-label">Flight Progress</span>
                        <span class="progress-percentage" id="progressPercentage">0%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" id="progressFill" style="width: 0%;"></div>
                    </div>
                    <div class="current-phase" id="currentPhase">Pre-flight</div>
                </div>

                <!-- Aircraft State Display -->
                <div class="aircraft-state">
                    <div class="state-item">
                        <span class="state-label">Position:</span>
                        <span class="state-value" id="aircraftPosition">Ground</span>
                    </div>
                    <div class="state-item">
                        <span class="state-label">Next Action:</span>
                        <span class="state-value" id="nextAction">Contact Ground</span>
                    </div>
                </div>

                <!-- Wind Indicator -->
                <div class="wind-indicator">
                    <div class="wind-header">Wind</div>
                    <canvas id="windrose" width="100" height="100"></canvas>
                    <div class="wind-text" id="windText">270° at 8 kts</div>
                </div>
            </div>
        `;

        // Insert after radio panel
        const radioPanel = document.querySelector('.radio-panel');
        if (radioPanel && radioPanel.parentNode) {
            radioPanel.parentNode.insertBefore(visualPanel, radioPanel.nextSibling);
        } else {
            // Fallback: append to training interface if radio panel not found
            const trainingInterface = document.getElementById('trainingInterface');
            if (trainingInterface) {
                trainingInterface.appendChild(visualPanel);
            } else {
                console.warn('Cannot insert visual panel: training interface not found');
            }
        }

        // Initialize canvas
        this.canvas = document.getElementById('airportDiagram');
        this.ctx = this.canvas?.getContext('2d');

        // Toggle visibility
        document.getElementById('toggleVisual')?.addEventListener('click', () => {
            this.toggleVisibility();
        });
    }

    /**
     * Load visuals for a specific scenario
     */
    loadScenarioVisuals(scenario) {
        const scenarioData = scenario;

        // Set default airport (Metro Airport for pattern work)
        this.currentAirport = {
            name: 'Metro Airport',
            runways: [
                { number: '27', heading: 270, length: 5000, width: 100 },
                { number: '09', heading: 90, length: 5000, width: 100 }
            ],
            taxiways: [
                { name: 'A', type: 'parallel', points: [[50, 150], [350, 150]] },
                { name: 'B', type: 'parallel', points: [[50, 200], [350, 200]] }
            ]
        };

        this.activeRunway = this.currentAirport.runways[0];
        this.drawAirportDiagram();
        this.updateWind(270, 8);
    }

    /**
     * Draw airport diagram on canvas
     */
    drawAirportDiagram() {
        if (!this.ctx || !this.canvas) return;

        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Background
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, width, height);

        // Draw runways
        if (this.currentAirport?.runways) {
            this.currentAirport.runways.forEach(runway => {
                const isActive = runway.number === this.activeRunway?.number;

                ctx.fillStyle = isActive ? '#ff9800' : '#666';
                ctx.strokeStyle = isActive ? '#ffb74d' : '#888';
                ctx.lineWidth = 2;

                // Draw runway (simplified as rectangle in center)
                const runwayWidth = 80;
                const runwayHeight = 200;
                const x = width / 2 - runwayWidth / 2;
                const y = height / 2 - runwayHeight / 2;

                ctx.fillRect(x, y, runwayWidth, runwayHeight);
                ctx.strokeRect(x, y, runwayWidth, runwayHeight);

                // Draw centerline dashes
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.setLineDash([10, 10]);
                ctx.beginPath();
                ctx.moveTo(width / 2, y);
                ctx.lineTo(width / 2, y + runwayHeight);
                ctx.stroke();
                ctx.setLineDash([]);

                // Draw runway numbers
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(runway.number, width / 2, y + 30);
            });
        }

        // Draw taxiways
        if (this.currentAirport?.taxiways) {
            ctx.strokeStyle = '#2196F3';
            ctx.lineWidth = 15;
            this.currentAirport.taxiways.forEach(taxiway => {
                ctx.beginPath();
                ctx.moveTo(taxiway.points[0][0], taxiway.points[0][1]);
                ctx.lineTo(taxiway.points[1][0], taxiway.points[1][1]);
                ctx.stroke();

                // Label
                ctx.fillStyle = '#2196F3';
                ctx.font = 'bold 16px Arial';
                ctx.fillText(taxiway.name, taxiway.points[0][0] - 20, taxiway.points[0][1]);
            });
        }

        // Draw aircraft position if set
        if (this.aircraftPosition) {
            this.drawAircraft(this.aircraftPosition.x, this.aircraftPosition.y, this.aircraftPosition.heading);
        }
    }

    /**
     * Draw aircraft icon at position
     */
    drawAircraft(x, y, heading = 0) {
        const ctx = this.ctx;
        if (!ctx) return;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((heading * Math.PI) / 180);

        // Aircraft symbol (simplified)
        ctx.fillStyle = '#4CAF50';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;

        ctx.beginPath();
        // Body
        ctx.moveTo(0, -15);
        ctx.lineTo(-8, 10);
        ctx.lineTo(8, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Wings
        ctx.beginPath();
        ctx.moveTo(-20, 0);
        ctx.lineTo(20, 0);
        ctx.stroke();

        ctx.restore();
    }

    /**
     * Update aircraft position based on phase
     */
    updatePosition(phase) {
        const width = this.canvas?.width || 400;
        const height = this.canvas?.height || 300;

        const positions = {
            'initial_contact': { x: 50, y: 180, heading: 0, text: 'At Ramp' },
            'departure_ready': { x: width / 2 - 40, y: height - 50, heading: 270, text: 'Holding Short Rwy 27' },
            'takeoff_clearance': { x: width / 2, y: height - 50, heading: 270, text: 'Runway 27' },
            'crosswind': { x: width - 60, y: height - 80, heading: 360, text: 'Crosswind' },
            'downwind': { x: width - 50, y: height / 2, heading: 90, text: 'Left Downwind Rwy 27' },
            'base': { x: width - 80, y: 80, heading: 180, text: 'Left Base Rwy 27' },
            'final': { x: width / 2, y: 60, heading: 270, text: 'Final Rwy 27' },
            'landing': { x: width / 2, y: height / 2, heading: 270, text: 'On Runway' },
            'taxi_clearance': { x: 100, y: 150, heading: 270, text: 'Taxiing' },
            'holding_short': { x: width / 2 - 50, y: height - 70, heading: 270, text: 'Holding Short' }
        };

        const position = positions[phase];
        if (position) {
            this.aircraftPosition = position;
            document.getElementById('aircraftPosition').textContent = position.text;
            this.drawAirportDiagram(); // Redraw with new position
        }
    }

    /**
     * Update wind indicator
     */
    updateWind(direction, speed) {
        const canvas = document.getElementById('windrose');
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 40;

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw compass circle
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();

        // Draw cardinal directions
        ctx.fillStyle = '#aaa';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('N', centerX, centerY - radius - 10);
        ctx.fillText('S', centerX, centerY + radius + 10);
        ctx.fillText('E', centerX + radius + 10, centerY);
        ctx.fillText('W', centerX - radius - 10, centerY);

        // Draw wind arrow
        ctx.strokeStyle = '#4CAF50';
        ctx.fillStyle = '#4CAF50';
        ctx.lineWidth = 3;

        const angle = (direction - 90) * (Math.PI / 180); // Convert to radians, adjust for canvas
        const arrowLength = Math.min(speed * 2, radius - 10);

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle);

        // Arrow shaft
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(arrowLength, 0);
        ctx.stroke();

        // Arrowhead
        ctx.beginPath();
        ctx.moveTo(arrowLength, 0);
        ctx.lineTo(arrowLength - 8, -5);
        ctx.lineTo(arrowLength - 8, 5);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        // Update text with null check
        const windTextEl = document.getElementById('windText');
        if (windTextEl) {
            windTextEl.textContent = `${direction}° at ${speed} kts`;
        }
    }

    /**
     * Update flight progress bar
     */
    updateProgress(state) {
        if (!state) return;

        const progressFill = document.getElementById('progressFill');
        const progressPercentage = document.getElementById('progressPercentage');
        const currentPhase = document.getElementById('currentPhase');

        if (progressFill) {
            progressFill.style.width = `${state.progress}%`;
        }
        if (progressPercentage) {
            progressPercentage.textContent = `${state.progress}%`;
        }
        if (currentPhase) {
            currentPhase.textContent = state.phaseName || 'In Progress';
        }

        // Update position
        this.updatePosition(state.phase);
    }

    /**
     * Update next expected action
     */
    updateNextAction(hint) {
        const nextActionEl = document.getElementById('nextAction');
        if (nextActionEl && hint) {
            nextActionEl.textContent = hint.shouldDo || 'Continue';
        }
    }

    /**
     * Toggle visibility of visual panel
     */
    toggleVisibility() {
        const panel = document.getElementById('aviationVisualPanel');
        const button = document.getElementById('toggleVisual');

        if (panel && button) {
            const content = panel.querySelector('.visual-content');
            if (content) {
                const isVisible = content.style.display !== 'none';
                content.style.display = isVisible ? 'none' : 'block';
                button.textContent = isVisible ? 'Show' : 'Hide';
            }
        }
    }

    /**
     * Highlight a specific area (e.g., runway, taxiway)
     */
    highlightArea(areaType, areaId) {
        // Redraw diagram with highlight
        // This could be extended to show specific areas highlighted
        this.drawAirportDiagram();
    }

    /**
     * Reset visual interface
     */
    reset() {
        this.aircraftPosition = null;
        if (this.ctx && this.canvas) {
            this.drawAirportDiagram();
        }

        // Add null-safe updates
        const progressFill = document.getElementById('progressFill');
        const progressPercentage = document.getElementById('progressPercentage');
        const currentPhase = document.getElementById('currentPhase');
        const aircraftPosition = document.getElementById('aircraftPosition');
        const nextAction = document.getElementById('nextAction');

        if (progressFill) progressFill.style.width = '0%';
        if (progressPercentage) progressPercentage.textContent = '0%';
        if (currentPhase) currentPhase.textContent = 'Pre-flight';
        if (aircraftPosition) aircraftPosition.textContent = 'Ground';
        if (nextAction) nextAction.textContent = 'Begin scenario';
    }
}

// Create global instance
window.aviationVisual = new AviationVisualInterface();
