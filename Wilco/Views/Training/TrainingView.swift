import SwiftUI

struct TrainingView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var viewModel = TrainingViewModel()

    let scenario: Scenario

    var body: some View {
        VStack(spacing: 0) {
            // Radio Panel
            RadioPanelView(
                frequency: viewModel.currentFrequency,
                state: viewModel.transmissionState,
                category: scenario.category
            )

            // Conversation
            ConversationView(messages: viewModel.messages)

            // Input Area
            VStack(spacing: 12) {
                // Suggestion Chips
                if !viewModel.suggestions.isEmpty && !viewModel.isWaitingForResponse {
                    SuggestionChipsView(
                        suggestions: viewModel.suggestions,
                        onSelect: { suggestion in
                            viewModel.useSuggestion(suggestion)
                        }
                    )
                }

                // Input Controls
                InputControlsView(viewModel: viewModel)
            }
            .padding()
            .background(.ultraThinMaterial)
        }
        .background(Color.appBackground.ignoresSafeArea())
        .navigationTitle(scenario.name)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Button {
                        viewModel.startSession(with: scenario)
                    } label: {
                        Label("Restart Session", systemImage: "arrow.counterclockwise")
                    }

                    Button(role: .destructive) {
                        dismiss()
                    } label: {
                        Label("End Session", systemImage: "xmark.circle")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .onAppear {
            viewModel.startSession(with: scenario)
            Task {
                await viewModel.requestSpeechAuthorization()
            }
        }
        .onDisappear {
            viewModel.endSession()
        }
        .alert("Error", isPresented: .constant(viewModel.errorMessage != nil)) {
            Button("OK") {
                viewModel.errorMessage = nil
            }
        } message: {
            if let error = viewModel.errorMessage {
                Text(error)
            }
        }
    }
}

#Preview {
    NavigationStack {
        TrainingView(scenario: Scenario(
            id: "pattern_first_solo",
            name: "First Solo Pattern",
            description: "Your first solo flight!",
            difficulty: .beginner,
            conditions: "Clear skies, Wind 270 at 5 kts",
            tips: "Take your time.",
            icon: "🛫",
            suggestions: [
                "Metro Tower, Cessna 12345, ready for departure runway 27",
                "Metro Tower, Cessna 12345, left downwind runway 27"
            ]
        ))
        .environment(AppViewModel())
    }
    .preferredColorScheme(.dark)
}
