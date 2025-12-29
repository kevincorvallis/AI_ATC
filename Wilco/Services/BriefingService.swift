import Foundation

/// Generates realistic scenario briefings with ATIS, aircraft, and objectives
final class BriefingService {
    static let shared = BriefingService()

    private init() {}

    // MARK: - Generate Complete Briefing

    func generateBriefing(for scenario: Scenario) -> ScenarioBriefing {
        let aircraft = generateAircraft()
        let atis = generateATIS(for: scenario)
        let airport = AirportInfo.metro
        let (objective, situation, position, route) = generateContext(for: scenario, atis: atis)
        let phrases = generatePhrases(for: scenario, callsign: aircraft.callsign, atis: atis)

        return ScenarioBriefing(
            scenario: scenario,
            aircraft: aircraft,
            atis: atis,
            airport: airport,
            objective: objective,
            situation: situation,
            startingPosition: position,
            taxiRoute: route,
            keyPhrases: phrases
        )
    }

    // MARK: - Aircraft Generation

    private func generateAircraft() -> AircraftInfo {
        // Generate a random but realistic tail number
        let numbers = (1...5).map { _ in String(Int.random(in: 0...9)) }.joined()
        let tailNumber = "N\(numbers)"

        return AircraftInfo(
            type: .cessna172,  // Most common trainer
            tailNumber: tailNumber
        )
    }

    // MARK: - ATIS Generation

    func generateATIS(for scenario: Scenario) -> ATISInfo {
        // Parse conditions from scenario to generate appropriate ATIS
        let conditions = scenario.conditions.lowercased()

        // Determine ATIS identifier (cycles through alphabet)
        let identifier = ATISInfo.phoneticAlphabet.randomElement() ?? "Alpha"

        // Generate time (current-ish Zulu time)
        let hour = Int.random(in: 12...20)
        let minute = (Int.random(in: 0...5)) * 10 + 53  // X3 minute is common
        let time = String(format: "%02d%02dZ", hour, minute % 60)

        // Parse wind from conditions
        let wind = parseWind(from: conditions)

        // Visibility based on conditions
        let visibility: String
        if conditions.contains("low visibility") || conditions.contains("fog") {
            visibility = String(Int.random(in: 1...3))
        } else if conditions.contains("haze") {
            visibility = String(Int.random(in: 5...7))
        } else {
            visibility = "10"
        }

        // Ceiling based on conditions
        let ceiling: String
        if conditions.contains("clear") {
            ceiling = "Clear"
        } else if conditions.contains("overcast") {
            ceiling = "Overcast at \(Int.random(in: 20...40) * 100)"
        } else if conditions.contains("scattered") || conditions.contains("clouds") {
            ceiling = "Scattered clouds at \(Int.random(in: 30...50) * 100)"
        } else if conditions.contains("few") {
            ceiling = "Few clouds at \(Int.random(in: 40...60) * 100)"
        } else {
            ceiling = "Clear"
        }

        // Temperature (reasonable range)
        let temperature = Int.random(in: 15...28)
        let dewpoint = temperature - Int.random(in: 5...12)

        // Altimeter (typical range)
        let altimeter = String(format: "%.2f", Double.random(in: 29.85...30.25))

        // Active runway based on wind
        let activeRunway = determineActiveRunway(wind: wind)

        // NOTAMs
        var notams: [String]? = nil
        if Bool.random() && scenario.category == .groundOperations {
            notams = ["Taxiway B closed between A and C"]
        }

        return ATISInfo(
            identifier: identifier,
            time: time,
            wind: wind,
            visibility: visibility,
            ceiling: ceiling,
            temperature: temperature,
            dewpoint: dewpoint,
            altimeter: altimeter,
            activeRunway: activeRunway,
            departureRunway: nil,
            approachType: wind.speed < 5 ? "Visual" : nil,
            notams: notams,
            remarks: nil
        )
    }

    private func parseWind(from conditions: String) -> WindInfo {
        // Try to extract wind info from conditions string
        // Format: "Wind 270 at 8 kts" or "Wind 320 at 12 gusting 18"

        var direction = 270  // Default westerly
        var speed = 8
        var gusts: Int? = nil
        var variable = false

        if conditions.contains("calm") || conditions.contains("light") {
            speed = Int.random(in: 3...6)
        } else if conditions.contains("gusty") || conditions.contains("gusting") {
            speed = Int.random(in: 10...15)
            gusts = speed + Int.random(in: 5...10)
        } else if conditions.contains("strong") {
            speed = Int.random(in: 15...22)
        }

        // Try to parse direction
        if let range = conditions.range(of: #"\d{3}(?= at)"#, options: .regularExpression) {
            direction = Int(conditions[range]) ?? 270
        } else if conditions.contains("crosswind") {
            // Generate crosswind for runway 27
            direction = Int.random(in: 300...340)
        } else {
            // Random but realistic direction
            direction = [270, 280, 260, 290, 250].randomElement() ?? 270
        }

        if conditions.contains("variable") {
            variable = true
        }

        return WindInfo(direction: direction, speed: speed, gusts: gusts, variable: variable)
    }

