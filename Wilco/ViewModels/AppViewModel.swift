import SwiftUI

@Observable
final class AppViewModel {
    // Training session state
    var isTrainingActive: Bool = false
    private(set) var activeBriefing: ScenarioBriefing?

    // iPad selection state (for NavigationSplitView)
    var selectedCategory: Category?
    var selectedScenario: Scenario?

    // Global state
    var isOffline: Bool = false
    var showSettings: Bool = false

    // Dependencies
    private let networkMonitor: NetworkMonitor

    init(networkMonitor: NetworkMonitor = .shared) {
        self.networkMonitor = networkMonitor
        observeNetworkStatus()
    }

    private func observeNetworkStatus() {
        isOffline = !networkMonitor.isConnected
    }

    // MARK: - Training Session

    func startTrainingSession(with briefing: ScenarioBriefing) {
        activeBriefing = briefing
        isTrainingActive = true
    }

    func endTrainingSession() {
        isTrainingActive = false
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { [weak self] in
            self?.activeBriefing = nil
        }
    }
}
