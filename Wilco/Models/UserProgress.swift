import Foundation

struct UserProgress: Codable {
    var totalSessions: Int
    var totalTransmissions: Int
    var lastSessionDate: Date?
    var scenarioStats: [String: ScenarioStats]

    init() {
        self.totalSessions = 0
        self.totalTransmissions = 0
        self.lastSessionDate = nil
        self.scenarioStats = [:]
    }

    mutating func incrementSession() {
        totalSessions += 1
        lastSessionDate = Date()
    }

    mutating func incrementTransmission(for scenarioId: String) {
        totalTransmissions += 1
        var stats = scenarioStats[scenarioId] ?? ScenarioStats()
        stats.transmissionCount += 1
        stats.lastAttempted = Date()
        scenarioStats[scenarioId] = stats
    }
}

struct ScenarioStats: Codable {
    var transmissionCount: Int = 0
    var lastAttempted: Date?
}
