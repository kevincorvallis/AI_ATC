import Speech
import AVFoundation

actor SpeechRecognitionService {
    static let shared = SpeechRecognitionService()

    private let speechRecognizer: SFSpeechRecognizer?
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private let audioEngine = AVAudioEngine()

    init(locale: Locale = .current) {
        self.speechRecognizer = SFSpeechRecognizer(locale: locale)
    }

    func requestAuthorization() async -> SFSpeechRecognizerAuthorizationStatus {
        await withCheckedContinuation { continuation in
            SFSpeechRecognizer.requestAuthorization { status in
                continuation.resume(returning: status)
            }
        }
    }

    func requestMicrophoneAuthorization() async -> Bool {
        await withCheckedContinuation { continuation in
            AVAudioApplication.requestRecordPermission { granted in
                continuation.resume(returning: granted)
            }
        }
    }

    func startRecognition() -> AsyncThrowingStream<String, Error> {
        AsyncThrowingStream { continuation in
            Task {
                do {
                    try await performRecognition { transcript in
                        continuation.yield(transcript)
                    } onFinish: {
                        continuation.finish()
                    }
                } catch {
                    continuation.finish(throwing: error)
                }
            }
        }
    }

    private func performRecognition(
        onTranscript: @escaping (String) -> Void,
        onFinish: @escaping () -> Void
    ) async throws {
        guard let speechRecognizer = speechRecognizer, speechRecognizer.isAvailable else {
            throw SpeechError.recognizerUnavailable
        }

        // Configure audio session
        let audioSession = AVAudioSession.sharedInstance()
        try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
        try audioSession.setActive(true, options: .notifyOthersOnDeactivation)

        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()

        guard let recognitionRequest = recognitionRequest else {
            throw SpeechError.requestCreationFailed
        }

        recognitionRequest.shouldReportPartialResults = true
        recognitionRequest.requiresOnDeviceRecognition = false

        let inputNode = audioEngine.inputNode
        let recordingFormat = inputNode.outputFormat(forBus: 0)

        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, _ in
            self.recognitionRequest?.append(buffer)
        }

        audioEngine.prepare()
        try audioEngine.start()

        recognitionTask = speechRecognizer.recognitionTask(with: recognitionRequest) { result, error in
            if let result = result {
                let transcript = result.bestTranscription.formattedString
                onTranscript(transcript)

                if result.isFinal {
                    self.stopRecognition()
                    onFinish()
                }
            }

            if error != nil {
                self.stopRecognition()
                onFinish()
            }
        }
    }

    nonisolated func stopRecognition() {
        Task {
            await performStop()
        }
    }

    private func performStop() {
        audioEngine.stop()
        audioEngine.inputNode.removeTap(onBus: 0)
        recognitionRequest?.endAudio()
        recognitionTask?.cancel()
        recognitionRequest = nil
        recognitionTask = nil

        // Deactivate audio session
        try? AVAudioSession.sharedInstance().setActive(false)
    }
}

enum SpeechError: Error, LocalizedError {
    case recognizerUnavailable
    case requestCreationFailed
    case notAuthorized
    case microphoneNotAuthorized

    var errorDescription: String? {
        switch self {
        case .recognizerUnavailable:
            return "Speech recognizer is not available"
        case .requestCreationFailed:
            return "Failed to create recognition request"
        case .notAuthorized:
            return "Speech recognition not authorized"
        case .microphoneNotAuthorized:
            return "Microphone access not authorized"
        }
    }

    var recoverySuggestion: String? {
        switch self {
        case .recognizerUnavailable:
            return "Try again later"
        case .requestCreationFailed:
            return "Restart the app and try again"
        case .notAuthorized:
            return "Enable speech recognition in Settings"
        case .microphoneNotAuthorized:
            return "Enable microphone access in Settings"
        }
    }
}
