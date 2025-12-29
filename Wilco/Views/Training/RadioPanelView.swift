import SwiftUI

struct RadioPanelView: View {
    let frequency: String
    let state: TrainingViewModel.TransmissionState
    let category: Category

    var body: some View {
        HStack(spacing: 20) {
            // Frequency Display
            VStack(alignment: .leading, spacing: 4) {
                Text("COM1")
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundStyle(.secondary)

                Text(frequency)
                    .font(.system(size: 32, weight: .bold, design: .monospaced))
                    .foregroundStyle(category.accentColor)
            }

            Spacer()

            // Signal Indicator
            VStack(alignment: .trailing, spacing: 4) {
                Text(statusText)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundStyle(statusColor)

                SignalIndicatorView(state: state)
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 16)
        .background(
            LinearGradient(
                colors: [Color.appSurface, Color.appBackground],
                startPoint: .top,
                endPoint: .bottom
            )
        )
        .overlay(alignment: .bottom) {
            Rectangle()
                .fill(category.accentColor.opacity(0.3))
                .frame(height: 1)
        }
    }

    private var statusText: String {
        switch state {
        case .idle: return "Ready"
        case .transmitting: return "Transmitting"
        case .receiving: return "Receiving"
        }
    }

    private var statusColor: Color {
        switch state {
        case .idle: return .secondary
        case .transmitting: return .red
        case .receiving: return .green
        }
    }
}

#Preview {
    VStack(spacing: 0) {
        RadioPanelView(
            frequency: "118.300",
            state: .idle,
            category: .patternWork
        )

        RadioPanelView(
            frequency: "121.500",
            state: .transmitting,
            category: .emergency
        )

        RadioPanelView(
            frequency: "124.350",
            state: .receiving,
            category: .flightFollowing
        )
    }
    .preferredColorScheme(.dark)
}
