// Custom Scenario Mode - Create Your Own Training Scenarios

class CustomScenarioMode {
    constructor(app) {
        this.app = app;
        this.currentCustomScenario = null;
        this.templates = this.createTemplates();
        this.examplePrompts = this.createExamplePrompts();
        this.recentAirports = this.loadRecentAirports();
        this.isGenerating = false; // Prevent duplicate API calls
        this.currentAbortController = null; // For cancelling in-flight requests
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

    // Sanitize user input to prevent XSS attacks
    sanitizeHTML(str) {
        if (str === null || str === undefined) return '';
        const div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
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

    async startCustomScenario() {
        // Prevent duplicate requests
        if (this.isGenerating) {
            console.log('Scenario generation already in progress');
            return;
        }

        const promptInput = document.getElementById('customPrompt');
        const userPrompt = promptInput.value.trim();

        if (!userPrompt) {
            alert('Please enter a scenario description');
            return;
        }

        // Input validation - check length
        if (userPrompt.length < 10) {
            alert('Please provide a more detailed scenario description (at least 10 characters)');
            return;
        }
        if (userPrompt.length > 1000) {
            alert('Scenario description is too long. Please keep it under 1000 characters.');
            return;
        }

        // Cancel any previous in-flight request
        if (this.currentAbortController) {
            this.currentAbortController.abort();
        }
        this.currentAbortController = new AbortController();

        // Set generating flag
        this.isGenerating = true;

        // Show loading state
        const startButton = document.getElementById('startCustomScenario');
        const originalButtonText = startButton.textContent;
        startButton.disabled = true;
        startButton.textContent = 'Generating Scenario...';
        startButton.classList.add('loading');

        try {
            // Call OpenAI API to generate scenario
            const generatedScenario = await this.generateScenarioWithAI(userPrompt, this.currentAbortController.signal);

            if (!generatedScenario) {
                // Fallback to local parsing if API fails
                console.log('Using fallback local parsing');
                const parsedData = this.parseCustomPrompt(userPrompt);
                const flightDetails = this.generateFlightDetails(parsedData);
                const systemPrompt = this.generateSystemPrompt(parsedData, flightDetails);

                this.finalizeScenario(userPrompt, parsedData, flightDetails, systemPrompt);
            } else {
                // Use AI-generated scenario
                this.finalizeScenario(
                    userPrompt,
                    generatedScenario,
                    generatedScenario,
                    generatedScenario.system_prompt
                );
            }
        } catch (error) {
            console.error('Error generating scenario:', error);
            alert('Error generating scenario. Using basic parsing instead.');

            // Fallback to local parsing
            const parsedData = this.parseCustomPrompt(userPrompt);
            const flightDetails = this.generateFlightDetails(parsedData);
            const systemPrompt = this.generateSystemPrompt(parsedData, flightDetails);

            this.finalizeScenario(userPrompt, parsedData, flightDetails, systemPrompt);
        } finally {
            // Reset button and generation state
            this.isGenerating = false;
            this.currentAbortController = null;
            startButton.disabled = false;
            startButton.textContent = originalButtonText;
            startButton.classList.remove('loading');
        }
    }

    async generateScenarioWithAI(userPrompt, signal = null) {
        try {
            // Check if API endpoint is configured
            if (!API_ENDPOINT || API_ENDPOINT === 'YOUR_API_ENDPOINT_HERE/atc') {
                console.log('API not configured, using local parsing');
                return null;
            }

            // Create timeout for request (20 second timeout for scenario generation)
            const controller = signal ? { signal } : {};

            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'generate_scenario',
                    prompt: userPrompt
                }),
                ...controller
            });

            if (!response.ok) {
                console.error('API request failed:', response.status);
                return null;
            }

            const data = await response.json();

            if (data.success && data.scenario) {
                console.log('AI-generated scenario:', data.scenario);
                return data.scenario;
            }

