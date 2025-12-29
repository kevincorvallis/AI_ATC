import Foundation

@Observable
final class SettingsViewModel {
    var settings: UserSettings
    var progress: UserProgress

    private let storageService: StorageService

    init(storageService: StorageService = .shared) {
        self.storageService = storageService
        self.settings = storageService.loadSettings()
        self.progress = storageService.loadProgress()
    }

    func saveSettings() {
        storageService.saveSettings(settings)
    }

    func resetProgress() {
        progress = UserProgress()
        storageService.saveProgress(progress)
    }

    func reload() {
        progress = storageService.loadProgress()
        settings = storageService.loadSettings()
    }

    // MARK: - Computed Properties

    var formattedLastSession: String {
        guard let date = progress.lastSessionDate else {
            return "Never"
        }

        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .full
        return formatter.localizedString(for: date, relativeTo: Date())
    }

    var hasProgress: Bool {
        progress.totalSessions > 0 || progress.totalTransmissions > 0
    }
}
