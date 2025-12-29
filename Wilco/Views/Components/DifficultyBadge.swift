import SwiftUI

struct DifficultyBadge: View {
    let difficulty: Difficulty
    var compact: Bool = false

    var body: some View {
        Text(compact ? String(difficulty.rawValue.prefix(3)) : difficulty.rawValue)
            .font(.caption2)
            .fontWeight(.semibold)
            .foregroundStyle(.white)
            .padding(.horizontal, compact ? 6 : 10)
            .padding(.vertical, 4)
            .background(difficulty.color)
            .clipShape(Capsule())
    }
}

#Preview {
    VStack(spacing: 12) {
        DifficultyBadge(difficulty: .beginner)
        DifficultyBadge(difficulty: .intermediate)
        DifficultyBadge(difficulty: .advanced)

        Divider()

        HStack {
            DifficultyBadge(difficulty: .beginner, compact: true)
            DifficultyBadge(difficulty: .intermediate, compact: true)
            DifficultyBadge(difficulty: .advanced, compact: true)
        }
    }
    .padding()
    .background(Color.appBackground)
    .preferredColorScheme(.dark)
}