    private func determineActiveRunway(wind: WindInfo) -> String {
        // Determine runway based on wind direction
        // Runways: 27L/9R, 27R/9L, 36/18

        let windDir = wind.direction

        // Favor into the wind
        if windDir >= 180 && windDir < 360 {
            // Westerly winds - use 27
            return wind.speed > 10 ? "27L" : "27L"
        } else if windDir >= 0 && windDir < 180 {
            // Easterly winds - use 9
            return "9R"
        } else if windDir >= 315 || windDir < 45 {
            // Northerly - could use 36
            return wind.crosswindComponent(runway: 27) > 15 ? "36" : "27L"
        } else {
            return "27L"
        }
    }

    // MARK: - Context Generation

    private func generateContext(
        for scenario: Scenario,
        atis: ATISInfo
    ) -> (objective: String, situation: String, position: String, route: TaxiRoute?) {

        switch scenario.category {
        case .patternWork:
            return generatePatternContext(scenario: scenario, atis: atis)
        case .groundOperations:
            return generateGroundContext(scenario: scenario, atis: atis)
        case .flightFollowing:
            return generateFlightFollowingContext(scenario: scenario, atis: atis)
        case .emergency:
            return generateEmergencyContext(scenario: scenario, atis: atis)
        }
    }

    private func generatePatternContext(
        scenario: Scenario,
        atis: ATISInfo
    ) -> (String, String, String, TaxiRoute?) {
        let objective = "Complete traffic pattern work at Metro Regional"
        let situation = """
        You've completed your preflight and are ready to depart. \
        You've already listened to ATIS and have information \(atis.identifier). \
        The weather is good for pattern work today.
        """
        let position = "Hold short of runway \(atis.activeRunway)"

        return (objective, situation, position, nil)
    }

    private func generateGroundContext(
        scenario: Scenario,
        atis: ATISInfo
    ) -> (String, String, String, TaxiRoute?) {

        let routes: [(from: String, via: [String], holdShort: [String]?)] = [
            ("FBO Ramp", ["A"], ["27L"]),
            ("Transient Parking", ["B", "A"], ["27L"]),
            ("West Ramp", ["C", "A"], ["36", "27L"]),
            ("Hangar Row", ["D", "B", "A"], ["27L"])
        ]

        let selected = routes.randomElement() ?? routes[0]

        let route = TaxiRoute(
            from: selected.from,
            to: "Runway \(atis.activeRunway)",
            via: selected.via,
            holdShort: selected.holdShort,
            crossings: selected.holdShort?.filter { $0 != atis.activeRunway }
        )

        let objective = "Taxi from \(route.from) to runway \(atis.activeRunway) for departure"

        let situation = """
        You're parked at the \(route.from) and have completed your preflight inspection. \
        The engine is running and you've received ATIS information \(atis.identifier). \
        You're ready to contact Ground for taxi clearance.
        """

        let position = route.from

        return (objective, situation, position, route)
    }

    private func generateFlightFollowingContext(
        scenario: Scenario,
        atis: ATISInfo
    ) -> (String, String, String, TaxiRoute?) {
        let objective = "Request and maintain VFR flight following"

        let altitude = [3500, 4500, 5500, 6500].randomElement() ?? 4500
        let destination = ["Portland", "Seattle", "San Francisco", "Phoenix"].randomElement() ?? "Portland"

        let situation = """
        You've departed Metro Regional and are climbing through \(altitude) feet. \
        You're clear of the Class D airspace and ready to request flight following \
        for your cross-country flight to \(destination).
        """

        let position = "15 miles east of Metro, climbing through \(altitude)"

        return (objective, situation, position, nil)
    }

    private func generateEmergencyContext(
        scenario: Scenario,
        atis: ATISInfo
    ) -> (String, String, String, TaxiRoute?) {
        let objective = "Handle emergency situation and communicate with ATC"

        let situation: String
        let position: String

        switch scenario.id {
        case "emerg_engine_failure":
            situation = """
            You're 8 miles northeast of Metro at 4,500 feet when your engine begins running rough \
            and then loses power completely. You need to declare an emergency and get vectors \
            to the nearest suitable airport.
            """
            position = "8 miles northeast, 4,500 feet"

        case "emerg_low_fuel":
            situation = """
            Due to unexpected headwinds, your fuel situation is becoming critical. \
            You estimate 25 minutes of fuel remaining. You need to declare minimum fuel \
            and request priority handling.
            """
            position = "20 miles south, 5,500 feet"

        default:
            situation = "An emergency situation has developed and you need to communicate with ATC."
            position = "In flight near Metro"
        }

        return (objective, situation, position, nil)
    }

