import SwiftUI

struct SuggestionChipsView: View {
    let suggestions: [String]
    let onSelect: (String) -> Void

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                ForEach(suggestions, id: \.self) { suggestion in
                    SuggestionChip(text: suggestion) {
                        onSelect(suggestion)
                    }
                }
            }
            .padding(.horizontal, 4)
        }
    }
}

struct SuggestionChip: View {
    let text: String
    let action: () -> Void

    @State private var isPressed = false

    var body: some View {
        Button(action: action) {
            Text(text)
                .font(.caption)
                .foregroundStyle(.primary)
                .lineLimit(1)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(Color.appSurfaceLight)
                .clipShape(Capsule())
                .overlay(
                    Capsule()
                        .stroke(Color.blue.opacity(0.3), lineWidth: 1)
                )
        }
        .buttonStyle(.plain)
        .scaleEffect(isPressed ? 0.95 : 1.0)
        .onLongPressGesture(minimumDuration: .infinity, pressing: { pressing in
            withAnimation(.easeInOut(duration: 0.1)) {
                isPressed = pressing
            }
        }, perform: {})
    }
}

#Preview {
    VStack {
        SuggestionChipsView(
            suggestions: [
                "Metro Tower, Cessna 12345, ready for departure runway 27",
                "Cessna 12345, left downwind runway 27",
                "Cessna 12345, turning left base"
            ],
            onSelect: { _ in }
        )
    }
    .padding()
    .background(Color.appBackground)
    .preferredColorScheme(.dark)
}
