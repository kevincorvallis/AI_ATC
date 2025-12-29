import Foundation

struct Scenario: Identifiable, Codable, Hashable {
    let id: String
    let name: String
    let description: String
    let difficulty: Difficulty
    let conditions: String
    let tips: String
    let icon: String
    let suggestions: [String]

    var category: Category {
        if id.hasPrefix("pattern") { return .patternWork }
        if id.hasPrefix("ground") { return .groundOperations }
        if id.hasPrefix("ff") { return .flightFollowing }
        if id.hasPrefix("emerg") { return .emergency }
        return .patternWork
    }
}
