import Foundation

@Observable
final class CategoriesViewModel {
    let categories: [Category] = Category.allCases

    func scenarioCount(for category: Category) -> Int {
        category.scenarios.count
    }

    func difficultyBreakdown(for category: Category) -> [Difficulty: Int] {
        var breakdown: [Difficulty: Int] = [:]
        for scenario in category.scenarios {
            breakdown[scenario.difficulty, default: 0] += 1
        }
        return breakdown
    }
}
