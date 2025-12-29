import SwiftUI

struct ConversationView: View {
    let messages: [Message]

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(spacing: 16) {
                    ForEach(messages) { message in
                        MessageBubbleView(message: message)
                            .id(message.id)
                    }
                }
                .padding()
            }
            .onChange(of: messages.count) { _, _ in
                if let lastMessage = messages.last {
                    withAnimation(.easeOut(duration: 0.3)) {
                        proxy.scrollTo(lastMessage.id, anchor: .bottom)
                    }
                }
            }
        }
    }
}

#Preview {
    ConversationView(messages: [
        Message(role: .system, content: "First Solo Pattern\nYour first solo flight! Calm winds, clear skies.\n\nConditions: Wind 270 at 5 kts"),
        Message(role: .pilot, content: "Metro Tower, Cessna 12345, ready for departure runway 27, remaining in the pattern"),
        Message(role: .atc, content: "Cessna 12345, Metro Tower, runway 27, cleared for takeoff, wind 270 at 5."),
        Message(role: .pilot, content: "Cleared for takeoff runway 27, Cessna 12345"),
        Message(role: .atc, content: "Cessna 12345, roger.")
    ])
    .background(Color.appBackground)
    .preferredColorScheme(.dark)
}
