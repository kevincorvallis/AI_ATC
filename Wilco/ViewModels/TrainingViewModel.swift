import Foundation
import Speech

@Observable
final class TrainingViewModel {
    // Session state
    var scenario: Scenario?
    var messages: [Message] = []
    var currentInput: String = ""
    var isWaitingForResponse: Bool = false
    var transmissionState: TransmissionState = .idle
    var errorMessage: String?

    // Voice input state
    var isListening: Bool = false
    var voiceTranscript: String = ""
    var speechAuthStatus: SFSpeechRecognizerAuthorizationStatus = .notDetermined
    var microphoneAuthorized: Bool = false

    // Services
    private let apiService: ATCAPIService
    private let demoModeService: DemoModeService
    private let storageService: StorageService
    private let speechService: SpeechRecognitionService
    private let networkMonitor: NetworkMonitor

    // Progress tracking
    private var progress: UserProgress
    private var settings: UserSettings

    enum TransmissionState: Equatable {
        case idle
        case transmitting
        case receiving
    }

    init(
        apiService: ATCAPIService = .shared,
        demoModeService: DemoModeService = .init(),
        storageService: StorageService = .shared,
        speechService: SpeechRecognitionService = .shared,
        networkMonitor: NetworkMonitor = .shared
    ) {
        self.apiService = apiService
        self.demoModeService = demoModeService
        self.storageService = storageService
        self.speechService = speechService
        self.networkMonitor = networkMonitor
        self.progress = storageService.loadProgress()
        self.settings = storageService.loadSettings()
    }

    // MARK: - Session Management

    func startSession(with scenario: Scenario) {
        self.scenario = scenario
        self.messages = []
        self.currentInput = ""
        self.isWaitingForResponse = false
        self.transmissionState = .idle
        self.errorMessage = nil

        // Add system message with scenario info
        let systemMessage = Message(
            role: .system,
            content: """
            \(scenario.name)
            \(scenario.description)

            Conditions: \(scenario.conditions)

            Tip: \(scenario.tips)
            """
        )
        messages.append(systemMessage)

        // Track session
        progress.incrementSession()
        storageService.saveProgress(progress)

        // Haptic feedback
        if settings.hapticFeedbackEnabled {
            HapticManager.notification(.success)
        }
    }

    func endSession() {
        scenario = nil
        messages = []
        currentInput = ""
        isWaitingForResponse = false
        transmissionState = .idle
        stopListening()
    }

    // MARK: - Transmission

    func sendTransmission(_ text: String? = nil) async {
        let message = text ?? currentInput
        guard !message.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
              let scenario = scenario,
              !isWaitingForResponse else { return }

        // Clear input and update state
        await MainActor.run {
            currentInput = ""
            isWaitingForResponse = true
            transmissionState = .transmitting
            errorMessage = nil

            if settings.hapticFeedbackEnabled {
                HapticManager.transmit()
            }
        }

        // Add pilot message
        let pilotMessage = Message(role: .pilot, content: message)
        await MainActor.run {
            messages.append(pilotMessage)
        }

        // Build conversation history for API
        let history = buildConversationHistory()

        // Try API, fall back to demo mode
        if networkMonitor.isConnected {
            do {
                let response = try await apiService.sendTransmission(
                    scenario: scenario.category.rawValue,
                    message: message,
                    history: history
                )
                await handleATCResponse(response.atcResponse ?? "Radio temporarily unavailable.")
            } catch {
                // Fall back to demo mode on error
                let demoResponse = demoModeService.generateResponse(
                    for: message,
                    category: scenario.category
                )
                await handleATCResponse(demoResponse)
            }
        } else {
            // Offline: use demo mode
            let demoResponse = demoModeService.generateResponse(
                for: message,
                category: scenario.category
            )
            // Add small delay to simulate response time
            try? await Task.sleep(for: .milliseconds(600))
            await handleATCResponse(demoResponse)
        }
    }

    @MainActor
    private func handleATCResponse(_ response: String) {
        transmissionState = .receiving

        if settings.hapticFeedbackEnabled {
            HapticManager.receive()
        }

        let atcMessage = Message(role: .atc, content: response)
        messages.append(atcMessage)

        // Track transmission
        if let scenario = scenario {
            progress.incrementTransmission(for: scenario.id)
            storageService.saveProgress(progress)
        }

        // Reset state after delay
        Task {
            try? await Task.sleep(for: .seconds(1))
            await MainActor.run {
                transmissionState = .idle
                isWaitingForResponse = false
            }
        }
    }

    private func buildConversationHistory() -> [ConversationEntry] {
        messages
            .filter { $0.role != .system }
            .suffix(Constants.Limits.maxHistoryMessages)
            .map { ConversationEntry(role: $0.role.rawValue, content: $0.content) }
    }

    // MARK: - Suggestions

    func useSuggestion(_ suggestion: String) {
        currentInput = suggestion
        if settings.hapticFeedbackEnabled {
            HapticManager.selection()
        }
    }

    // MARK: - Voice Input

    func requestSpeechAuthorization() async {
        speechAuthStatus = await speechService.requestAuthorization()
        microphoneAuthorized = await speechService.requestMicrophoneAuthorization()
    }

    func toggleListening() async {
        if isListening {
            stopListening()
        } else {
            await startListening()
        }
    }

    func startListening() async {
        guard speechAuthStatus == .authorized, microphoneAuthorized else {
            errorMessage = "Speech recognition or microphone not authorized"
            return
        }

        await MainActor.run {
            isListening = true
            voiceTranscript = ""

            if settings.hapticFeedbackEnabled {
                HapticManager.impact(.medium)
            }
        }

        do {
            for try await transcript in await speechService.startRecognition() {
                await MainActor.run {
                    voiceTranscript = transcript
                    currentInput = transcript
                }
            }
        } catch {
            await MainActor.run {
                errorMessage = error.localizedDescription
            }
        }

        await MainActor.run {
            isListening = false
        }
    }

    func stopListening() {
        speechService.stopRecognition()
        isListening = false

        if settings.hapticFeedbackEnabled {
            HapticManager.impact(.light)
        }
    }

    // MARK: - Computed Properties

    var currentFrequency: String {
        scenario?.category.frequency ?? "118.300"
    }

    var suggestions: [String] {
        scenario?.suggestions ?? []
    }

    var canTransmit: Bool {
        !currentInput.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !isWaitingForResponse &&
        !isListening
    }

    var canUseVoice: Bool {
        speechAuthStatus == .authorized && microphoneAuthorized && !isWaitingForResponse
    }
}
