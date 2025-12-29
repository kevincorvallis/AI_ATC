import SwiftUI
import Speech
import AVFoundation

@MainActor
@Observable
final class RadioSimulatorViewModel {
    // State
    var isTransmitting: Bool = false
    var isReceiving: Bool = false
    var isProcessing: Bool = false
    var isMuted: Bool = false

    var frequency: String = "118.300"
    var currentTranscript: String = ""
    var lastPilotMessage: String?
    var lastATCMessage: String?

    // Briefing data
    private(set) var briefing: ScenarioBriefing?
    private var scenario: Scenario?
    private var conversationHistory: [ConversationEntry] = []

    // Computed properties for UI
    var callsign: String {
        briefing?.aircraft.callsign ?? "Cessna 12345"
    }

    var suggestions: [String] {
        guard let briefing = briefing else {
            return scenario?.suggestions ?? []
        }

        // Limit suggestions based on difficulty
        let count = briefing.helpLevel.suggestionChipCount
        if count == 0 {
            return []
        }

        // Generate context-aware suggestions
        return generateSmartSuggestions(briefing: briefing).prefix(count).map { $0 }
    }

    // Services
    private let speechService = SpeechRecognitionService.shared
    private let voiceService = ATCVoiceService.shared
    private let apiService = ATCAPIService.shared
    private let demoService = DemoModeService()
    private let networkMonitor = NetworkMonitor.shared
    private let storageService = StorageService.shared

    private var progress: UserProgress

    init() {
        self.progress = storageService.loadProgress()
    }

    // MARK: - Session Management