    // MARK: - Phrase Generation

    private func generatePhrases(
        for scenario: Scenario,
        callsign: String,
        atis: ATISInfo
    ) -> [PhraseTemplate] {

        switch scenario.category {
        case .patternWork:
            return patternPhrases(callsign: callsign, atis: atis)
        case .groundOperations:
            return groundPhrases(callsign: callsign, atis: atis)
        case .flightFollowing:
            return flightFollowingPhrases(callsign: callsign)
        case .emergency:
            return emergencyPhrases(callsign: callsign)
        }
    }

    private func patternPhrases(callsign: String, atis: ATISInfo) -> [PhraseTemplate] {
        [
            PhraseTemplate(
                situation: "Ready for departure",
                template: "[Facility] Tower, [Callsign], ready for departure runway [runway], remaining in the pattern",
                example: "Metro Tower, \(callsign), ready for departure runway \(atis.activeRunway), remaining in the pattern",
                tips: ["State your intentions clearly", "Include runway number"]
            ),
            PhraseTemplate(
                situation: "Reporting downwind",
                template: "[Facility] Tower, [Callsign], left downwind runway [runway]",
                example: "Metro Tower, \(callsign), left downwind runway \(atis.activeRunway)",
                tips: ["Report when abeam the numbers", "State full stop or touch-and-go"]
            ),
            PhraseTemplate(
                situation: "Turning base",
                template: "[Facility] Tower, [Callsign], turning left base runway [runway]",
                example: "Metro Tower, \(callsign), turning left base runway \(atis.activeRunway)",
                tips: ["Look for traffic on final", "Be ready for sequencing instructions"]
            )
        ]
    }

    private func groundPhrases(callsign: String, atis: ATISInfo) -> [PhraseTemplate] {
        [
            PhraseTemplate(
                situation: "Initial contact with ground",
                template: "[Facility] Ground, [Callsign], at [position], ready to taxi with information [ATIS]",
                example: "Metro Ground, \(callsign), at the FBO, ready to taxi with information \(atis.identifier)",
                tips: ["Include ATIS identifier", "State your location clearly", "Be ready to copy taxi instructions"]
            ),
            PhraseTemplate(
                situation: "Readback taxi clearance",
                template: "Taxi to runway [runway] via [taxiways], hold short [runway], [Callsign]",
                example: "Taxi to runway \(atis.activeRunway) via Alpha, hold short runway \(atis.activeRunway), \(callsign)",
                tips: ["Always read back hold short instructions", "Read back the taxi route", "End with your callsign"]
            ),
            PhraseTemplate(
                situation: "Holding short",
                template: "[Callsign], holding short runway [runway]",
                example: "\(callsign), holding short runway \(atis.activeRunway)",
                tips: ["Report when at the hold short line", "Wait for clearance to cross or enter"]
            )
        ]
    }

    private func flightFollowingPhrases(callsign: String) -> [PhraseTemplate] {
        [
            PhraseTemplate(
                situation: "Request flight following",
                template: "[Facility], [Callsign], [position], [altitude], request VFR flight following to [destination]",
                example: "Seattle Approach, \(callsign), 15 miles east of Metro, 4,500, request VFR flight following to Portland",
                tips: ["Include position, altitude, aircraft type", "State destination", "Be ready with squawk code"]
            ),
            PhraseTemplate(
                situation: "Traffic in sight",
                template: "[Callsign], traffic in sight",
                example: "\(callsign), traffic in sight",
                tips: ["Report as soon as you see the traffic", "Maintain visual separation"]
            )
        ]
    }

    private func emergencyPhrases(callsign: String) -> [PhraseTemplate] {
        [
            PhraseTemplate(
                situation: "Declare emergency",
                template: "Mayday, Mayday, Mayday, [Callsign], [nature of emergency]",
                example: "Mayday, Mayday, Mayday, \(callsign), engine failure",
                tips: ["Say Mayday three times", "State nature of emergency clearly", "ATC will help you"]
            ),
            PhraseTemplate(
                situation: "Provide details",
                template: "[Callsign], [souls on board] souls on board, [fuel remaining] fuel remaining",
                example: "\(callsign), 2 souls on board, 2 hours fuel remaining",
                tips: ["Souls = total people on board", "Fuel helps rescuers know search area"]
            )
        ]
    }
}
