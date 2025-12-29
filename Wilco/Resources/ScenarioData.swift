import Foundation

enum ScenarioData {
    static func scenarios(for category: Category) -> [Scenario] {
        switch category {
        case .patternWork: return patternWorkScenarios
        case .groundOperations: return groundOperationsScenarios
        case .flightFollowing: return flightFollowingScenarios
        case .emergency: return emergencyScenarios
        }
    }

    // MARK: - Pattern Work Scenarios

    static let patternWorkScenarios: [Scenario] = [
        Scenario(
            id: "pattern_first_solo",
            name: "First Solo Pattern",
            description: "Your first solo flight! Calm winds, clear skies, light traffic.",
            difficulty: .beginner,
            conditions: "Clear skies, Wind 270 at 5 kts, Light traffic",
            tips: "Take your time. Controllers know you're solo and will be patient.",
            icon: "🛫",
            suggestions: [
                "Metro Tower, Cessna 12345, ready for departure runway 27, remaining in the pattern",
                "Metro Tower, Cessna 12345, left downwind runway 27",
                "Metro Tower, Cessna 12345, turning left base runway 27, full stop"
            ]
        ),
        Scenario(
            id: "pattern_touch_go",
            name: "Touch and Go Practice",
            description: "Multiple touch and go landings for proficiency.",
            difficulty: .intermediate,
            conditions: "VFR, Wind 270 at 7 kts, Moderate traffic",
            tips: "Remember to tell tower your intentions. Listen for traffic calls.",
            icon: "🔄",
            suggestions: [
                "Metro Tower, Cessna 12345, left downwind runway 27, touch and go",
                "Metro Tower, Cessna 12345, traffic in sight",
                "Metro Tower, Cessna 12345, turning left base runway 27"
            ]
        )
    ]

    // MARK: - Ground Operations Scenarios

    static let groundOperationsScenarios: [Scenario] = [
        Scenario(
            id: "ground_first_taxi",
            name: "First Taxi to Runway",
            description: "Your first time taxiing at a controlled airport.",
            difficulty: .beginner,
            conditions: "Clear day, Simple airport layout",
            tips: "Write down taxi instructions. Read back all hold-short instructions.",
            icon: "🚖",
            suggestions: [
                "Metro Ground, Cessna 12345, at the FBO, ready to taxi with information Alpha",
                "Cessna 12345, holding short runway 27",
                "Metro Ground, Cessna 12345, clear of runway 27"
            ]
        ),
        Scenario(
            id: "ground_runway_crossing",
            name: "Runway Crossing",
            description: "Practice proper runway crossing communications.",
            difficulty: .intermediate,
            conditions: "Active runways, Crossing required",
            tips: "Never cross a runway without explicit clearance. Read back runway number.",
            icon: "⚠️",
            suggestions: [
                "Metro Ground, Cessna 12345, holding short runway 27",
                "Cessna 12345, crossing runway 27",
                "Metro Ground, Cessna 12345, runway 27 clear"
            ]
        )
    ]

    // MARK: - Flight Following Scenarios

    static let flightFollowingScenarios: [Scenario] = [
        Scenario(
            id: "ff_initial_request",
            name: "Request Flight Following",
            description: "Request VFR flight following for a cross-country flight.",
            difficulty: .beginner,
            conditions: "VFR cross-country, Good weather",
            tips: "Have: Aircraft type, altitude, destination ready to give.",
            icon: "📡",
            suggestions: [
                "Seattle Center, Cessna 12345, request VFR flight following",
                "Cessna 12345, level 4,500, destination Portland",
                "Cessna 12345, squawking 4521"
            ]
        ),
        Scenario(
            id: "ff_traffic_advisories",
            name: "Traffic Advisories",
            description: "Respond to traffic advisories from approach.",
            difficulty: .intermediate,
            conditions: "Busy airspace, Traffic nearby",
            tips: "Use clock position and distance. Report traffic in sight.",
            icon: "👀",
            suggestions: [
                "Cessna 12345, traffic in sight",
                "Cessna 12345, looking for traffic",
                "Cessna 12345, negative contact"
            ]
        )
    ]

    // MARK: - Emergency Scenarios

    static let emergencyScenarios: [Scenario] = [
        Scenario(
            id: "emerg_low_fuel",
            name: "Low Fuel",
            description: "Declare minimum fuel situation and request priority.",
            difficulty: .beginner,
            conditions: "Running low on fuel, Need priority",
            tips: "Declare 'Minimum fuel' early. State fuel remaining in minutes.",
            icon: "⛽",
            suggestions: [
                "Metro Tower, Cessna 12345, minimum fuel",
                "Cessna 12345, 20 minutes fuel remaining",
                "Cessna 12345, request priority handling"
            ]
        ),
        Scenario(
            id: "emerg_engine_failure",
            name: "Engine Failure",
            description: "Declare emergency for engine failure.",
            difficulty: .intermediate,
            conditions: "In-flight emergency, Need immediate assistance",
            tips: "Aviate, Navigate, Communicate. Declare 'Mayday' 3 times.",
            icon: "🔥",
            suggestions: [
                "Mayday mayday mayday, Cessna 12345, engine failure",
                "Cessna 12345, 2 souls on board, 2 hours fuel",
                "Cessna 12345, airport in sight"
            ]
        )
    ]
}
