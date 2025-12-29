import SwiftUI

struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var viewModel = SettingsViewModel()
    @State private var showResetConfirmation = false
    @State private var showDemos = false
    @State private var showPhraseology = false

    var body: some View {
        NavigationStack {
            Form {
                // Progress Section
                Section {
                    progressRow(title: "Training Sessions", value: "\(viewModel.progress.totalSessions)", icon: "airplane")
                    progressRow(title: "Total Transmissions", value: "\(viewModel.progress.totalTransmissions)", icon: "waveform")
                    progressRow(title: "Last Session", value: viewModel.formattedLastSession, icon: "clock")
                } header: {
                    Label("Progress", systemImage: "chart.bar.fill")
                }

                // Learning Resources
                Section {
                    Button {
                        showDemos = true
                    } label: {
                        Label("Watch Demo Conversations", systemImage: "play.circle")
                    }

                    Button {
                        showPhraseology = true
                    } label: {
                        Label("Phraseology Reference", systemImage: "text.book.closed")
                    }
                } header: {
                    Label("Learning Resources", systemImage: "book.fill")
                }

                // Preferences Section
                Section {
                    Toggle(isOn: $viewModel.settings.hapticFeedbackEnabled) {
                        Label("Haptic Feedback", systemImage: "iphone.radiowaves.left.and.right")
                    }

                    Picker(selection: $viewModel.settings.preferredInputMode) {
                        ForEach(UserSettings.InputMode.allCases, id: \.self) { mode in
                            Label(mode.displayName, systemImage: mode.icon)
                                .tag(mode)
                        }
                    } label: {
                        Label("Preferred Input", systemImage: "keyboard")
                    }
                } header: {
                    Label("Preferences", systemImage: "gearshape.fill")
                }

                // Reset Section
                Section {
                    Button(role: .destructive) {
                        showResetConfirmation = true
                    } label: {
                        Label("Reset All Progress", systemImage: "arrow.counterclockwise")
                    }
                    .disabled(!viewModel.hasProgress)
                } footer: {
                    Text("This will reset all training sessions and transmission counts. This action cannot be undone.")
                }

                // About Section
                Section {
                    LabeledContent {
                        Text("1.0.0")
                            .foregroundStyle(.secondary)
                    } label: {
                        Label("Version", systemImage: "info.circle")
                    }

                    Link(destination: URL(string: "https://github.com")!) {
                        Label("View Source Code", systemImage: "chevron.left.forwardslash.chevron.right")
                    }

                    Link(destination: URL(string: "mailto:support@example.com")!) {
                        Label("Send Feedback", systemImage: "envelope")
                    }
                } header: {
                    Label("About", systemImage: "questionmark.circle.fill")
                }
            }
            .scrollContentBackground(.hidden)
            .background(Color.appBackground.ignoresSafeArea())
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") {
                        viewModel.saveSettings()
                        dismiss()
                    }
                    .fontWeight(.semibold)
                }
            }
            .confirmationDialog(
                "Reset Progress?",
                isPresented: $showResetConfirmation,
                titleVisibility: .visible
            ) {
                Button("Reset All Progress", role: .destructive) {
                    viewModel.resetProgress()
                    HapticManager.notification(.warning)
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("This will reset all your training sessions and transmission counts. This action cannot be undone.")
            }
            .onAppear {
                viewModel.reload()
            }
            .onChange(of: viewModel.settings.hapticFeedbackEnabled) { _, newValue in
                if newValue {
                    HapticManager.selection()
                }
            }
            .sheet(isPresented: $showDemos) {
                DemoListView()
            }
            .sheet(isPresented: $showPhraseology) {
                PhraseologyGuideView()
            }
        }
    }

    private func progressRow(title: String, value: String, icon: String) -> some View {
        LabeledContent {
            Text(value)
                .font(.headline)
                .foregroundStyle(.primary)
        } label: {
            Label(title, systemImage: icon)
        }
    }
}

#Preview {
    SettingsView()
        .preferredColorScheme(.dark)
}
