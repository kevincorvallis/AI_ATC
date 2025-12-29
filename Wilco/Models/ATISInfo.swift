import Foundation

/// ATIS (Automatic Terminal Information Service) data
struct ATISInfo: Codable {
    let identifier: String      // "Alpha", "Bravo", "Charlie", etc.
    let time: String            // "1453Z"
    let wind: WindInfo
    let visibility: String      // "10" (statute miles)
    let ceiling: String         // "Clear", "Few clouds at 4,500", etc.
    let temperature: Int        // Celsius
    let dewpoint: Int           // Celsius
    let altimeter: String       // "30.12"
    let activeRunway: String    // "27L"
    let departureRunway: String?
    let approachType: String?   // "ILS", "Visual", "RNAV"
    let notams: [String]?       // Relevant NOTAMs
    let remarks: String?

    /// Phonetic alphabet for ATIS identifiers
    static let phoneticAlphabet = [
        "Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot",
        "Golf", "Hotel", "India", "Juliet", "Kilo", "Lima",
        "Mike", "November", "Oscar", "Papa", "Quebec", "Romeo",
        "Sierra", "Tango", "Uniform", "Victor", "Whiskey",
        "X-ray", "Yankee", "Zulu"
    ]

    /// Full ATIS broadcast text
    var fullBroadcast: String {
        var parts: [String] = []

        parts.append("Metro Airport Information \(identifier).")
        parts.append("Time \(time).")
        parts.append("Wind \(wind.description).")
        parts.append("Visibility \(visibility) miles.")
        parts.append("\(ceiling).")
        parts.append("Temperature \(temperature), dewpoint \(dewpoint).")
        parts.append("Altimeter \(altimeter).")
        parts.append("Landing and departing runway \(activeRunway).")

        if let notams = notams, !notams.isEmpty {
            parts.append("NOTAMs: \(notams.joined(separator: ". ")).")
        }

        if let remarks = remarks {
            parts.append(remarks)
        }

        parts.append("Advise on initial contact you have information \(identifier).")

        return parts.joined(separator: " ")
    }

    /// Short summary for display
    var summary: String {
        "Info \(identifier) • Rwy \(activeRunway) • Wind \(wind.shortDescription) • \(altimeter)"
    }

    /// Decoded ATIS for beginners
    var decoded: [(label: String, value: String, explanation: String)] {
        [
            ("Information", identifier, "Current ATIS code - mention this when contacting ATC"),
            ("Time", time, "Zulu (UTC) time of this broadcast"),
            ("Wind", wind.description, "Wind direction (magnetic) and speed in knots"),
            ("Visibility", "\(visibility) SM", "Statute miles of visibility"),
            ("Ceiling", ceiling, "Cloud coverage and heights"),
            ("Temperature", "\(temperature)°C / \(celsiusToFahrenheit(temperature))°F", "Outside air temperature"),
            ("Altimeter", altimeter, "Set this in your altimeter (inches of mercury)"),
            ("Runway", activeRunway, "Active runway for takeoffs and landings")
        ]
    }

    private func celsiusToFahrenheit(_ c: Int) -> Int {
        Int(Double(c) * 9/5 + 32)
    }
}

struct WindInfo: Codable {
    let direction: Int      // Magnetic heading (0-360)
    let speed: Int          // Knots
    let gusts: Int?         // Gust speed in knots
    let variable: Bool      // Variable winds

    var description: String {
        var result = String(format: "%03d", direction)
        result += " at \(speed)"
        if let gusts = gusts {
            result += " gusting \(gusts)"
        }
        if variable {
            result += " variable"
        }
        return result
    }

    var shortDescription: String {
        var result = "\(direction)@\(speed)"
        if let gusts = gusts {
            result += "G\(gusts)"
        }
        return result
    }

    /// Check if this is a crosswind for the given runway
    func crosswindComponent(runway: Int) -> Int {
        let runwayHeading = runway * 10
        let angleDiff = abs(direction - runwayHeading)
        let angle = min(angleDiff, 360 - angleDiff)
        let radians = Double(angle) * .pi / 180
        return Int(Double(speed) * sin(radians))
    }
}
