import Foundation

struct Message: Identifiable, Codable, Equatable, Hashable {
    let id: UUID
    let role: MessageRole
    let content: String
    let timestamp: Date

    init(id: UUID = UUID(), role: MessageRole, content: String, timestamp: Date = Date()) {
        self.id = id
        self.role = role
        self.content = content
        self.timestamp = timestamp
    }
}

enum MessageRole: String, Codable, Hashable {
    case pilot = "user"
    case atc = "assistant"
    case system = "system"

    var displayLabel: String {
        switch self {
        case .pilot: return "You"
        case .atc: return "ATC"
        case .system: return "System"
        }
    }
}
