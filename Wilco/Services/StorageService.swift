import Foundation

final class StorageService: @unchecked Sendable {
    static let shared = StorageService()

    private let defaults = UserDefaults.standard
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    private init() {}

    // MARK: - Settings

    func loadSettings() -> UserSettings {
        guard let data = defaults.data(forKey: Constants.StorageKeys.settings),
              let settings = try? decoder.decode(UserSettings.self, from: data) else {
            return UserSettings()
        }
        return settings
    }

    func saveSettings(_ settings: UserSettings) {
        guard let data = try? encoder.encode(settings) else { return }
        defaults.set(data, forKey: Constants.StorageKeys.settings)
    }

    // MARK: - Progress

    func loadProgress() -> UserProgress {
        guard let data = defaults.data(forKey: Constants.StorageKeys.progress),
              let progress = try? decoder.decode(UserProgress.self, from: data) else {
            return UserProgress()
        }
        return progress
    }

    func saveProgress(_ progress: UserProgress) {
        guard let data = try? encoder.encode(progress) else { return }
        defaults.set(data, forKey: Constants.StorageKeys.progress)
    }

    // MARK: - Reset

    func resetAll() {
        defaults.removeObject(forKey: Constants.StorageKeys.settings)
        defaults.removeObject(forKey: Constants.StorageKeys.progress)
    }

    func resetProgress() {
        defaults.removeObject(forKey: Constants.StorageKeys.progress)
    }
}
