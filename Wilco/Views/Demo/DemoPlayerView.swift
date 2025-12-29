import SwiftUI
import AVFoundation

struct DemoPlayerView: View {
    let demo: ATCExamples.DemoConversation
    let onDismiss: () -> Void

    @State private var displayedExchanges: [ATCExamples.Exchange] = []
    @State private var currentIndex = 0
    @State private var isPlaying = true
    @State private var transmissionState: TrainingViewModel.TransmissionState = .idle
    @State private var showControls = true

    // Typewriter effect
    @State private var currentTypingText = ""
    @State private var isTyping = false

    var body: some View {
        VStack(spacing: 0) {
            // Header
            demoHeader

            // Radio Panel
            RadioPanelView(
                frequency: demo.frequency,
                state: transmissionState,
                category: demo.category
            )

            // Conversation
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 16) {
                        ForEach(displayedExchanges) { exchange in
                            DemoMessageView(
                                exchange: exchange,
                                isTyping: isTyping && exchange.id == displayedExchanges.last?.id,
                                typingText: currentTypingText
                            )
                            .id(exchange.id)
                            .transition(.asymmetric(
                                insertion: .move(edge: .bottom).combined(with: .opacity),
                                removal: .opacity
                            ))
                        }
                    }
                    .padding()
                    .animation(.spring(response: 0.4), value: displayedExchanges.count)
                }
                .onChange(of: displayedExchanges.count) { _, _ in
                    if let last = displayedExchanges.last {
                        withAnimation {
                            proxy.scrollTo(last.id, anchor: .bottom)
                        }
                    }
                }
            }

            // Controls
            if showControls {
                demoControls
            }
        }
        .background(Color.appBackground.ignoresSafeArea())
        .onAppear {
            startDemo()
        }
        .onDisappear {
            isPlaying = false
        }
    }

    // MARK: - Header

    private var demoHeader: some View {
        VStack(spacing: 8) {
            HStack {
                Button {
                    onDismiss()
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.title2)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                Label("DEMO", systemImage: "play.circle.fill")
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundStyle(.orange)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(.orange.opacity(0.2))
                    .clipShape(Capsule())

                Spacer()

                // Placeholder for symmetry
                Color.clear.frame(width: 28, height: 28)
            }
            .padding(.horizontal)

            Text(demo.title)
                .font(.headline)

            Text(demo.description)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding(.vertical, 12)
        .background(.ultraThinMaterial)
    }

    // MARK: - Controls

    private var demoControls: some View {
        HStack(spacing: 24) {
            // Restart
            Button {
                restartDemo()
            } label: {
                Image(systemName: "backward.end.fill")
                    .font(.title2)
            }

            // Play/Pause
            Button {
                isPlaying.toggle()
                if isPlaying && currentIndex < demo.exchanges.count {
                    continueDemo()
                }
            } label: {
                Image(systemName: isPlaying ? "pause.circle.fill" : "play.circle.fill")
                    .font(.system(size: 50))
            }

            // Skip
            Button {
                skipToNext()
            } label: {
                Image(systemName: "forward.end.fill")
                    .font(.title2)
            }
            .disabled(currentIndex >= demo.exchanges.count)
        }
        .foregroundStyle(.white)
        .padding(.vertical, 20)
        .frame(maxWidth: .infinity)
        .background(.ultraThinMaterial)
    }

    // MARK: - Demo Playback

    private func startDemo() {
        displayedExchanges = []
        currentIndex = 0
        isPlaying = true
        playNextExchange()
    }

    private func restartDemo() {
        startDemo()
    }

    private func continueDemo() {
        playNextExchange()
    }

    private func skipToNext() {
        guard currentIndex < demo.exchanges.count else { return }
        let exchange = demo.exchanges[currentIndex]
        displayedExchanges.append(exchange)
        currentIndex += 1

        if currentIndex < demo.exchanges.count {
            playNextExchange()
        }
    }

    private func playNextExchange() {
        guard isPlaying, currentIndex < demo.exchanges.count else {
            transmissionState = .idle
            return
        }

        let exchange = demo.exchanges[currentIndex]

        // Update transmission state based on speaker
        switch exchange.speaker {
        case .pilot:
            transmissionState = .transmitting
            HapticManager.impact(.medium)
        case .atc:
            transmissionState = .receiving
            HapticManager.notification(.success)
        case .system:
            transmissionState = .idle
        }

        // Show message with typewriter effect
        Task {
            try? await Task.sleep(for: .seconds(exchange.delay))

            guard isPlaying else { return }

            await MainActor.run {
                isTyping = true
                currentTypingText = ""
            }

            // Typewriter effect
            for char in exchange.message {
                guard isPlaying else { break }
                try? await Task.sleep(for: .milliseconds(exchange.speaker == .atc ? 25 : 15))
                await MainActor.run {
                    currentTypingText += String(char)
                }
            }

            await MainActor.run {
                isTyping = false
                withAnimation {
                    displayedExchanges.append(exchange)
                }
                currentIndex += 1
                currentTypingText = ""

                // Small delay, then next
                Task {
                    try? await Task.sleep(for: .seconds(0.5))
                    playNextExchange()
                }
            }
        }
    }
}

// MARK: - Demo Message View

struct DemoMessageView: View {
    let exchange: ATCExamples.Exchange
    let isTyping: Bool
    let typingText: String

    var body: some View {
        HStack {
            if exchange.speaker == .pilot { Spacer(minLength: 40) }

            VStack(alignment: alignment, spacing: 6) {
                // Speaker label
                HStack(spacing: 4) {
                    Image(systemName: iconName)
                        .font(.caption2)
                    Text(speakerLabel)
                        .font(.caption2)
                        .fontWeight(.semibold)
                }
                .foregroundStyle(labelColor)

                // Message
                Text(isTyping ? typingText : exchange.message)
                    .font(.body)
                    .foregroundStyle(textColor)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(bubbleColor)
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                    .overlay {
                        if isTyping {
                            RoundedRectangle(cornerRadius: 16)
                                .stroke(labelColor.opacity(0.5), lineWidth: 1)
                        }
                    }
            }

            if exchange.speaker != .pilot { Spacer(minLength: 40) }
        }
    }

    private var alignment: HorizontalAlignment {
        switch exchange.speaker {
        case .pilot: return .trailing
        case .atc, .system: return .leading
        }
    }

    private var iconName: String {
        switch exchange.speaker {
        case .pilot: return "person.wave.2.fill"
        case .atc: return "antenna.radiowaves.left.and.right"
        case .system: return "info.circle.fill"
        }
    }

    private var speakerLabel: String {
        switch exchange.speaker {
        case .pilot: return "PILOT"
        case .atc: return "ATC"
        case .system: return "SCENARIO"
        }
    }

    private var labelColor: Color {
        switch exchange.speaker {
        case .pilot: return .blue
        case .atc: return .green
        case .system: return .orange
        }
    }

    private var bubbleColor: Color {
        switch exchange.speaker {
        case .pilot: return .blue
        case .atc: return Color.atcBubble
        case .system: return .orange.opacity(0.15)
        }
    }

    private var textColor: Color {
        switch exchange.speaker {
        case .pilot: return .white
        case .atc: return .primary
        case .system: return .orange
        }
    }
}

#Preview {
    DemoPlayerView(demo: ATCExamples.patternWorkDemo) {
        print("Dismissed")
    }
}
