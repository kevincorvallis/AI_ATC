import Speech
import AVFoundation

actor SpeechRecognitionService {
    static let shared = SpeechRecognitionService()

    private let speechRecognizer: SFSpeechRecognizer?
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private let audioEngine = AVAudioEngine()
    private var recognitionID = UUID()
    private var streamContinuation: AsyncThrowingStream<String, Error>.Continuation?
    private var hasInputTap = false

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
        performStop()
        let id = recognitionID
        return AsyncThrowingStream(bufferingPolicy: .bufferingNewest(1)) { continuation in
            streamContinuation = continuation
            continuation.onTermination = { [weak self] _ in
                Task { await self?.stopRecognition(id: id) }
            }
            do {
                try performRecognition(id: id)
            } catch {
                continuation.finish(throwing: error)
                performStop()
            }
        }
    }

    private func performRecognition(id: UUID) throws {
        guard SFSpeechRecognizer.authorizationStatus() == .authorized else {
            throw SpeechError.notAuthorized
        }
        guard AVAudioApplication.shared.recordPermission == .granted else {
            throw SpeechError.microphoneNotAuthorized
        }
        guard let speechRecognizer, speechRecognizer.isAvailable else {
            throw SpeechError.recognizerUnavailable
        }
        let audioSession = AVAudioSession.sharedInstance()
        try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
        try audioSession.setActive(true, options: .notifyOthersOnDeactivation)

        let request = SFSpeechAudioBufferRecognitionRequest()
        recognitionRequest = request
        request.shouldReportPartialResults = true
        request.requiresOnDeviceRecognition = false

        let inputNode = audioEngine.inputNode
        let recordingFormat = inputNode.outputFormat(forBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, _ in
            request.append(buffer)
        }
        hasInputTap = true
        audioEngine.prepare()
        try audioEngine.start()

        recognitionTask = speechRecognizer.recognitionTask(with: request) { result, error in
            Task { self.handleResult(result, error: error, id: id) }
        }
    }

    private func handleResult(_ result: SFSpeechRecognitionResult?, error: Error?, id: UUID) {
        guard recognitionID == id else { return }
        if let result {
            streamContinuation?.yield(result.bestTranscription.formattedString)
            if result.isFinal {
                performStop()
                return
            }
        }
        if let error {
            streamContinuation?.finish(throwing: error)
            performStop()
        }
    }

    private func stopRecognition(id: UUID) {
        guard recognitionID == id else { return }
        performStop()
    }

    nonisolated func stopRecognition() {
        Task { await performStop() }
    }

    private func performStop() {
        recognitionID = UUID()
        audioEngine.stop()
        if hasInputTap {
            audioEngine.inputNode.removeTap(onBus: 0)
            hasInputTap = false
        }
        recognitionRequest?.endAudio()
        recognitionTask?.cancel()
        recognitionRequest = nil
        recognitionTask = nil
        streamContinuation?.finish()
        streamContinuation = nil
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