            return null;
        } catch (error) {
            console.error('Error calling scenario generation API:', error);
            return null;
        }
    }

    finalizeScenario(userPrompt, parsedData, flightDetails, systemPrompt) {

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

        // Set frequency from either AI or local data
        const frequency = parsedData.tower || flightDetails.frequency || '118.300';
        document.getElementById('frequency').textContent = frequency;

        // Create detailed scenario briefing
        const scenarioBrief = this.createScenarioBrief(parsedData, flightDetails, userPrompt);

        // Clear conversation and show briefing
        const conversation = document.getElementById('conversation');
        conversation.innerHTML = scenarioBrief;

        this.app.updateStatus('Ready');
    }

    createScenarioBrief(parsedData, flightDetails, userPrompt) {
        // Handle both AI-generated and locally-parsed data
        // AI returns: callsign, squawk, souls_on_board, fuel_remaining
        // Local returns: callsign in flightDetails

        // Sanitize all user-influenced values to prevent XSS
        const callsign = this.sanitizeHTML(parsedData.callsign || flightDetails.callsign || 'N12345');
        const aircraftType = this.sanitizeHTML(parsedData.aircraft_type || 'Cessna 172');
        const squawk = this.sanitizeHTML(parsedData.squawk || flightDetails.squawk || '1200');
        const soulsOnBoard = this.sanitizeHTML(parsedData.souls_on_board || flightDetails.souls_on_board || 1);

        // Handle fuel format from both sources
        let fuelRemaining;
        if (parsedData.fuel_remaining) {
            fuelRemaining = this.sanitizeHTML(parsedData.fuel_remaining); // AI format: "3+45"
        } else if (flightDetails.fuel_hours !== undefined) {
            fuelRemaining = `${flightDetails.fuel_hours}+${(flightDetails.fuel_minutes || 0).toString().padStart(2, '0')}`;
        } else {
            fuelRemaining = '3+00';
        }

        // Airport info
        const airport = parsedData.airport || flightDetails.airport || null;
        const airportName = this.sanitizeHTML(parsedData.airport_name || parsedData.airport || 'Unknown Airport');
        const tower = this.sanitizeHTML(parsedData.tower || flightDetails.frequency || '118.300');
        const ground = this.sanitizeHTML(parsedData.ground || flightDetails.ground_freq || '121.900');
        const departure = this.sanitizeHTML(parsedData.departure || flightDetails.departure_freq || '121.700');
        const atis = this.sanitizeHTML(parsedData.atis || flightDetails.atis || 'A');
        const runway = this.sanitizeHTML(parsedData.runway || flightDetails.runway || '27');

        // Weather & conditions
        const weather = this.sanitizeHTML(parsedData.weather || 'VFR');
        const wind = this.sanitizeHTML(parsedData.wind || '270 at 8 kts');
        const altitude = parsedData.altitude ? this.sanitizeHTML(parsedData.altitude) : null;

        const scenarioDescription = this.sanitizeHTML(parsedData.scenario_description || userPrompt);
        const clearanceSection = this.generateClearanceInfo(parsedData, { callsign, runway, atis });

        return `
            <div class="message system-message scenario-briefing">
                <div class="briefing-header">
                    <h3>📋 AI-Generated Scenario Briefing</h3>
                    <p class="scenario-description">${scenarioDescription}</p>
                    ${parsedData.initial_call_example ? `
                        <div class="ai-badge">
                            <span class="badge-icon">🤖</span>
                            <span>Powered by GPT-4</span>
                        </div>
                    ` : ''}
                </div>

                <div class="briefing-section">
                    <h4>✈️ Your Aircraft</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Callsign:</span>
                            <span class="info-value"><strong>${callsign}</strong></span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Aircraft Type:</span>
                            <span class="info-value">${aircraftType}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Squawk:</span>
                            <span class="info-value">${squawk}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Souls on Board:</span>
                            <span class="info-value">${soulsOnBoard}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Fuel Remaining:</span>
                            <span class="info-value">${fuelRemaining}</span>
                        </div>
                    </div>
                </div>

                ${airport ? `
                <div class="briefing-section">
                    <h4>🏢 Airport Information</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Airport:</span>
                            <span class="info-value"><strong>${airportName}</strong></span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Tower:</span>
                            <span class="info-value">${tower}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Ground:</span>
                            <span class="info-value">${ground}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Departure:</span>
                            <span class="info-value">${departure}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">ATIS:</span>
                            <span class="info-value">Information ${atis}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Active Runway:</span>
                            <span class="info-value">${runway}</span>
                        </div>
                    </div>
                </div>
                ` : ''}

                <div class="briefing-section">
                    <h4>🌤️ Weather & Conditions</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Conditions:</span>
                            <span class="info-value">${weather}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Wind:</span>
                            <span class="info-value">${wind}</span>
                        </div>
                        ${altitude ? `
                        <div class="info-item">
                            <span class="info-label">Altitude:</span>
                            <span class="info-value">${altitude} feet</span>
                        </div>
                        ` : ''}
                    </div>
                </div>

                ${clearanceSection}

                ${airport ? this.generateAirportDiagramSection(airport, airportName) : ''}

                <div class="briefing-footer">
                    <p><strong>Ready to begin?</strong></p>
                    <p>Press and hold <strong>"Push to Talk"</strong> or the <strong>Spacebar</strong> to start your radio transmission.</p>
                </div>
            </div>
        `;
    }

    generateAirportDiagramSection(airport, airportName) {
        const currentCycle = this.getCurrentAIRACCycle();
        const prevCycle = (parseInt(currentCycle) - 1).toString();
        const nextCycle = (parseInt(currentCycle) + 1).toString();
        const diagramUrl = `https://aeronav.faa.gov/d-tpp/${currentCycle}/00000AD.PDF#nameddest=${airport}`;

        return `
            <div class="briefing-section diagram-section">
                <h4>🗺️ Airport Diagram - ${airportName}</h4>
                <p class="section-subtitle">Review the airport layout before your arrival:</p>

                <div class="diagram-viewer-controls">
                    <a href="${diagramUrl}" target="_blank" class="btn-secondary">
                        Open Full Diagram in New Tab
                    </a>
                    <p class="diagram-note">FAA Airport Diagram (AIRAC Cycle: ${currentCycle})</p>
                </div>

                <div class="embedded-diagram-container">
                    <iframe
                        src="${diagramUrl}"
                        class="embedded-diagram-iframe"
                        title="Airport Diagram for ${airport}"
                        onload="this.style.opacity = 1;"
                        onerror="this.parentElement.querySelector('.diagram-load-error').style.display = 'block'; this.style.display = 'none';"
                    ></iframe>

                    <div class="diagram-load-error" style="display: none;">
                        <p><strong>⚠ Diagram unavailable in cycle ${currentCycle}</strong></p>
                        <p>Try alternate cycles:</p>
                        <button class="btn-secondary btn-small" onclick="window.open('https://aeronav.faa.gov/d-tpp/${prevCycle}/00000AD.PDF#nameddest=${airport}', '_blank')">
                            Cycle ${prevCycle}
                        </button>
                        <button class="btn-secondary btn-small" onclick="window.open('https://aeronav.faa.gov/d-tpp/${nextCycle}/00000AD.PDF#nameddest=${airport}', '_blank')">
                            Cycle ${nextCycle}
                        </button>
                    </div>

                    <div class="diagram-fallback-links">
                        <p class="fallback-label">Alternative sources:</p>
                        <a href="https://www.airnav.com/airport/${airport}" target="_blank">AirNav</a> •
                        <a href="https://skyvector.com/airport/${airport}" target="_blank">SkyVector</a> •
                        <a href="https://chartfox.org/airport/${airport}" target="_blank">ChartFox</a>
                    </div>
                </div>
            </div>
        `;
    }

    generateClearanceInfo(parsedData, flightDetails) {
        // Use AI-generated examples if available
        if (parsedData.radio_examples) {
            const examples = parsedData.radio_examples;
            return `
                <div class="briefing-section clearance-section">
                    <h4>📡 Suggested Radio Calls</h4>
                    <p class="section-subtitle">Use these examples as you progress through the scenario:</p>

                    ${examples.initial_contact ? `
                    <div class="example-call">
                        <p class="example-label">1️⃣ Initial Contact:</p>
                        <p class="example-text">"${examples.initial_contact}"</p>
                    </div>
                    ` : ''}

                    ${examples.position_report ? `
                    <div class="example-call">
                        <p class="example-label">2️⃣ Position Report:</p>
                        <p class="example-text">"${examples.position_report}"</p>
                    </div>
                    ` : ''}

                    ${examples.landing_request ? `
                    <div class="example-call">
                        <p class="example-label">3️⃣ Landing Request:</p>
                        <p class="example-text">"${examples.landing_request}"</p>
                    </div>
                    ` : ''}

                    ${examples.additional ? `
                    <div class="example-call">
                        <p class="example-label">💡 Additional:</p>
                        <p class="example-text">"${examples.additional}"</p>
                    </div>
                    ` : ''}
                </div>
            `;
        }

        // Fallback for old format or local parsing
        if (parsedData.initial_call_example) {
            return `
                <div class="briefing-section clearance-section">
                    <h4>📡 Suggested Initial Call</h4>
                    <div class="example-call">
                        <p class="example-label">AI-generated example radio call:</p>
                        <p class="example-text">"${parsedData.initial_call_example}"</p>
                    </div>
                </div>
            `;
        }

        if (!parsedData.scenario_type) return '';

        const callsign = flightDetails.callsign || parsedData.callsign || 'N12345';
        const runway = flightDetails.runway || parsedData.runway || '27';
        const atis = flightDetails.atis || parsedData.atis || 'Alpha';

        let clearanceText = '';
        let exampleCall = '';

        switch (parsedData.scenario_type) {
            case 'departure':
                clearanceText = 'Clearance for Departure';
                exampleCall = `"${parsedData.airport_name || 'Tower'}, ${callsign}, ready for departure, runway ${runway}."`;
                break;
            case 'arrival':
                clearanceText = 'Expected Arrival Instructions';
                exampleCall = `"${parsedData.airport_name || 'Tower'}, ${callsign}, ${parsedData.altitude || '3,000'}, inbound for landing with information ${atis}."`;
                break;
            case 'enroute':
                clearanceText = 'Flight Following Request';
                exampleCall = `"[Center], ${callsign}, VFR, requesting flight following."`;
                break;
            case 'practice_area':
                clearanceText = 'Practice Area Operations';
                exampleCall = `"${parsedData.airport_name || 'Tower'}, ${callsign}, maneuvering in the practice area at ${parsedData.altitude || '3,500'} feet."`;
                break;
            case 'ground':
                clearanceText = 'Ground Operations';
                exampleCall = `"${parsedData.airport_name || 'Ground'}, ${callsign}, ready to taxi with information ${atis}."`;
                break;
            case 'emergency':
                clearanceText = 'Emergency Declaration';
                exampleCall = `"Mayday, Mayday, Mayday. ${parsedData.airport_name || 'Tower'}, ${callsign}, declaring emergency."`;
                break;
            default:
                return '';
        }

        return `
            <div class="briefing-section clearance-section">
                <h4>📡 ${clearanceText}</h4>
                <div class="example-call">
                    <p class="example-label">Example initial call:</p>
                    <p class="example-text">"${exampleCall}"</p>
                </div>
            </div>
        `;
    }

    getCurrentAIRACCycle() {
        // Dynamic AIRAC cycle calculation
        // AIRAC cycles follow a fixed 28-day pattern starting from a known epoch
        // Reference: January 4, 2018 was the start of cycle 1801

        const epochDate = new Date(Date.UTC(2018, 0, 4)); // January 4, 2018 UTC
        const cycleDays = 28;
        const msPerDay = 24 * 60 * 60 * 1000;

        const now = new Date();

        // Calculate days since epoch
        const daysSinceEpoch = Math.floor((now - epochDate) / msPerDay);

        // Calculate which cycle we're in since the epoch
        const cyclesSinceEpoch = Math.floor(daysSinceEpoch / cycleDays);

        // Calculate the start date of the current cycle
        const currentCycleStart = new Date(epochDate.getTime() + (cyclesSinceEpoch * cycleDays * msPerDay));

        // Determine the year and cycle number
        // Each year typically has 13 cycles (364 days), but some years have 14 cycles
        // We need to count how many cycles have passed since the start of the year

        const currentCycleYear = currentCycleStart.getUTCFullYear();

        // Find the first cycle of the current year (first one that starts on or after Jan 1)
        let firstCycleOfYear = new Date(epochDate);
        let cycleCount = 0;

        while (firstCycleOfYear.getUTCFullYear() < currentCycleYear) {
            firstCycleOfYear = new Date(firstCycleOfYear.getTime() + (cycleDays * msPerDay));
            cycleCount++;
        }

        // If the first cycle of the year starts before Jan 1, it belongs to the previous year
        // The next cycle is the first of the new year
        if (firstCycleOfYear.getUTCFullYear() === currentCycleYear &&
            firstCycleOfYear.getUTCMonth() === 0 && firstCycleOfYear.getUTCDate() < 15) {
            // This cycle starts early enough to be cycle 01 of this year
        } else if (firstCycleOfYear.getUTCFullYear() < currentCycleYear) {
            // Move to first cycle that starts in the current year
            while (firstCycleOfYear.getUTCFullYear() < currentCycleYear) {
                firstCycleOfYear = new Date(firstCycleOfYear.getTime() + (cycleDays * msPerDay));
            }
        }

        // Calculate which cycle number within the year
        const daysSinceFirstCycle = Math.floor((currentCycleStart - firstCycleOfYear) / msPerDay);
        const cycleNumber = Math.floor(daysSinceFirstCycle / cycleDays) + 1;

        // Format as YYCC (e.g., 2501 for 2025 cycle 01)
        const yearSuffix = currentCycleYear % 100;
        const cycleStr = cycleNumber.toString().padStart(2, '0');

        return `${yearSuffix}${cycleStr}`;
    }

    async loadAirportDiagram(cycleOverride = null) {
        const searchInput = document.getElementById('airportDiagramSearch');
        const icao = searchInput.value.trim().toUpperCase();

        if (!icao || icao.length < 3) {
            alert('Please enter a valid airport code (e.g., KSBN, KPAO)');
            return;
        }

        // Save to recent searches
        this.saveRecentAirport(icao);

        const viewer = document.getElementById('airportDiagramViewer');
        viewer.innerHTML = '<p class="loading">Loading airport charts for ' + this.sanitizeHTML(icao) + '...</p>';

        try {
            // Fetch charts from our Lambda API
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'get_charts',
                    airport: icao
                })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch charts');
            }

            const charts = data.charts;
            const airportInfo = charts.airport_info;
            const airportDiagram = charts.airport_diagram;

            // Build the chart display
            let html = `
                <div class="airport-charts-container">
                    <div class="airport-header">
                        <h3>${this.sanitizeHTML(airportInfo.name)} (${this.sanitizeHTML(airportInfo.icao)})</h3>
                        <p class="airport-location">${this.sanitizeHTML(airportInfo.city)}, ${this.sanitizeHTML(airportInfo.state)}</p>
                    </div>
            `;

            // Airport Diagram Section
            if (airportDiagram && airportDiagram.pdf_url) {
                html += `
                    <div class="chart-section airport-diagram-section">
                        <h4>Airport Diagram</h4>
                        <div class="diagram-viewer-controls">
                            <a href="${this.sanitizeHTML(airportDiagram.pdf_url)}" target="_blank" class="btn-primary">
                                Open Airport Diagram (PDF)
                            </a>
                        </div>
                        <iframe
                            src="${this.sanitizeHTML(airportDiagram.pdf_url)}"
                            class="diagram-iframe"
                            title="Airport Diagram for ${this.sanitizeHTML(icao)}"
                            style="width: 100%; height: 600px; border: 1px solid #ccc; border-radius: 4px;"
                        ></iframe>
                    </div>
                `;
            } else {
                html += `
                    <div class="chart-section">
                        <p class="no-diagram-notice">No airport diagram available for ${this.sanitizeHTML(icao)}</p>
                    </div>
                `;
            }

            // Approaches Section
            if (charts.approaches && charts.approaches.length > 0) {
                html += `
                    <div class="chart-section">
                        <h4>Approach Procedures (${charts.approaches.length})</h4>
                        <div class="chart-list">
                `;
                for (const chart of charts.approaches) {
                    html += `
                        <a href="${this.sanitizeHTML(chart.pdf_url)}" target="_blank" class="chart-link">
                            ${this.sanitizeHTML(chart.name)}
                        </a>
                    `;
                }
                html += '</div></div>';
            }

            // Departures Section
            if (charts.departures && charts.departures.length > 0) {
                html += `
                    <div class="chart-section">
                        <h4>Departure Procedures (${charts.departures.length})</h4>
                        <div class="chart-list">
                `;
                for (const chart of charts.departures) {
                    html += `
                        <a href="${this.sanitizeHTML(chart.pdf_url)}" target="_blank" class="chart-link">
                            ${this.sanitizeHTML(chart.name)}
                        </a>
                    `;
                }
                html += '</div></div>';
            }

            // Arrivals Section
            if (charts.arrivals && charts.arrivals.length > 0) {
                html += `
                    <div class="chart-section">
                        <h4>Arrival Procedures (${charts.arrivals.length})</h4>
                        <div class="chart-list">
                `;
                for (const chart of charts.arrivals) {
                    html += `
                        <a href="${this.sanitizeHTML(chart.pdf_url)}" target="_blank" class="chart-link">
                            ${this.sanitizeHTML(chart.name)}
                        </a>
                    `;
                }
                html += '</div></div>';
            }

            // Alternative sources
            html += `
                <div class="diagram-fallback">
                    <p class="fallback-header">Additional Resources:</p>
                    <ul>
                        <li><a href="https://www.airnav.com/airport/${this.sanitizeHTML(icao)}" target="_blank">AirNav - ${this.sanitizeHTML(icao)}</a> - Airport information</li>
                        <li><a href="https://skyvector.com/airport/${this.sanitizeHTML(icao)}" target="_blank">SkyVector - ${this.sanitizeHTML(icao)}</a> - Interactive charts</li>
                    </ul>
                </div>
            `;

            html += '</div>';
            viewer.innerHTML = html;

        } catch (error) {
            console.error('Error loading airport charts:', error);

            // Show error with fallback options
            viewer.innerHTML = `
                <div class="diagram-error" style="padding: 20px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px;">
                    <p><strong>Unable to load charts for ${this.sanitizeHTML(icao)}</strong></p>
                    <p>${this.sanitizeHTML(error.message)}</p>
                </div>
                <div class="diagram-fallback">
                    <p class="fallback-header">Try these alternative sources:</p>
                    <ul>
                        <li><a href="https://www.airnav.com/airport/${this.sanitizeHTML(icao)}" target="_blank">AirNav - ${this.sanitizeHTML(icao)}</a> - Comprehensive airport information</li>
                        <li><a href="https://skyvector.com/airport/${this.sanitizeHTML(icao)}" target="_blank">SkyVector - ${this.sanitizeHTML(icao)}</a> - Interactive aviation charts</li>
                        <li><a href="https://www.faa.gov/air_traffic/flight_info/aeronav/digital_products/dtpp/search/" target="_blank">FAA d-TPP Search</a> - Manual diagram search</li>
                        <li><a href="https://chartfox.org/airport/${this.sanitizeHTML(icao)}" target="_blank">ChartFox - ${this.sanitizeHTML(icao)}</a> - Free aviation charts</li>
                    </ul>
                </div>
            `;
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
