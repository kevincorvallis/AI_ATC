import Foundation

enum Constants {
    static let apiBaseURL = "https://3zk0d6e54l.execute-api.us-east-1.amazonaws.com/atc"
    static let requestTimeout: TimeInterval = 15

    enum StorageKeys {
        static let settings = "wilco_settings"
        static let progress = "wilco_progress"
    }

    enum Limits {
        static let maxHistoryMessages = 20
    }
}
