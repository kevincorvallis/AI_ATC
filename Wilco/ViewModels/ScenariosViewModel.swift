import Foundation

@Observable
final class ScenariosViewModel {
    var scenarios: [Scenario] = []
    var category: Category?

    func loadScenarios(for category: Category) {
        self.category = category
        self.scenarios = category.scenarios
    }

    var allScenarios: [Scenario] {
        scenarios.sorted { $0.difficulty.sortOrder < $1.difficulty.sortOrder }
    }
}
