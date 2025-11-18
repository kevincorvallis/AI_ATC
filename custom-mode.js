// Custom Scenario Mode - Create Your Own Training Scenarios

class CustomScenarioMode {
    constructor(app) {
        this.app = app;
        this.currentCustomScenario = null;
        this.templates = this.createTemplates();
        this.examplePrompts = this.createExamplePrompts();
        this.recentAirports = this.loadRecentAirports();
    }

    loadRecentAirports() {
        try {
            const saved = localStorage.getItem('recentAirportDiagrams');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    }

    saveRecentAirport(icao) {
        // Add to recent airports, keeping only last 5
        this.recentAirports = [icao, ...this.recentAirports.filter(a => a !== icao)].slice(0, 5);
        try {
            localStorage.setItem('recentAirportDiagrams', JSON.stringify(this.recentAirports));
        } catch (e) {
            console.error('Failed to save recent airports:', e);
        }
        this.updateRecentAirportsUI();
    }

    updateRecentAirportsUI() {
        const container = document.getElementById('recentAirports');
        if (!container) return;

        if (this.recentAirports.length === 0) {
            container.innerHTML = '<p class="recent-empty">No recent searches</p>';
            return;
        }

        container.innerHTML = this.recentAirports.map(icao =>
            `<button class="recent-airport-btn" data-icao="${icao}">${icao}</button>`
        ).join('');

        // Add click handlers
        container.querySelectorAll('.recent-airport-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('airportDiagramSearch').value = btn.dataset.icao;
                this.loadAirportDiagram();
            });
        });
    }

    createTemplates() {
        return {
            arrival: {
                name: "Arrival",
                description: "Coming in for landing at an airport",
                template: `You are an air traffic controller at {airport}.
A pilot in a {aircraft_type} is approaching from {direction} at {altitude} feet, requesting to land.
Current conditions: {weather}, wind {wind}, runway in use is {runway}.

Your role:
- Provide arrival instructions
- Issue pattern entry instructions
- Clear the aircraft to land when appropriate
- Use proper ATC phraseology
- Provide traffic advisories if relevant

Respond professionally as a tower controller.`
            },
            departure: {
                name: "Departure",
                description: "Taking off from an airport",
                template: `You are an air traffic controller at {airport}.
A pilot in a {aircraft_type} is ready for departure on runway {runway}, planning to {intentions}.
Current conditions: {weather}, wind {wind}, traffic is {traffic_level}.

Your role:
- Issue taxi and departure clearances
- Provide takeoff clearance when appropriate
- Give departure instructions
- Use proper ATC phraseology

Respond professionally as a tower/ground controller.`
            },
            enroute: {
                name: "En Route",
                description: "Flying cross-country with flight following",
                template: `You are an approach/center controller providing VFR flight following.
A pilot in a {aircraft_type} is en route from {origin} to {destination} at {altitude} feet.
Current conditions: {weather}, visibility {visibility}.

Your role:
- Provide flight following services
- Issue traffic advisories
- Provide weather updates
- Vector around obstacles if needed
- Use proper approach/center phraseology

Respond professionally as an approach/center controller.`
            },
            practice_area: {
                name: "Practice Area",
                description: "Practicing maneuvers in a designated area",
                template: `You are an approach controller monitoring a practice area near {airport}.
A pilot in a {aircraft_type} is practicing {maneuvers} at {altitude} feet in the {area_name} practice area.
Current conditions: {weather}, visibility {visibility}.

Your role:
- Monitor the aircraft
- Provide traffic advisories
- Coordinate airspace if needed
- Provide safety advisories
- Use proper ATC phraseology

Respond professionally as an approach controller.`
            },
            custom: {
                name: "Custom",
                description: "Fully custom scenario",
                template: `You are an air traffic controller.
{custom_scenario}

Your role:
- Respond appropriately to the pilot's situation
- Use proper ATC phraseology
- Provide assistance as needed
- Be professional and helpful

Respond as a controller would in this situation.`
            }
        };
    }

    createExamplePrompts() {
        return [
            {
                category: "Arrival",
                prompt: "I'm approaching South Bend airport from the north at 3,000 feet in a Cessna 172, requesting landing clearance",
                parsed: {
                    airport: "South Bend Regional Airport (KSBN)",
                    aircraft_type: "Cessna 172",
                    direction: "the north",
                    altitude: "3,000",
                    weather: "VFR",
                    wind: "270 at 8 kts",
                    runway: "27"
                }
            },
            {
                category: "Departure",
                prompt: "I'm at Palo Alto Airport ready for departure, planning to fly to San Jose",
                parsed: {
                    airport: "Palo Alto Airport (KPAO)",
                    aircraft_type: "Cessna 172",
                    runway: "31",
                    intentions: "depart to the southeast toward San Jose",
                    weather: "VFR",
                    wind: "310 at 6 kts",
                    traffic_level: "moderate"
                }
            },
            {
                category: "En Route",
                prompt: "I'm flying from Santa Monica to San Diego at 4,500 feet and would like flight following",
                parsed: {
                    aircraft_type: "Cessna 172",
                    origin: "Santa Monica (KSMO)",
                    destination: "San Diego (KSAN)",
                    altitude: "4,500",
                    weather: "VFR",
                    visibility: "10+ miles"
                }
            },
            {
                category: "Practice Area",
                prompt: "I'm practicing steep turns in the Livermore practice area at 4,000 feet",
                parsed: {
                    airport: "Livermore Airport (KLVK)",
                    aircraft_type: "Cessna 172",
                    maneuvers: "steep turns",
                    altitude: "4,000",
                    area_name: "Livermore",
                    weather: "VFR",
                    visibility: "10+ miles"
                }
            },
            {
                category: "Custom",
                prompt: "I'm a student pilot on my first solo cross-country flight and I'm getting nervous about the weather ahead",
                parsed: {
                    custom_scenario: "A student pilot on their first solo cross-country is becoming concerned about weather conditions ahead. They need reassurance and guidance."
                }
            }
        ];
    }

    generateCallsign() {
        // Generate realistic GA callsigns
        const types = ['N', 'Skyhawk', 'Skylane', 'Cherokee', 'Warrior'];
        const prefixes = ['November', 'N'];

        if (Math.random() > 0.3) {
            // N-number format: N12345
            const numbers = Math.floor(Math.random() * 90000) + 10000;
            const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
            return `N${numbers}${letter}`;
        } else {
            // Type + number: Skyhawk 234
            const type = types[Math.floor(Math.random() * types.length)];
            const num = Math.floor(Math.random() * 900) + 100;
            return `${type} ${num}`;
        }
    }

    generateFlightDetails(parsedData) {
        const callsign = this.generateCallsign();
        const squawk = 1200 + Math.floor(Math.random() * 6700); // VFR squawk codes
        const runway = parsedData.runway || this.getRunwayFromWind(parsedData.wind);

        const details = {
            callsign: callsign,
            squawk: squawk.toString().padStart(4, '0'),
            runway: runway,
            frequency: '118.300',
            departure_freq: '121.700',
            ground_freq: '121.900',
            atis: String.fromCharCode(65 + Math.floor(Math.random() * 26)), // Random ATIS letter
            souls_on_board: Math.floor(Math.random() * 3) + 1,
            fuel_hours: Math.floor(Math.random() * 2) + 3,
            fuel_minutes: Math.floor(Math.random() * 60)
        };

        return details;
    }

    getRunwayFromWind(wind) {
        // Simple runway selection based on wind
        const windMatch = wind.match(/(\d{3})/);
        if (windMatch) {
            const windDir = parseInt(windMatch[1]);
            const runway = Math.round(windDir / 10);
            return runway.toString().padStart(2, '0');
        }
        return '27'; // Default
    }

    parseCustomPrompt(userPrompt) {
        // Parse the user's natural language prompt and extract key information
        const prompt = userPrompt.toLowerCase();
        const parsed = {
            airport: null,
            airport_name: null,
            aircraft_type: "Cessna 172", // Default
            scenario_type: null,
            altitude: null,
            weather: "VFR", // Default
            wind: "270 at 8 kts", // Default
            runway: null,
            custom_details: userPrompt
        };

        // Detect scenario type
        if (prompt.includes('landing') || prompt.includes('arrival') || prompt.includes('coming in') || prompt.includes('inbound')) {
            parsed.scenario_type = 'arrival';
        } else if (prompt.includes('departure') || prompt.includes('takeoff') || prompt.includes('taking off') || prompt.includes('ready for departure')) {
            parsed.scenario_type = 'departure';
        } else if (prompt.includes('cross-country') || prompt.includes('en route') || prompt.includes('flight following') || prompt.includes('flying from')) {
            parsed.scenario_type = 'enroute';
        } else if (prompt.includes('practice area') || prompt.includes('practicing') || prompt.includes('maneuvers')) {
            parsed.scenario_type = 'practice_area';
        } else {
            parsed.scenario_type = 'custom';
        }

        // Extract airport codes (ICAO format KXXX)
        const icaoMatch = userPrompt.match(/\b(K[A-Z]{3}|[A-Z]{4})\b/i);
        if (icaoMatch) {
            parsed.airport = icaoMatch[0].toUpperCase();
        }

        // Extract common airport names
        const airportNames = {
            'south bend': 'South Bend Regional Airport (KSBN)',
            'palo alto': 'Palo Alto Airport (KPAO)',
            'san jose': 'San Jose International Airport (KSJC)',
            'santa monica': 'Santa Monica Airport (KSMO)',
            'san diego': 'San Diego International Airport (KSAN)',
            'livermore': 'Livermore Airport (KLVK)',
            'jfk': 'John F. Kennedy International Airport (KJFK)',
            'lax': 'Los Angeles International Airport (KLAX)',
            "o'hare": "Chicago O'Hare International Airport (KORD)",
            'sfo': 'San Francisco International Airport (KSFO)'
        };

        for (const [name, fullName] of Object.entries(airportNames)) {
            if (prompt.includes(name)) {
                parsed.airport_name = fullName;
                // Extract ICAO code from fullName
                const icaoExtract = fullName.match(/\(([A-Z]{4})\)/);
                if (icaoExtract) {
                    parsed.airport = icaoExtract[1];
                }
                break;
            }
        }

        // If we have ICAO but no name, use just the ICAO
        if (parsed.airport && !parsed.airport_name) {
            parsed.airport_name = parsed.airport;
        }

        // Extract altitude (look for numbers followed by "feet", "ft", or just numbers between 1000-18000)
        const altitudeMatch = userPrompt.match(/(\d{1,2},?\d{3})\s*(feet|ft|')?/i) ||
                            userPrompt.match(/\bat\s+(\d{1,2},?\d{3})/i);
        if (altitudeMatch) {
            parsed.altitude = altitudeMatch[1].replace(',', '');
        }

        // Extract aircraft type
        const aircraftTypes = [
            'cessna 172', 'cessna 152', 'piper', 'cirrus', 'diamond',
            'c172', 'c152', 'pa28', 'sr22', 'da40', 'baron', 'bonanza'
        ];
        for (const aircraft of aircraftTypes) {
            if (prompt.includes(aircraft)) {
                parsed.aircraft_type = aircraft.toUpperCase().replace(/(\d+)/, ' $1');
                break;
            }
        }

        // Extract direction (north, south, east, west, etc.)
        const directionMatch = userPrompt.match(/from\s+the\s+(north|south|east|west|northeast|northwest|southeast|southwest)/i);
        if (directionMatch) {
            parsed.direction = directionMatch[1];
        }

        // Extract runway
        const runwayMatch = userPrompt.match(/runway\s+(\d{1,2}[LRC]?)/i);
        if (runwayMatch) {
            parsed.runway = runwayMatch[1];
        }

        return parsed;
    }

    generateSystemPrompt(parsedData, flightDetails) {
        const template = this.templates[parsedData.scenario_type] || this.templates.custom;
        let prompt = template.template;

        // Replace placeholders with parsed data and flight details
        const replacements = {
            airport: parsedData.airport_name || parsedData.airport || "a towered airport",
            callsign: flightDetails.callsign,
            aircraft_type: parsedData.aircraft_type || "Cessna 172",
            direction: parsedData.direction || "the north",
            altitude: parsedData.altitude || "3,000",
            weather: parsedData.weather || "VFR, clear skies",
            wind: parsedData.wind || "270 at 8 kts",
            runway: flightDetails.runway,
            intentions: parsedData.intentions || "remain in the pattern",
            traffic_level: parsedData.traffic_level || "light",
            origin: parsedData.origin || "their departure airport",
            destination: parsedData.destination || "their destination",
            visibility: parsedData.visibility || "10+ miles",
            maneuvers: parsedData.maneuvers || "various maneuvers",
            area_name: parsedData.area_name || "the designated practice area",
            custom_scenario: parsedData.custom_details || "Handle the pilot's request professionally",
            squawk: flightDetails.squawk,
            atis: flightDetails.atis
        };

        for (const [key, value] of Object.entries(replacements)) {
            prompt = prompt.replace(new RegExp(`{${key}}`, 'g'), value);
        }

        // Add flight details to the prompt
        prompt += `\n\nThe pilot is flying ${flightDetails.callsign}, squawking ${flightDetails.squawk}. Current ATIS is information ${flightDetails.atis}. Use the callsign naturally in your responses.`;

        return prompt;
    }

    showCustomModeInterface() {
        // Hide other interfaces
        document.querySelector('.main-menu').style.display = 'none';
        document.querySelector('.scenario-selection').style.display = 'none';
        document.getElementById('individualScenarioSelection').style.display = 'none';
        document.getElementById('liveAtcInterface').style.display = 'none';
        document.getElementById('commInterface').style.display = 'none';

        // Show custom mode interface
        let customInterface = document.getElementById('customModeInterface');
        if (!customInterface) {
            customInterface = this.createCustomModeInterface();
            document.querySelector('.container').appendChild(customInterface);
        }
        customInterface.style.display = 'block';

        // Populate examples
        this.populateExamples();

        // Load pending airport diagram if available
        if (this.pendingAirportDiagram) {
            setTimeout(() => {
                const searchInput = document.getElementById('airportDiagramSearch');
                if (searchInput) {
                    searchInput.value = this.pendingAirportDiagram;
                    this.loadAirportDiagram();
                    this.pendingAirportDiagram = null; // Clear after loading
                }
            }, 100);
        }
    }

    createCustomModeInterface() {
        const div = document.createElement('div');
        div.id = 'customModeInterface';
        div.className = 'custom-mode-interface';
        div.innerHTML = `
            <div class="mode-header">
                <h2>🎨 Create Your Own Scenario</h2>
                <button class="btn-secondary" id="backToMainFromCustom">← Back to Main Menu</button>
            </div>

            <div class="custom-mode-content">
                <div class="custom-mode-info">
                    <p>Describe your training scenario in natural language. Our AI will understand your situation and create a realistic ATC environment.</p>
                </div>

                <div class="prompt-section">
                    <label for="customPrompt">Describe your scenario:</label>
                    <textarea
                        id="customPrompt"
                        class="custom-prompt-input"
                        placeholder="Example: I'm approaching South Bend airport from the north at 3,000 feet in a Cessna 172, requesting landing clearance"
                        rows="4"
                    ></textarea>
                    <div class="prompt-actions">
                        <button class="btn-primary" id="startCustomScenario">🚀 Start Scenario</button>
                        <button class="btn-secondary" id="clearPrompt">Clear</button>
                    </div>
                </div>

                <div class="airport-diagram-section">
                    <h3>📋 Airport Diagrams</h3>
                    <p>View airport diagrams to help with your scenario planning</p>
                    <div class="airport-diagram-controls">
                        <input
                            type="text"
                            id="airportDiagramSearch"
                            placeholder="Enter airport code (e.g., KSBN, KPAO)"
                            class="airport-search-input"
                        />
                        <button class="btn-secondary" id="loadDiagram">Load Diagram</button>
                    </div>
                    <div class="recent-airports-section">
                        <p class="recent-label">Recent:</p>
                        <div id="recentAirports" class="recent-airports-container"></div>
                    </div>
                    <div id="airportDiagramViewer" class="airport-diagram-viewer">
                        <p class="diagram-placeholder">Enter an airport code to view its diagram</p>
                    </div>
                </div>

                <div class="examples-section">
                    <h3>💡 Example Scenarios</h3>
                    <p>Click any example to use it as a template:</p>
                    <div id="examplesContainer" class="examples-container">
                        <!-- Populated by JavaScript -->
                    </div>
                </div>

                <div class="templates-section">
                    <h3>📝 Scenario Templates</h3>
                    <div class="templates-grid" id="templatesGrid">
                        <!-- Populated by JavaScript -->
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        setTimeout(() => {
            document.getElementById('backToMainFromCustom').addEventListener('click', () => {
                this.app.showMainMenu();
            });

            document.getElementById('startCustomScenario').addEventListener('click', () => {
                this.startCustomScenario();
            });

            document.getElementById('clearPrompt').addEventListener('click', () => {
                document.getElementById('customPrompt').value = '';
            });

            document.getElementById('loadDiagram').addEventListener('click', () => {
                this.loadAirportDiagram();
            });

            // Add Enter key support for diagram search
            document.getElementById('airportDiagramSearch').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.loadAirportDiagram();
                }
            });

            // Initialize recent airports UI
            this.updateRecentAirportsUI();
        }, 0);

        return div;
    }

    populateExamples() {
        const container = document.getElementById('examplesContainer');
        if (!container) return;

        container.innerHTML = '';

        this.examplePrompts.forEach((example, index) => {
            const exampleCard = document.createElement('div');
            exampleCard.className = 'example-card';
            exampleCard.innerHTML = `
                <div class="example-category">${example.category}</div>
                <div class="example-prompt">${example.prompt}</div>
                <button class="btn-use-example" data-index="${index}">Use This Example</button>
            `;

            exampleCard.querySelector('.btn-use-example').addEventListener('click', () => {
                document.getElementById('customPrompt').value = example.prompt;
                document.getElementById('customPrompt').scrollIntoView({ behavior: 'smooth' });
            });

            container.appendChild(exampleCard);
        });

        // Populate templates
        const templatesGrid = document.getElementById('templatesGrid');
        if (templatesGrid) {
            templatesGrid.innerHTML = '';
            for (const [key, template] of Object.entries(this.templates)) {
                const templateCard = document.createElement('div');
                templateCard.className = 'template-card';
                templateCard.innerHTML = `
                    <h4>${template.name}</h4>
                    <p>${template.description}</p>
                `;
                templatesGrid.appendChild(templateCard);
            }
        }
    }

    startCustomScenario() {
        const promptInput = document.getElementById('customPrompt');
        const userPrompt = promptInput.value.trim();

        if (!userPrompt) {
            alert('Please enter a scenario description');
            return;
        }

        // Parse the user's prompt
        const parsedData = this.parseCustomPrompt(userPrompt);

        // Generate flight details
        const flightDetails = this.generateFlightDetails(parsedData);

        // Generate system prompt
        const systemPrompt = this.generateSystemPrompt(parsedData, flightDetails);

        // Store custom scenario data
        this.currentCustomScenario = {
            userPrompt: userPrompt,
            parsedData: parsedData,
            flightDetails: flightDetails,
            systemPrompt: systemPrompt,
            conversationHistory: []
        };

        // Store airport code for later diagram loading
        this.pendingAirportDiagram = parsedData.airport || null;

        // Start the scenario using the app's existing infrastructure
        this.app.currentCategory = 'custom';
        this.app.currentScenario = 'custom';
        this.app.currentScenarioId = 'custom';
        this.app.conversationHistory = [];

        // Update UI
        document.getElementById('customModeInterface').style.display = 'none';
        document.getElementById('commInterface').style.display = 'block';

        document.getElementById('currentScenarioTitle').textContent = '🎨 Custom Scenario';
        document.getElementById('currentScenarioDesc').textContent = userPrompt;
        document.getElementById('frequency').textContent = flightDetails.frequency;

        // Create detailed scenario briefing
        const scenarioBrief = this.createScenarioBrief(parsedData, flightDetails, userPrompt);

        // Clear conversation and show briefing
        const conversation = document.getElementById('conversation');
        conversation.innerHTML = scenarioBrief;

        this.app.updateStatus('Ready');
    }

    createScenarioBrief(parsedData, flightDetails, userPrompt) {
        const clearanceSection = this.generateClearanceInfo(parsedData, flightDetails);

        return `
            <div class="message system-message scenario-briefing">
                <div class="briefing-header">
                    <h3>📋 Scenario Briefing</h3>
                    <p class="scenario-description">${userPrompt}</p>
                </div>

                <div class="briefing-section">
                    <h4>✈️ Your Aircraft</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Callsign:</span>
                            <span class="info-value"><strong>${flightDetails.callsign}</strong></span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Aircraft Type:</span>
                            <span class="info-value">${parsedData.aircraft_type}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Squawk:</span>
                            <span class="info-value">${flightDetails.squawk}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Souls on Board:</span>
                            <span class="info-value">${flightDetails.souls_on_board}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Fuel Remaining:</span>
                            <span class="info-value">${flightDetails.fuel_hours}+${flightDetails.fuel_minutes.toString().padStart(2, '0')}</span>
                        </div>
                    </div>
                </div>

                ${parsedData.airport ? `
                <div class="briefing-section">
                    <h4>🏢 Airport Information</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Airport:</span>
                            <span class="info-value"><strong>${parsedData.airport_name || parsedData.airport}</strong></span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Tower:</span>
                            <span class="info-value">${flightDetails.frequency}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Ground:</span>
                            <span class="info-value">${flightDetails.ground_freq}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Departure:</span>
                            <span class="info-value">${flightDetails.departure_freq}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">ATIS:</span>
                            <span class="info-value">Information ${flightDetails.atis}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Active Runway:</span>
                            <span class="info-value">${flightDetails.runway}</span>
                        </div>
                    </div>
                </div>
                ` : ''}

                <div class="briefing-section">
                    <h4>🌤️ Weather & Conditions</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Conditions:</span>
                            <span class="info-value">${parsedData.weather}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Wind:</span>
                            <span class="info-value">${parsedData.wind}</span>
                        </div>
                        ${parsedData.altitude ? `
                        <div class="info-item">
                            <span class="info-label">Altitude:</span>
                            <span class="info-value">${parsedData.altitude} feet</span>
                        </div>
                        ` : ''}
                    </div>
                </div>

                ${clearanceSection}

                <div class="briefing-footer">
                    <p><strong>Ready to begin?</strong></p>
                    <p>Press and hold <strong>"Push to Talk"</strong> or the <strong>Spacebar</strong> to start your radio transmission.</p>
                    ${parsedData.airport ? `<p class="diagram-hint">💡 Scroll down to view the airport diagram for ${parsedData.airport}</p>` : ''}
                </div>
            </div>
        `;
    }

    generateClearanceInfo(parsedData, flightDetails) {
        if (!parsedData.scenario_type) return '';

        let clearanceText = '';
        let exampleCall = '';

        switch (parsedData.scenario_type) {
            case 'departure':
                clearanceText = 'Clearance for Departure';
                exampleCall = `"${parsedData.airport_name || 'Tower'}, ${flightDetails.callsign}, ready for departure, runway ${flightDetails.runway}."`;
                break;
            case 'arrival':
                clearanceText = 'Expected Arrival Instructions';
                exampleCall = `"${parsedData.airport_name || 'Tower'}, ${flightDetails.callsign}, ${parsedData.altitude || '3,000'}, inbound for landing with information ${flightDetails.atis}."`;
                break;
            case 'enroute':
                clearanceText = 'Flight Following Request';
                exampleCall = `"[Center], ${flightDetails.callsign}, VFR, requesting flight following."`;
                break;
            case 'practice_area':
                clearanceText = 'Practice Area Operations';
                exampleCall = `"${parsedData.airport_name || 'Tower'}, ${flightDetails.callsign}, maneuvering in the practice area at ${parsedData.altitude || '3,500'} feet."`;
                break;
            default:
                return '';
        }

        return `
            <div class="briefing-section clearance-section">
                <h4>📡 ${clearanceText}</h4>
                <div class="example-call">
                    <p class="example-label">Example initial call:</p>
                    <p class="example-text">${exampleCall}</p>
                </div>
            </div>
        `;
    }

    getCurrentAIRACCycle() {
        // AIRAC cycles with official effective dates for 2025
        const airacCycles = [
            { cycle: 2501, effectiveDate: new Date('2025-01-23') },
            { cycle: 2502, effectiveDate: new Date('2025-02-20') },
            { cycle: 2503, effectiveDate: new Date('2025-03-20') },
            { cycle: 2504, effectiveDate: new Date('2025-04-17') },
            { cycle: 2505, effectiveDate: new Date('2025-05-15') },
            { cycle: 2506, effectiveDate: new Date('2025-06-12') },
            { cycle: 2507, effectiveDate: new Date('2025-07-10') },
            { cycle: 2508, effectiveDate: new Date('2025-08-07') },
            { cycle: 2509, effectiveDate: new Date('2025-09-04') },
            { cycle: 2510, effectiveDate: new Date('2025-10-02') },
            { cycle: 2511, effectiveDate: new Date('2025-10-30') },
            { cycle: 2512, effectiveDate: new Date('2025-11-27') },
            { cycle: 2513, effectiveDate: new Date('2025-12-25') }
        ];

        const now = new Date();

        // Find the most recent effective cycle
        let currentCycle = 2511; // Default fallback
        for (let i = airacCycles.length - 1; i >= 0; i--) {
            if (now >= airacCycles[i].effectiveDate) {
                currentCycle = airacCycles[i].cycle;
                break;
            }
        }

        return currentCycle.toString();
    }

    loadAirportDiagram(cycleOverride = null) {
        const searchInput = document.getElementById('airportDiagramSearch');
        const icao = searchInput.value.trim().toUpperCase();

        if (!icao || icao.length < 3) {
            alert('Please enter a valid airport code (e.g., KSBN, KPAO)');
            return;
        }

        // Save to recent searches
        this.saveRecentAirport(icao);

        const viewer = document.getElementById('airportDiagramViewer');
        viewer.innerHTML = '<p class="loading">Loading airport diagram...</p>';

        // Automatically calculate current AIRAC cycle or use override
        const currentCycle = cycleOverride || this.getCurrentAIRACCycle();

        // Prepare fallback cycles
        const prevCycle = (parseInt(currentCycle) - 1).toString();
        const nextCycle = (parseInt(currentCycle) + 1).toString();

        const diagramUrl = `https://aeronav.faa.gov/d-tpp/${currentCycle}/00000AD.PDF#nameddest=${icao}`;

        viewer.innerHTML = `
            <div class="diagram-viewer-controls">
                <a href="${diagramUrl}" target="_blank" class="btn-secondary">
                    Open Full Diagram in New Tab
                </a>
                <p class="diagram-note">Airport diagrams are provided by the FAA (AIRAC Cycle: ${currentCycle}) and updated every 28 days.</p>
            </div>
            <iframe
                src="${diagramUrl}"
                class="diagram-iframe"
                title="Airport Diagram for ${icao}"
                onload="this.style.opacity = 1; this.dataset.loaded = 'true';"
                onerror="if (!this.dataset.retried) { this.dataset.retried = 'true'; } else { this.parentElement.querySelector('.diagram-error').style.display = 'block'; this.style.display = 'none'; }"
            ></iframe>
            <div class="diagram-error" style="display: none; padding: 20px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; margin-top: 10px;">
                <p><strong>⚠ Diagram failed to load</strong></p>
                <p>The diagram for <strong>${icao}</strong> may not be available in AIRAC cycle ${currentCycle}.</p>
                <p>Try these cycle alternatives:</p>
                <div style="margin: 12px 0;">
                    <button class="btn-secondary" onclick="customMode.loadAirportDiagram('${prevCycle}')" style="margin: 4px;">
                        Try Cycle ${prevCycle}
                    </button>
                    <button class="btn-secondary" onclick="customMode.loadAirportDiagram('${nextCycle}')" style="margin: 4px;">
                        Try Cycle ${nextCycle}
                    </button>
                </div>
            </div>
            <div class="diagram-fallback">
                <p class="fallback-header">Alternative diagram sources:</p>
                <ul>
                    <li><a href="https://www.airnav.com/airport/${icao}" target="_blank">AirNav - ${icao}</a> - Comprehensive airport information</li>
                    <li><a href="https://skyvector.com/airport/${icao}" target="_blank">SkyVector - ${icao}</a> - Interactive aviation charts</li>
                    <li><a href="https://www.faa.gov/air_traffic/flight_info/aeronav/digital_products/dtpp/search/" target="_blank">FAA d-TPP Search</a> - Manual diagram search</li>
                    <li><a href="https://chartfox.org/airport/${icao}" target="_blank">ChartFox - ${icao}</a> - Free aviation charts</li>
                </ul>
            </div>
        `;

        // Add CSS for smooth loading
        const iframe = viewer.querySelector('.diagram-iframe');
        if (iframe) {
            iframe.style.opacity = '0';
            iframe.style.transition = 'opacity 0.3s ease-in';
        }
    }

    getCustomSystemPrompt() {
        return this.currentCustomScenario ? this.currentCustomScenario.systemPrompt : null;
    }
}

// Global instance
let customMode = null;

// Initialize custom mode
function initCustomMode(app) {
    if (!customMode) {
        customMode = new CustomScenarioMode(app);
    }
    return customMode;
}

// Show custom mode interface
function showCustomMode() {
    if (window.atcApp) {
        const mode = initCustomMode(window.atcApp);
        mode.showCustomModeInterface();
    }
}
