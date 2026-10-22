import Foundation

struct DemoModeService {
    func generateResponse(for message: String, category: Category) -> String {
        let msg = message.lowercased()
        let callsign = extractCallsign(from: message) ?? "Cessna 12345"

        // Acknowledgments should not trigger a second, conflicting clearance.
        if msg.contains("cleared for takeoff") {
            return "\(callsign), roger, report downwind."
        }
        if msg.contains("cleared to land") || msg.contains("cleared touch and go") {
            return "\(callsign), roger."
        }
        if msg.contains("contact tower") {
            return "\(callsign), roger, frequency change approved."
        }
        // Pattern matching for common transmissions
        if msg.contains("ready for departure") || msg.contains("ready for takeoff") {
            return "\(callsign), runway 27, cleared for takeoff, wind 270 at 8."
        }

        if msg.contains("downwind") {
            return "\(callsign), roger, report base."
        }

        if msg.contains("turning base") || msg.contains("left base") || msg.contains("right base") {
            return "\(callsign), continue, you're number 2 following traffic on short final."
        }

        if msg.contains("final") {
            return "\(callsign), cleared to land runway 27, wind 270 at 8."
        }

        if msg.contains("touch and go") {
            return "\(callsign), cleared touch and go runway 27."
        }

        if msg.contains("clear of") || msg.contains("clear the runway") {
            return "\(callsign), roger, contact ground 121.9."
        }

        if msg.contains("taxi") && (msg.contains("ready") || msg.contains("request")) {
            return "\(callsign), runway 27, taxi via Alpha, hold short runway 27."
        }
        if msg.contains("taxi") && msg.contains("hold short") {
            return "\(callsign), readback received, report holding short."
        }
        if msg.contains("holding short") {
            return "\(callsign), contact tower 118.3."
        }
        if msg.contains("taxi") {
            return "\(callsign), say destination and request."
        }

        if msg.contains("flight following") || msg.contains("vfr") {
            return "\(callsign), squawk 4521, radar contact, proceed on course."
        }

        if msg.contains("traffic in sight") {
            return "\(callsign), roger, maintain visual separation."
        }

        if msg.contains("mayday") || msg.contains("emergency") {
            return "\(callsign), roger mayday, say souls on board and fuel remaining. Emergency equipment is standing by."
        }

        if msg.contains("souls") || msg.contains("fuel") {
            return "\(callsign), roger, say intentions."
        }

        if msg.contains("request") && msg.contains("vectors") {
            return "\(callsign), fly heading 270, vectors for runway 27."
        }

        if msg.contains("airport in sight") {
            return "\(callsign), cleared visual approach runway 27."
        }

        // Default responses per scenario category
        switch category {
        case .patternWork:
            return "\(callsign), roger, continue."
        case .groundOperations:
            return "\(callsign), hold position, stand by."
        case .flightFollowing:
            return "\(callsign), radar contact, altimeter 30.12."
        case .emergency:
            return "\(callsign), roger, say intentions. All assistance available."
        }
    }

    private func extractCallsign(from message: String) -> String? {
        // Match patterns like:
        // N12345, N1234A, Cessna 12345, Skyhawk 4378Q, etc.
        let patterns = [
            "N\\d{3,5}[A-Z]?",                    // N-numbers: N12345, N1234A
            "(?:Cessna|Skyhawk|Cherokee|Piper|Cirrus|Bonanza|Baron|King Air)\\s*\\d{2,5}[A-Z]?",
            "[A-Z]-[A-Z]{4}"                       // International: D-ABCD
        ]

        for pattern in patterns {
            if let regex = try? NSRegularExpression(pattern: pattern, options: .caseInsensitive),
               let match = regex.firstMatch(in: message, range: NSRange(message.startIndex..., in: message)),
               let range = Range(match.range, in: message) {
                return String(message[range])
            }
        }

        return nil
    }
}
