import Foundation

struct ATCRequest: Codable {
    let scenario: String
    let message: String
    let history: [ConversationEntry]
    let customSystemPrompt: String?

    init(scenario: String, message: String, history: [ConversationEntry], customSystemPrompt: String? = nil) {
        self.scenario = scenario
        self.message = message
        self.history = history
        self.customSystemPrompt = customSystemPrompt
    }
}

struct ConversationEntry: Codable {
    let role: String
    let content: String
}
