import SwiftUI

struct ScenarioRowView: View {
    let scenario: Scenario

    var body: some View {
        HStack(spacing: 14) {
            // Icon
            Text(scenario.icon)
                .font(.title2)
                .frame(width: 44, height: 44)
                .background(Color.appSurfaceLight)
                .clipShape(RoundedRectangle(cornerRadius: 10))

            // Content
            VStack(alignment: .leading, spacing: 4) {
                Text(scenario.name)
                    .font(.headline)
                    .foregroundStyle(.white)

                Text(scenario.description)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)

                Text(scenario.conditions)
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
                    .lineLimit(1)
            }

            Spacer()

            // Difficulty Badge
            DifficultyBadge(difficulty: scenario.difficulty)

            // Chevron
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
        .padding(.vertical, 8)
    }
}

#Preview {
    List {
        ScenarioRowView(scenario: Scenario(
            id: "pattern_first_solo",
            name: "First Solo Pattern",
            description: "Your first solo flight! Calm winds, clear skies, light traffic.",
            difficulty: .beginner,
            conditions: "Clear skies, Wind 270 at 5 kts",
            tips: "Take your time.",
            icon: "🛫",
            suggestions: []
        ))
    }
    .listStyle(.insetGrouped)
    .preferredColorScheme(.dark)
}
