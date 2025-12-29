import SwiftUI

/// Simplified pre-flight briefing view - shows only essential info
struct ScenarioBriefingView: View {
    let scenario: Scenario
    let onStart: (ScenarioBriefing) -> Void
    let onCancel: () -> Void

    @State private var briefing: ScenarioBriefing?

    private let briefingService = BriefingService.shared

    var body: some View {
        NavigationStack {
            ScrollView {
                if let briefing = briefing {
                    VStack(spacing: 20) {
                        // Header
                        headerSection(briefing)

                        // Your callsign - the most important thing to know
                        callsignCard(briefing)

                        // Quick ATIS summary
                        atisSummary(briefing)

                        // What you'll be doing
                        situationCard(briefing)

                        // Tip
                        tipCard

                        // Start button
                        startButton(briefing)
                    }
                    .padding()
                } else {
                    ProgressView("Preparing...")
                        .padding(.top, 100)
                }
            }
            .background(Color.appBackground.ignoresSafeArea())
            .navigationTitle("Briefing")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") {
                        onCancel()
                    }
                }
            }
        }
        .preferredColorScheme(.dark)
        .onAppear {
            briefing = briefingService.generateBriefing(for: scenario)
        }
    }

    // MARK: - Header

    private func headerSection(_ briefing: ScenarioBriefing) -> some View {
        HStack(spacing: 12) {
            Text(scenario.icon)
                .font(.largeTitle)

            VStack(alignment: .leading, spacing: 4) {
                Text(scenario.name)
                    .font(.title3)
                    .fontWeight(.bold)

                Text(scenario.description)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            DifficultyBadge(difficulty: scenario.difficulty)
        }
        .padding()
        .background(Color.appSurface)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Callsign Card (Most Important!)

    private func callsignCard(_ briefing: ScenarioBriefing) -> some View {
        VStack(spacing: 12) {
            Text("You are")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            Text(briefing.aircraft.callsign)
                .font(.system(size: 28, weight: .bold, design: .monospaced))
                .foregroundStyle(.blue)

            Text(briefing.aircraft.tailNumber)
                .font(.headline)
                .foregroundStyle(.blue.opacity(0.7))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 24)
        .background(Color.appSurface)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Simple ATIS Summary

    private func atisSummary(_ briefing: ScenarioBriefing) -> some View {
        HStack(spacing: 16) {
            // ATIS Letter
            VStack {
                Text("ATIS")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text(briefing.atis.identifier)
                    .font(.system(size: 32, weight: .bold))
                    .foregroundStyle(.green)
            }
            .frame(width: 60)

            Divider()
                .frame(height: 50)

            // Weather
            VStack(alignment: .leading, spacing: 4) {
                Label(briefing.atis.wind.description, systemImage: "wind")
                Label("Runway \(briefing.atis.activeRunway)", systemImage: "airplane.departure")
            }
            .font(.subheadline)
            .foregroundStyle(.secondary)

            Spacer()
        }
        .padding()
        .background(Color.appSurface)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Situation

    private func situationCard(_ briefing: ScenarioBriefing) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Situation", systemImage: "info.circle")
                .font(.headline)
                .foregroundStyle(.secondary)

            Text(briefing.situation)
                .font(.body)

            if let route = briefing.taxiRoute {
                Divider()
                    .padding(.vertical, 4)

                HStack {
                    Image(systemName: "location.fill")
                        .foregroundStyle(.blue)
                    Text("Start: \(route.from)")
                }
                .font(.subheadline)

                if let holdShort = route.holdShort, !holdShort.isEmpty {
                    HStack {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundStyle(.red)
                        Text("Hold Short: Runway \(holdShort.joined(separator: ", "))")
                            .fontWeight(.medium)
                    }
                    .font(.subheadline)
                }
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.appSurface)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Tip

    private var tipCard: some View {
        HStack(spacing: 12) {
            Image(systemName: "lightbulb.fill")
                .foregroundStyle(.yellow)
                .font(.title3)

            Text(scenario.tips)
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.yellow.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Start Button

    private func startButton(_ briefing: ScenarioBriefing) -> some View {
        Button {
            HapticManager.buttonTap()
            onStart(briefing)
        } label: {
            HStack {
                Image(systemName: "headphones")
                Text("Start Training")
                    .fontWeight(.semibold)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.green)
            .foregroundStyle(.white)
            .clipShape(RoundedRectangle(cornerRadius: 16))
        }
        .padding(.top, 8)
    }
}

#Preview {
    ScenarioBriefingView(
        scenario: ScenarioData.groundOperationsScenarios[0],
        onStart: { _ in },
        onCancel: {}
    )
}
