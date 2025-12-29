import SwiftUI

struct MessageBubbleView: View {
    let message: Message

    var body: some View {
        HStack {
            if message.role == .pilot { Spacer(minLength: 40) }

            VStack(alignment: alignment, spacing: 6) {
                // Role Label
                HStack(spacing: 4) {
                    if message.role != .system {
                        Image(systemName: iconName)
                            .font(.caption2)
                    }
                    Text(message.role.displayLabel)
                        .font(.caption2)
                        .fontWeight(.semibold)
                }
                .foregroundStyle(labelColor)

                // Message Content
                Text(message.content)
                    .font(.body)
                    .foregroundStyle(textColor)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(bubbleBackground)
                    .clipShape(RoundedRectangle(cornerRadius: 16))
            }

            if message.role != .pilot { Spacer(minLength: 40) }
        }
    }

    private var alignment: HorizontalAlignment {
        switch message.role {
        case .pilot: return .trailing
        case .atc, .system: return .leading
        }
    }

    private var iconName: String {
        switch message.role {
        case .pilot: return "person.fill"
        case .atc: return "antenna.radiowaves.left.and.right"
        case .system: return "info.circle"
        }
    }

    private var labelColor: Color {
        switch message.role {
        case .pilot: return .blue
        case .atc: return .green
        case .system: return .secondary
        }
    }

    private var bubbleBackground: Color {
        switch message.role {
        case .pilot: return .blue
        case .atc: return Color.atcBubble
        case .system: return Color.systemBubble
        }
    }

    private var textColor: Color {
        switch message.role {
        case .pilot: return .white
        case .atc, .system: return .primary
        }
    }
}

#Preview {
    VStack(spacing: 16) {
        MessageBubbleView(message: Message(
            role: .system,
            content: "First Solo Pattern\nYour first solo flight!"
        ))

        MessageBubbleView(message: Message(
            role: .pilot,
            content: "Metro Tower, Cessna 12345, ready for departure runway 27"
        ))

        MessageBubbleView(message: Message(
            role: .atc,
            content: "Cessna 12345, Metro Tower, runway 27, cleared for takeoff, wind 270 at 5."
        ))
    }
    .padding()
    .background(Color.appBackground)
    .preferredColorScheme(.dark)
}
