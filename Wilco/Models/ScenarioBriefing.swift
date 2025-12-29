import Foundation

/// Complete scenario briefing with all training context
struct ScenarioBriefing: Identifiable {
    let id = UUID()
    let scenario: Scenario
    let aircraft: AircraftInfo
    let atis: ATISInfo
    let airport: AirportInfo
    let objective: String
    let situation: String           // "You've just completed your preflight..."
    let startingPosition: String    // "Ramp A, near the FBO"
    let taxiRoute: TaxiRoute?       // For ground operations
    let keyPhrases: [PhraseTemplate]  // Expected phraseology

    /// What to show based on difficulty
    var helpLevel: HelpLevel {
        switch scenario.difficulty {
        case .beginner: return .full
        case .intermediate: return .partial
        case .advanced: return .minimal
        }
    }
}

/// Airport information
struct AirportInfo: Codable {
    let icao: String            // "KMET"
    let name: String            // "Metro Regional Airport"
    let elevation: Int          // feet MSL
    let towerFrequency: String  // "118.3"
    let groundFrequency: String // "121.9"
    let atisFrequency: String   // "127.85"
    let runways: [RunwayInfo]
    let taxiways: [String]      // ["A", "B", "C", "D"]
    let hotSpots: [HotSpot]?    // Runway incursion hot spots

    /// Get runway by identifier
    func runway(_ identifier: String) -> RunwayInfo? {
        runways.first { $0.identifier == identifier }
    }
}

struct RunwayInfo: Codable {
    let identifier: String      // "27L"
    let heading: Int            // 270
    let length: Int             // feet
    let width: Int              // feet
    let surface: String         // "Asphalt"
    let ils: Bool               // Has ILS approach
}

struct HotSpot: Codable {
    let id: String              // "HS1"
    let description: String     // "Runway 27L/Taxiway A intersection"
    let location: String        // For display
}

/// Taxi route for ground operations
struct TaxiRoute: Codable {
    let from: String            // "FBO Ramp"
    let to: String              // "Runway 27L"
    let via: [String]           // ["A", "B"]
    let holdShort: [String]?    // Runways to hold short of
    let crossings: [String]?    // Runways to cross

    var routeString: String {
        "Via \(via.joined(separator: ", "))"
    }

    var fullInstruction: String {
        var parts = ["Taxi to \(to)", routeString]
        if let holdShort = holdShort, !holdShort.isEmpty {
            parts.append("hold short runway \(holdShort.joined(separator: ", "))")
        }
        return parts.joined(separator: ", ")
    }
}

/// Phraseology template for training
struct PhraseTemplate: Identifiable {
    let id = UUID()
    let situation: String       // "Initial contact with ground"
    let template: String        // "[Facility], [Callsign], at [position], ready to taxi with information [ATIS]"
    let example: String         // "Metro Ground, Cessna 12345, at the FBO, ready to taxi with information Alpha"
    let tips: [String]          // Additional tips for this phrase

    /// Template with placeholders filled in
    func filled(
        facility: String,
        callsign: String,
        position: String? = nil,
        atis: String? = nil,
        runway: String? = nil,
        altitude: String? = nil
    ) -> String {
        var result = template
        result = result.replacingOccurrences(of: "[Facility]", with: facility)
        result = result.replacingOccurrences(of: "[Callsign]", with: callsign)
        if let position = position {
            result = result.replacingOccurrences(of: "[position]", with: position)
        }
        if let atis = atis {
            result = result.replacingOccurrences(of: "[ATIS]", with: atis)
        }
        if let runway = runway {
            result = result.replacingOccurrences(of: "[runway]", with: runway)
        }
        if let altitude = altitude {
            result = result.replacingOccurrences(of: "[altitude]", with: altitude)
        }
        return result
    }
}

/// How much help to show based on difficulty
enum HelpLevel {
    case full       // Beginner: All help available
    case partial    // Intermediate: Some help
    case minimal    // Advanced: Just callsign and ATIS code

    var showPhraseologyTemplates: Bool {
        self == .full
    }

    var showDecodedATIS: Bool {
        self == .full
    }

    var showTaxiRouteHighlight: Bool {
        self != .minimal
    }

    var showSuggestionChips: Bool {
        self != .minimal
    }

    var suggestionChipCount: Int {
        switch self {
        case .full: return 4
        case .partial: return 2
        case .minimal: return 0
        }
    }

    var showHoldShortReminders: Bool {
        true  // Always show for safety
    }

    var showFrequencies: Bool {
        self != .minimal
    }

    var description: String {
        switch self {
        case .full: return "Full Assistance"
        case .partial: return "Partial Assistance"
        case .minimal: return "Realistic Mode"
        }
    }
}

// MARK: - Default Metro Airport

extension AirportInfo {
    /// Our fictional training airport
    static let metro = AirportInfo(
        icao: "KMET",
        name: "Metro Regional Airport",
        elevation: 650,
        towerFrequency: "118.3",
        groundFrequency: "121.9",
        atisFrequency: "127.85",
        runways: [
            RunwayInfo(identifier: "27L", heading: 270, length: 8000, width: 150, surface: "Asphalt", ils: true),
            RunwayInfo(identifier: "27R", heading: 270, length: 6000, width: 100, surface: "Asphalt", ils: false),
            RunwayInfo(identifier: "9L", heading: 90, length: 8000, width: 150, surface: "Asphalt", ils: true),
            RunwayInfo(identifier: "9R", heading: 90, length: 6000, width: 100, surface: "Asphalt", ils: false),
            RunwayInfo(identifier: "36", heading: 360, length: 5000, width: 75, surface: "Asphalt", ils: false),
            RunwayInfo(identifier: "18", heading: 180, length: 5000, width: 75, surface: "Asphalt", ils: false)
        ],
        taxiways: ["A", "B", "C", "D", "E", "F"],
        hotSpots: [
            HotSpot(id: "HS1", description: "Runway 27L/Taxiway A intersection", location: "A at 27L"),
            HotSpot(id: "HS2", description: "Runway 36/Taxiway C intersection", location: "C at 36")
        ]
    )
}
