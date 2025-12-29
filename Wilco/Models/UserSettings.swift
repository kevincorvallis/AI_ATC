import Foundation

struct UserSettings: Codable {
    var speechRate: Float
    var autoPlayATC: Bool
    var hapticFeedbackEnabled: Bool
    var preferredInputMode: InputMode

    init() {
        self.speechRate = 0.9
        self.autoPlayATC = true
        self.hapticFeedbackEnabled = true
        self.preferredInputMode = .text
    }

    enum InputMode: String, Codable, CaseIterable {
        case text
        case voice

        var displayName: String {
            switch self {
            case .text: return "Text"
            case .voice: return "Voice"
            }
        }

        var icon: String {
            switch self {
            case .text: return "keyboard"
            case .voice: return "mic.fill"
            }
        }
    }
}
