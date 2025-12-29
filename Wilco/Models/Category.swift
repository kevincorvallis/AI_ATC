import SwiftUI

enum Category: String, CaseIterable, Identifiable, Codable, Hashable {
    case patternWork = "pattern_work"
    case groundOperations = "ground_operations"
    case flightFollowing = "flight_following"
    case emergency = "emergency"

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .patternWork: return "Pattern Work"
        case .groundOperations: return "Ground Operations"
        case .flightFollowing: return "Flight Following"
        case .emergency: return "Emergency Procedures"
        }
    }

    var description: String {
        switch self {
        case .patternWork:
            return "Practice traffic pattern communications at towered airports"
        case .groundOperations:
            return "Master taxi clearances and ground control procedures"
        case .flightFollowing:
            return "Learn VFR flight following and radar services"
        case .emergency:
            return "Handle emergency communications and procedures"
        }
    }

    var frequency: String {
        switch self {
        case .patternWork: return "118.300"
        case .groundOperations: return "121.900"
        case .flightFollowing: return "124.350"
        case .emergency: return "121.500"
        }
    }

    var iconName: String {
        switch self {
        case .patternWork: return "airplane.circle.fill"
        case .groundOperations: return "road.lanes"
        case .flightFollowing: return "antenna.radiowaves.left.and.right"
        case .emergency: return "exclamationmark.triangle.fill"
        }
    }

    var iconEmoji: String {
        switch self {
        case .patternWork: return "✈️"
        case .groundOperations: return "🛫"
        case .flightFollowing: return "📡"
        case .emergency: return "🚨"
        }
    }

    var accentColor: Color {
        switch self {
        case .patternWork: return .blue
        case .groundOperations: return .orange
        case .flightFollowing: return .purple
        case .emergency: return .red
        }
    }

    var scenarios: [Scenario] {
        ScenarioData.scenarios(for: self)
    }
}
