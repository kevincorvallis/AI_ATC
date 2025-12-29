import Foundation

/// Aircraft information for training scenarios
struct AircraftInfo: Codable {
    let type: AircraftType
    let tailNumber: String      // "N12345"

    /// Full callsign (e.g., "Cessna November One Two Three Four Five")
    var fullCallsign: String {
        "\(type.displayName) \(tailNumber.phoneticSpelling)"
    }

    /// Standard callsign (e.g., "Cessna 12345")
    var callsign: String {
        "\(type.displayName) \(tailNumber.dropFirst())"  // Remove the N
    }

    /// Abbreviated callsign (e.g., "Cessna 345")
    /// Only use after ATC establishes abbreviated communications
    var abbreviatedCallsign: String {
        "\(type.displayName) \(String(tailNumber.suffix(3)))"
    }

    /// Just the tail number for display
    var displayTailNumber: String {
        tailNumber
    }
}

enum AircraftType: String, Codable, CaseIterable {
    case cessna172 = "cessna_172"
    case cessna182 = "cessna_182"
    case piper28 = "piper_28"
    case cirrusSR22 = "cirrus_sr22"
    case bonanza = "beech_bonanza"
    case diamond40 = "diamond_da40"

    var displayName: String {
        switch self {
        case .cessna172: return "Cessna"
        case .cessna182: return "Cessna"
        case .piper28: return "Cherokee"
        case .cirrusSR22: return "Cirrus"
        case .bonanza: return "Bonanza"
        case .diamond40: return "Diamond"
        }
    }

    var fullName: String {
        switch self {
        case .cessna172: return "Cessna 172 Skyhawk"
        case .cessna182: return "Cessna 182 Skylane"
        case .piper28: return "Piper PA-28 Cherokee"
        case .cirrusSR22: return "Cirrus SR22"
        case .bonanza: return "Beechcraft Bonanza"
        case .diamond40: return "Diamond DA40"
        }
    }

    var icaoCode: String {
        switch self {
        case .cessna172: return "C172"
        case .cessna182: return "C182"
        case .piper28: return "P28A"
        case .cirrusSR22: return "SR22"
        case .bonanza: return "BE36"
        case .diamond40: return "DA40"
        }
    }

    var category: String {
        "Single-engine land"
    }
}

// MARK: - String Extensions for Phonetic Spelling

extension String {
    /// Convert a tail number to phonetic alphabet
    var phoneticSpelling: String {
        self.map { char -> String in
            if let phonetic = Character.phoneticAlphabet[char.uppercased()] {
                return phonetic
            } else if char.isNumber {
                return char.phoneticDigit
            } else {
                return String(char)
            }
        }.joined(separator: " ")
    }
}

extension Character {
    static let phoneticAlphabet: [String: String] = [
        "A": "Alpha", "B": "Bravo", "C": "Charlie", "D": "Delta",
        "E": "Echo", "F": "Foxtrot", "G": "Golf", "H": "Hotel",
        "I": "India", "J": "Juliet", "K": "Kilo", "L": "Lima",
        "M": "Mike", "N": "November", "O": "Oscar", "P": "Papa",
        "Q": "Quebec", "R": "Romeo", "S": "Sierra", "T": "Tango",
        "U": "Uniform", "V": "Victor", "W": "Whiskey", "X": "X-ray",
        "Y": "Yankee", "Z": "Zulu"
    ]

    var phoneticDigit: String {
        switch self {
        case "0": return "Zero"
        case "1": return "One"
        case "2": return "Two"
        case "3": return "Three"
        case "4": return "Four"
        case "5": return "Five"
        case "6": return "Six"
        case "7": return "Seven"
        case "8": return "Eight"
        case "9": return "Niner"
        default: return String(self)
        }
    }
}
