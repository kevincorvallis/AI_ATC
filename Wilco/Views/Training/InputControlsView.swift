import SwiftUI

struct InputControlsView: View {
    @Bindable var viewModel: TrainingViewModel

    @FocusState private var isInputFocused: Bool

    var body: some View {
        HStack(spacing: 12) {
            // Voice Input Button
            voiceButton

            // Text Input Field
            textField

            // Transmit Button
            transmitButton
        }
    }

    // MARK: - Voice Button

    private var voiceButton: some View {
        Button {
            Task {
                await viewModel.toggleListening()
            }
        } label: {
            Image(systemName: viewModel.isListening ? "mic.fill" : "mic")
                .font(.title2)
                .foregroundStyle(viewModel.isListening ? .red : .blue)
                .frame(width: 48, height: 48)
                .background(
                    Circle()
                        .fill(Color.appSurfaceLight)
                        .overlay(
                            Circle()
                                .stroke(
                                    viewModel.isListening ? Color.red.opacity(0.5) : Color.clear,
                                    lineWidth: 2
                                )
                        )
                )
        }
        .disabled(!viewModel.canUseVoice && !viewModel.isListening)
        .opacity(viewModel.canUseVoice || viewModel.isListening ? 1.0 : 0.5)
        .animation(.easeInOut(duration: 0.2), value: viewModel.isListening)
    }

    // MARK: - Text Field

    private var textField: some View {
        TextField("Type your transmission...", text: $viewModel.currentInput)
            .textFieldStyle(.plain)
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(Color.appSurfaceLight)
            .clipShape(RoundedRectangle(cornerRadius: 24))
            .overlay(
                RoundedRectangle(cornerRadius: 24)
                    .stroke(isInputFocused ? Color.blue.opacity(0.5) : Color.clear, lineWidth: 2)
            )
            .focused($isInputFocused)
            .disabled(viewModel.isWaitingForResponse || viewModel.isListening)
            .submitLabel(.send)
            .onSubmit {
                if viewModel.canTransmit {
                    Task {
                        await viewModel.sendTransmission()
                    }
                }
            }
    }

    // MARK: - Transmit Button

    private var transmitButton: some View {
        Button {
            Task {
                await viewModel.sendTransmission()
            }
        } label: {
            Group {
                if viewModel.isWaitingForResponse {
                    ProgressView()
                        .progressViewStyle(.circular)
                        .tint(.white)
                } else {
                    Image(systemName: "paperplane.fill")
                        .font(.title3)
                }
            }
            .foregroundStyle(.white)
            .frame(width: 48, height: 48)
            .background(
                Circle()
                    .fill(viewModel.canTransmit ? Color.blue : Color.gray)
            )
        }
        .disabled(!viewModel.canTransmit)
        .animation(.easeInOut(duration: 0.2), value: viewModel.canTransmit)
    }
}

#Preview {
    VStack {
        Spacer()
        InputControlsView(viewModel: TrainingViewModel())
            .padding()
            .background(.ultraThinMaterial)
    }
    .background(Color.appBackground)
    .preferredColorScheme(.dark)
}