    func startSession(briefing: ScenarioBriefing) {
        self.briefing = briefing
        self.scenario = briefing.scenario
        self.frequency = briefing.scenario.category.frequency
        self.conversationHistory = []
        self.lastPilotMessage = nil
        self.lastATCMessage = nil
        self.currentTranscript = ""

        // Increment session count
        progress.incrementSession()
        storageService.saveProgress(progress)

        // Request permissions
        Task {
            _ = await speechService.requestAuthorization()
            _ = await speechService.requestMicrophoneAuthorization()
        }

        // Initial ATC greeting (if appropriate)
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
            self?.playInitialGreeting()
        }
    }

    /// Legacy method for scenarios without briefing
    func startSession(scenario: Scenario) {
        self.scenario = scenario
        self.frequency = scenario.category.frequency
        self.conversationHistory = []
        self.lastPilotMessage = nil
        self.lastATCMessage = nil
        self.currentTranscript = ""

        progress.incrementSession()
        storageService.saveProgress(progress)

        Task {
            _ = await speechService.requestAuthorization()
            _ = await speechService.requestMicrophoneAuthorization()
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
            self?.playInitialGreeting()
        }
    }

    func endSession() {
        voiceService.stopSpeaking()
        speechService.stopRecognition()
        isTransmitting = false
        isReceiving = false
    }

    private func playInitialGreeting() {
        guard let scenario = scenario else { return }

        // For some scenarios, ATC speaks first
        let greeting: String?
        switch scenario.id {
        case "ground_first_taxi", "ground_complex_taxi":
            greeting = nil // Pilot initiates
        case "ff_traffic_advisories":
            greeting = "\(callsign), traffic, 2 o'clock, 3 miles, opposite direction, altitude indicates 5,500."
        default:
            greeting = nil
        }

        if let greeting = greeting {
            receiveATCResponse(greeting)
        }
    }

    // MARK: - Smart Suggestions

    private func generateSmartSuggestions(briefing: ScenarioBriefing) -> [String] {
        let callsign = briefing.aircraft.callsign
        let atis = briefing.atis

        switch briefing.scenario.category {
        case .groundOperations:
            if let route = briefing.taxiRoute {
                if lastATCMessage == nil {
                    // Initial contact
                    return [
                        "Metro Ground, \(callsign), at the \(route.from), ready to taxi with information \(atis.identifier)",
                        "Metro Ground, \(callsign), at \(route.from), VFR departure with \(atis.identifier)"
                    ]
                } else if lastATCMessage?.lowercased().contains("taxi") == true {
                    // Readback taxi clearance
                    return [
                        "Taxi to runway \(atis.activeRunway) via \(route.via.joined(separator: ", ")), hold short runway \(atis.activeRunway), \(callsign)",
                        "\(callsign), taxi via \(route.via.joined(separator: ", "))"
                    ]
                } else {
                    return [
                        "\(callsign), holding short runway \(atis.activeRunway)",
                        "\(callsign), ready for departure"
                    ]
                }
            }

        case .patternWork:
            if lastATCMessage == nil {
                return [
                    "Metro Tower, \(callsign), ready for departure runway \(atis.activeRunway), remaining in the pattern",
                    "Metro Tower, \(callsign), ready for takeoff runway \(atis.activeRunway)"
                ]
            } else if lastATCMessage?.lowercased().contains("cleared") == true {
                return [
                    "Cleared for takeoff runway \(atis.activeRunway), \(callsign)",
                    "\(callsign), rolling"
                ]
            } else {
                return [
                    "Metro Tower, \(callsign), left downwind runway \(atis.activeRunway)",
                    "Metro Tower, \(callsign), turning base runway \(atis.activeRunway)"
                ]
            }

        case .flightFollowing:
            if lastATCMessage == nil {
                return [
                    "Seattle Approach, \(callsign), request VFR flight following",
                    "\(callsign), level 4,500, request flight following to Portland"
                ]
            } else {
                return [
                    "\(callsign), traffic in sight",
                    "\(callsign), looking for traffic"
                ]
            }

        case .emergency:
            if lastATCMessage == nil {
                return [
                    "Mayday mayday mayday, \(callsign), engine failure",
                    "Pan pan pan pan pan, \(callsign), minimum fuel"
                ]
            } else {
                return [
                    "\(callsign), 2 souls on board, 2 hours fuel",
                    "\(callsign), airport in sight"
                ]
            }
        }

        // Fallback to scenario suggestions
        return briefing.scenario.suggestions
    }

    // MARK: - Transmission

    func startTransmitting() {
        guard !isReceiving, !isProcessing else { return }

        isTransmitting = true
        currentTranscript = ""

        HapticManager.transmit()

        // Start listening
        Task {
            do {
                for try await transcript in await speechService.startRecognition() {
                    self.currentTranscript = transcript
                }
            } catch {
                print("Speech recognition error: \(error)")
            }
        }
    }

    func stopTransmitting() {
        guard isTransmitting else { return }

        isTransmitting = false
        speechService.stopRecognition()

        HapticManager.impact(.light)

        // Process the transmission
        let message = currentTranscript.trimmingCharacters(in: .whitespacesAndNewlines)

        if !message.isEmpty {
            sendTransmission(message)
        } else {
            currentTranscript = ""
        }
    }

    /// Send a text-based transmission (from suggestions)
    func sendTextTransmission(_ text: String) {
        guard !isReceiving, !isProcessing, !isTransmitting else { return }

        HapticManager.transmit()
        sendTransmission(text)
    }

    private func sendTransmission(_ message: String) {
        guard let scenario = scenario else { return }

        isProcessing = true
        lastPilotMessage = message
        currentTranscript = ""

        // Add to history
        conversationHistory.append(ConversationEntry(role: "user", content: message))

        // Track transmission
        progress.incrementTransmission(for: scenario.id)
        storageService.saveProgress(progress)

        // Build context for API
        let context = buildAPIContext()

        // Get ATC response
        Task {
            let response: String

            if networkMonitor.isConnected {
                do {
                    let result = try await apiService.sendTransmission(
                        scenario: scenario.category.rawValue,
                        message: message,
                        history: Array(conversationHistory.suffix(20)),
                        customSystemPrompt: context
                    )
                    response = result.atcResponse ?? demoService.generateResponse(for: message, category: scenario.category)
                } catch {
                    response = demoService.generateResponse(for: message, category: scenario.category)
                }
            } else {
                // Offline mode
                try? await Task.sleep(for: .milliseconds(500))
                response = demoService.generateResponse(for: message, category: scenario.category)
            }

            self.receiveATCResponse(response)
        }
    }

    /// Build additional context for the API based on briefing
    private func buildAPIContext() -> String? {
        guard let briefing = briefing else { return nil }

        var context = """
        Aircraft: \(briefing.aircraft.type.fullName) (\(briefing.aircraft.tailNumber))
        Callsign: \(briefing.aircraft.callsign)
        ATIS: Information \(briefing.atis.identifier)
        Active Runway: \(briefing.atis.activeRunway)
        Wind: \(briefing.atis.wind.description)
        """

        if let route = briefing.taxiRoute {
            context += """

            Taxi Route: From \(route.from) to \(route.to) via \(route.via.joined(separator: ", "))
            """
            if let holdShort = route.holdShort {
                context += "\nHold Short: Runway \(holdShort.joined(separator: ", "))"
            }
        }

        return context
    }

    private func receiveATCResponse(_ response: String) {
        isProcessing = false
        isReceiving = true

        // Replace generic callsign with actual callsign if present
        var personalizedResponse = response
        if let briefing = briefing {
            personalizedResponse = response
                .replacingOccurrences(of: "Cessna 12345", with: briefing.aircraft.callsign)
                .replacingOccurrences(of: "N12345", with: briefing.aircraft.tailNumber)
        }

        lastATCMessage = personalizedResponse

        // Add to history
        conversationHistory.append(ConversationEntry(role: "assistant", content: personalizedResponse))

        HapticManager.receive()

        // Speak the response
        if !isMuted {
            voiceService.speakATC(personalizedResponse) { [weak self] in
                Task { @MainActor in
                    self?.isReceiving = false
                }
            }
        } else {
            // If muted, just show for a few seconds
            Task { @MainActor [weak self] in
                try? await Task.sleep(for: .seconds(3))
                self?.isReceiving = false
            }
        }
    }

    // MARK: - Controls

    func toggleMute() {
        isMuted.toggle()
        if isMuted {
            voiceService.stopSpeaking()
        }
        HapticManager.selection()
    }
}
