import SwiftUI

struct CategoryCardView: View {
    let category: Category
    let scenarioCount: Int

    @State private var isPressed = false

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Icon and Badge
            HStack {
                Image(systemName: category.iconName)
                    .font(.system(size: 32))
                    .foregroundStyle(category.accentColor)

                Spacer()

                Text("\(scenarioCount)")
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundStyle(.white)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(category.accentColor.opacity(0.8))
                    .clipShape(Capsule())
            }

            // Title
            Text(category.displayName)
                .font(.headline)
                .fontWeight(.bold)
                .foregroundStyle(.white)

            // Description
            Text(category.description)
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(2)
                .fixedSize(horizontal: false, vertical: true)

            // Frequency
            HStack(spacing: 4) {
                Image(systemName: "antenna.radiowaves.left.and.right")
                    .font(.caption2)
                Text(category.frequency)
                    .font(.caption)
                    .fontDesign(.monospaced)
            }
            .foregroundStyle(category.accentColor)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.appSurface)
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(category.accentColor.opacity(0.3), lineWidth: 1)
                )
        )
        .scaleEffect(isPressed ? 0.97 : 1.0)
        .animation(.easeInOut(duration: 0.1), value: isPressed)
        .onLongPressGesture(minimumDuration: .infinity, pressing: { pressing in
            isPressed = pressing
        }, perform: {})
    }
}

#Preview {
    VStack(spacing: 16) {
        CategoryCardView(category: .patternWork, scenarioCount: 5)
        CategoryCardView(category: .emergency, scenarioCount: 5)
    }
    .padding()
    .background(Color.appBackground)
    .preferredColorScheme(.dark)
}
