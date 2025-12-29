import SwiftUI

/// Simplified radio simulator - focused on the core training experience
struct RadioSimulatorView: View {
    let scenario: Scenario
    let briefing: ScenarioBriefing?
    let onExit: () -> Void

    @State private var viewModel = RadioSimulatorViewModel()

    init(scenario: Scenario, briefing: ScenarioBriefing? = nil, onExit: @escaping () -> Void) {
        self.scenario = scenario
        self.briefing = briefing
        self.onExit = onExit
    }

    var body: some View {
        ZStack {
            // Dark cockpit background
            Color.black.ignoresSafeArea()

            VStack(spacing: 0) {
                // Top bar with exit and callsign
                topBar

                // Radio unit display
                radioDisplay

                Spacer()

                // Transcript (minimal, recent messages only)
                transcriptView

                Spacer()

                // PTT and controls
                controlsSection
            }
        }
        .onAppear {
            if let briefing = briefing {
                viewModel.startSession(briefing: briefing)
            } else {
                viewModel.startSession(scenario: scenario)
            }
        }
        .onDisappear {
            viewModel.endSession()
        }
        .preferredColorScheme(.dark)
    }

    // MARK: - Top Bar

    private var topBar: some View {
        HStack {
            // Exit button
            Button {
                viewModel.endSession()
                onExit()
            } label: {
                Image(systemName: "xmark")
                    .font(.title3)
                    .foregroundStyle(.gray)
                    .padding(12)
                    .background(Circle().fill(Color.white.opacity(0.1)))
            }

            Spacer()

            // Callsign (center)
            VStack(spacing: 2) {
                Text(viewModel.callsign)
                    .font(.system(size: 14, weight: .bold, design: .monospaced))
                    .foregroundStyle(.blue)

                Text(scenario.name)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color.blue.opacity(0.15))
            )

            Spacer()

            // Mute button
            Button {
                viewModel.toggleMute()
            } label: {
                Image(systemName: viewModel.isMuted ? "speaker.slash.fill" : "speaker.wave.2.fill")
                    .font(.title3)
                    .foregroundStyle(viewModel.isMuted ? .red : .gray)
                    .padding(12)
                    .background(Circle().fill(Color.white.opacity(0.1)))
            }
        }
        .padding(.horizontal)
        .padding(.top, 8)
    }

    // MARK: - Radio Display

    private var radioDisplay: some View {
        VStack(spacing: 0) {
            // COM label
            HStack {
                Text("COM1")
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundStyle(.green.opacity(0.8))
                Spacer()
                Text("ACTIVE")
                    .font(.caption2)
                    .foregroundStyle(.green.opacity(0.6))
            }
            .padding(.horizontal, 20)
            .padding(.top, 12)

            // Main frequency display
            Text(viewModel.frequency)
                .font(.system(size: 56, weight: .bold, design: .monospaced))
                .foregroundStyle(.green)
                .shadow(color: .green.opacity(0.5), radius: 10)
                .padding(.vertical, 8)

            // Status indicator
            HStack(spacing: 16) {
                // TX indicator
                HStack(spacing: 6) {
                    Circle()
                        .fill(viewModel.isTransmitting ? .red : .gray.opacity(0.3))
                        .frame(width: 12, height: 12)
                        .shadow(color: viewModel.isTransmitting ? .red : .clear, radius: 8)
                    Text("TX")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundStyle(viewModel.isTransmitting ? .red : .gray)
                }

                // RX indicator
                HStack(spacing: 6) {
                    Circle()
                        .fill(viewModel.isReceiving ? .green : .gray.opacity(0.3))
                        .frame(width: 12, height: 12)
                        .shadow(color: viewModel.isReceiving ? .green : .clear, radius: 8)
                    Text("RX")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundStyle(viewModel.isReceiving ? .green : .gray)
                }
            }
            .padding(.bottom, 12)
        }
        .frame(maxWidth: .infinity)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(white: 0.08))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.green.opacity(0.2), lineWidth: 1)
                )
        )
        .padding(.horizontal, 24)
        .padding(.top, 16)
    }

    // MARK: - Transcript

    private var transcriptView: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Last ATC message (most important)
            if let lastATC = viewModel.lastATCMessage {
                VStack(alignment: .leading, spacing: 4) {
                    Label("ATC", systemImage: "antenna.radiowaves.left.and.right")
                        .font(.caption2)
                        .foregroundStyle(.green)

                    Text(lastATC)
                        .font(.body)
                        .foregroundStyle(.white)
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.green.opacity(0.15))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }
            }

            // Your last transmission
            if let lastPilot = viewModel.lastPilotMessage {
                VStack(alignment: .trailing, spacing: 4) {
                    Label("You", systemImage: "person.fill")
                        .font(.caption2)
                        .foregroundStyle(.blue)

                    Text(lastPilot)
                        .font(.body)
                        .foregroundStyle(.white)
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .trailing)
                        .background(Color.blue.opacity(0.15))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }
            }

            // Current voice transcript (while speaking)
            if viewModel.isTransmitting && !viewModel.currentTranscript.isEmpty {
                VStack(alignment: .trailing, spacing: 4) {
                    Label("Speaking...", systemImage: "waveform")
                        .font(.caption2)
                        .foregroundStyle(.orange)

                    Text(viewModel.currentTranscript)
                        .font(.body)
                        .italic()
                        .foregroundStyle(.orange)
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .trailing)
                        .background(Color.orange.opacity(0.15))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }
            }
        }
        .padding(.horizontal, 24)
        .frame(maxHeight: 280)
    }

    // MARK: - Controls Section

    private var controlsSection: some View {
        VStack(spacing: 16) {
            // Quick suggestions
            if !viewModel.isTransmitting && !viewModel.isReceiving && !viewModel.suggestions.isEmpty {
                quickSuggestions
            }

            // Main PTT Button
            pttButton

            // Helper text
            Text(helperText)
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
                .padding(.bottom, 8)
        }
        .padding(.bottom, 30)
    }

    private var quickSuggestions: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                ForEach(viewModel.suggestions, id: \.self) { suggestion in
                    Button {
                        viewModel.sendTextTransmission(suggestion)
                    } label: {
                        Text(suggestion)
                            .font(.caption)
                            .foregroundStyle(.white)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 10)
                            .background(Color.blue.opacity(0.3))
                            .clipShape(Capsule())
                            .overlay(
                                Capsule()
                                    .stroke(Color.blue.opacity(0.5), lineWidth: 1)
                            )
                    }
                }
            }
            .padding(.horizontal, 24)
        }
    }

    // MARK: - PTT Button

    private var pttButton: some View {
        ZStack {
            // Outer ring
            Circle()
                .stroke(
                    viewModel.isTransmitting ? Color.red : Color.gray.opacity(0.3),
                    lineWidth: 4
                )
                .frame(width: 150, height: 150)
                .shadow(color: viewModel.isTransmitting ? .red.opacity(0.5) : .clear, radius: 20)

            // Main button
            Circle()
                .fill(
                    viewModel.isTransmitting
                        ? LinearGradient(colors: [.red, .red.opacity(0.7)], startPoint: .top, endPoint: .bottom)
                        : LinearGradient(colors: [Color(white: 0.25), Color(white: 0.15)], startPoint: .top, endPoint: .bottom)
                )
                .frame(width: 130, height: 130)
                .overlay(
                    VStack(spacing: 6) {
                        Image(systemName: viewModel.isTransmitting ? "mic.fill" : "mic")
                            .font(.system(size: 36))
                        Text(viewModel.isTransmitting ? "TRANSMITTING" : "PUSH TO TALK")
                            .font(.caption2)
                            .fontWeight(.bold)
                    }
                    .foregroundStyle(.white)
                )
                .shadow(color: .black.opacity(0.5), radius: 10, y: 5)
        }
        .scaleEffect(viewModel.isTransmitting ? 1.05 : 1.0)
        .animation(.easeInOut(duration: 0.15), value: viewModel.isTransmitting)
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in
                    if !viewModel.isTransmitting && !viewModel.isReceiving {
                        viewModel.startTransmitting()
                    }
                }
                .onEnded { _ in
                    if viewModel.isTransmitting {
                        viewModel.stopTransmitting()
                    }
                }
        )
        .disabled(viewModel.isReceiving || viewModel.isProcessing)
        .opacity(viewModel.isReceiving ? 0.5 : 1.0)
    }

    private var helperText: String {
        if viewModel.isReceiving {
            return "Listen to ATC..."
        } else if viewModel.isTransmitting {
            return "Speak clearly, release when done"
        } else if viewModel.isProcessing {
            return "Processing..."
        } else {
            return "Hold the button and speak, or tap a suggestion"
        }
    }
}

#Preview {
    RadioSimulatorView(
        scenario: Scenario(
            id: "pattern_first_solo",
            name: "First Solo Pattern",
            description: "Your first solo!",
            difficulty: .beginner,
            conditions: "Clear skies, Wind 270 at 5",
            tips: "Take your time",
            icon: "🛫",
            suggestions: [
                "Metro Tower, Cessna 12345, ready for departure runway 27",
                "Cessna 12345, left downwind runway 27"
            ]
        ),
        onExit: {}
    )
}
