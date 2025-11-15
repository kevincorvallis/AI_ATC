// Detailed Training Scenarios Configuration

const TRAINING_SCENARIOS = {
    pattern_work: {
        name: "Pattern Work",
        description: "Practice traffic pattern communications",
        scenarios: [
            {
                id: "pattern_first_solo",
                name: "First Solo Pattern",
                description: "Your first solo flight! Calm winds, clear skies, light traffic.",
                difficulty: "Beginner",
                conditions: "Clear skies, Wind 270 at 5 kts, Light traffic",
                tips: "Take your time. Controllers know you're solo and will be patient.",
                icon: "🛫"
            },
            {
                id: "pattern_touch_go",
                name: "Touch and Go Practice",
                description: "Multiple touch and go landings for proficiency.",
                difficulty: "Beginner",
                conditions: "VFR, Wind 090 at 8 kts, Moderate traffic",
                tips: "Remember to tell tower your intentions: 'Touch and go' or 'Full stop'.",
                icon: "🔄"
            },
            {
                id: "pattern_crosswind",
                name: "Crosswind Landing Practice",
                description: "Practice crosswind landings with challenging winds.",
                difficulty: "Intermediate",
                conditions: "VFR, Wind 320 at 12 gusting 18, Moderate traffic",
                tips: "ATC will give you wind updates. Use proper crosswind correction technique.",
                icon: "💨"
            },
            {
                id: "pattern_busy",
                name: "Busy Pattern with Traffic",
                description: "Navigate a busy pattern with multiple aircraft.",
                difficulty: "Intermediate",
                conditions: "VFR, Wind 270 at 7 kts, Heavy traffic",
                tips: "Listen for traffic calls. You may get 'extend downwind' or 'number 3, follow the Cessna'.",
                icon: "✈️✈️✈️"
            },
            {
                id: "pattern_night",
                name: "Night Pattern Operations",
                description: "Practice pattern work during night operations.",
                difficulty: "Advanced",
                conditions: "Night VFR, Wind 180 at 6 kts, Light traffic",
                tips: "Tower may ask you to report runway in sight. Use all available lighting.",
                icon: "🌙"
            }
        ]
    },
    
    ground_operations: {
        name: "Ground Operations",
        description: "Master ground control communications",
        scenarios: [
            {
                id: "ground_first_taxi",
                name: "First Taxi to Runway",
                description: "Your first time taxiing at a controlled airport.",
                difficulty: "Beginner",
                conditions: "Clear day, Simple airport layout",
                tips: "Write down taxi instructions. Read back all hold-short instructions.",
                icon: "🚖"
            },
            {
                id: "ground_complex_taxi",
                name: "Complex Taxiway Navigation",
                description: "Navigate complex taxiway system at a large airport.",
                difficulty: "Intermediate",
                conditions: "Class C airport, Multiple taxiways",
                tips: "Have airport diagram ready. Don't hesitate to ask for progressive taxi.",
                icon: "🗺️"
            },
            {
                id: "ground_runway_crossing",
                name: "Runway Crossing Procedures",
                description: "Practice proper runway crossing communications.",
                difficulty: "Intermediate",
                conditions: "Active runways, Multiple crossings required",
                tips: "Never cross a runway without explicit clearance. Read back runway number.",
                icon: "⚠️"
            },
            {
                id: "ground_busy_ramp",
                name: "Busy Ramp Operations",
                description: "Navigate a busy ramp with multiple aircraft movements.",
                difficulty: "Advanced",
                conditions: "High traffic, Complex ramp layout",
                tips: "Maintain situational awareness. Give way to aircraft with right of way.",
                icon: "🅿️"
            },
            {
                id: "ground_progressive",
                name: "Progressive Taxi Instructions",
                description: "Follow step-by-step progressive taxi to runway.",
                difficulty: "Beginner",
                conditions: "Unfamiliar airport, Need guidance",
                tips: "Request 'progressive taxi' if unsure. Follow instructions carefully.",
                icon: "➡️"
            }
        ]
    },
    
    flight_following: {
        name: "Flight Following",
        description: "Practice VFR flight following procedures",
        scenarios: [
            {
                id: "ff_initial_request",
                name: "Initial Flight Following Request",
                description: "Request VFR flight following for the first time.",
                difficulty: "Beginner",
                conditions: "VFR cross-country, Good weather",
                tips: "Have: Aircraft type, altitude, destination, route ready to give.",
                icon: "📡"
            },
            {
                id: "ff_position_reports",
                name: "Position Reports",
                description: "Make proper position reports during flight following.",
                difficulty: "Beginner",
                conditions: "En route, Good visibility",
                tips: "Report position, altitude, and intentions when requested.",
                icon: "📍"
            },
            {
                id: "ff_traffic_advisories",
                name: "Traffic Advisories",
                description: "Respond to traffic advisories from approach.",
                difficulty: "Intermediate",
                conditions: "Busy airspace, Multiple traffic conflicts",
                tips: "Use clock position and distance. Report traffic in sight: 'Traffic in sight'.",
                icon: "👀"
            },
            {
                id: "ff_class_b_transition",
                name: "Class B Transition",
                description: "Request and navigate Class B airspace transition.",
                difficulty: "Advanced",
                conditions: "Class B airspace, High traffic",
                tips: "Get clearance BEFORE entering. Follow vectors precisely.",
                icon: "🏙️"
            },
            {
                id: "ff_frequency_change",
                name: "Frequency Changes",
                description: "Handle handoffs and frequency changes smoothly.",
                difficulty: "Intermediate",
                conditions: "Multiple sector transitions",
                tips: "Write down new frequency. Check in with new controller properly.",
                icon: "📻"
            }
        ]
    },
    
    emergency: {
        name: "Emergency Procedures",
        description: "Practice emergency communications",
        scenarios: [
            {
                id: "emerg_engine_failure",
                name: "Engine Failure",
                description: "Declare emergency for engine failure.",
                difficulty: "Advanced",
                conditions: "In-flight emergency, Need immediate assistance",
                tips: "Aviate, Navigate, Communicate. Declare 'Mayday' 3 times if needed.",
                icon: "⚠️"
            },
            {
                id: "emerg_lost_comms",
                name: "Lost Communications",
                description: "Handle lost radio communications procedures.",
                difficulty: "Advanced",
                conditions: "Radio failure, Need to land",
                tips: "Squawk 7600. Follow lost comm procedures. Watch for light gun signals.",
                icon: "📵"
            },
            {
                id: "emerg_low_fuel",
                name: "Low Fuel Emergency",
                description: "Declare minimum fuel or emergency fuel situation.",
                difficulty: "Intermediate",
                conditions: "Running low on fuel, Need priority",
                tips: "Declare 'Minimum fuel' early. State fuel remaining in minutes.",
                icon: "⛽"
            },
            {
                id: "emerg_weather_diversion",
                name: "Weather Diversion",
                description: "Request diversion due to unexpected weather.",
                difficulty: "Intermediate",
                conditions: "Deteriorating weather, Need alternate",
                tips: "Don't wait too long. ATC will help with weather information and vectors.",
                icon: "⛈️"
            },
            {
                id: "emerg_medical",
                name: "Medical Emergency",
                description: "Declare emergency for passenger medical issue.",
                difficulty: "Advanced",
                conditions: "Passenger medical emergency, Need priority landing",
                tips: "ATC will coordinate with emergency services. State nature of emergency.",
                icon: "🚑"
            }
        ]
    }
};

// Get all scenarios for a category
function getScenariosForCategory(category) {
    return TRAINING_SCENARIOS[category] || null;
}

// Get specific scenario details
function getScenarioDetails(category, scenarioId) {
    const categoryData = TRAINING_SCENARIOS[category];
    if (!categoryData) return null;
    
    return categoryData.scenarios.find(s => s.id === scenarioId) || null;
}
