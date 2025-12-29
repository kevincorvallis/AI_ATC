import SwiftUI

struct SignalIndicatorView: View {
    let state: TrainingViewModel.TransmissionState

    @State private var isAnimating = false

    var body: some View {
        ZStack {
            // Outer glow ring
            if state != .idle {
                Circle()
                    .stroke(indicatorColor.opacity(0.4), lineWidth: 3)
                    .frame(width: 28, height: 28)
                    .scaleEffect(isAnimating ? 1.3 : 1.0)
                    .opacity(isAnimating ? 0 : 0.8)
            }

            // Main indicator
            Circle()
                .fill(indicatorColor)
                .frame(width: 16, height: 16)
                .shadow(color: state != .idle ? indicatorColor.opacity(0.6) : .clear, radius: 8)
        }
        .frame(width: 32, height: 32)
        .onChange(of: state) { _, newState in
            if newState != .idle {
                withAnimation(.easeInOut(duration: 0.8).repeatForever(autoreverses: true)) {
                    isAnimating = true
                }
            } else {
                withAnimation(.easeOut(duration: 0.2)) {
                    isAnimating = false
                }
            }
        }
    }

    private var indicatorColor: Color {
        switch state {
        case .idle: return .gray
        case .transmitting: return .red
        case .receiving: return .green
        }
    }
}

#Preview {
    HStack(spacing: 40) {
        VStack {
            SignalIndicatorView(state: .idle)
            Text("Idle").font(.caption)
        }
        VStack {
            SignalIndicatorView(state: .transmitting)
            Text("TX").font(.caption)
        }
        VStack {
            SignalIndicatorView(state: .receiving)
            Text("RX").font(.caption)
        }
    }
    .padding()
    .background(Color.appBackground)
    .preferredColorScheme(.dark)
}
