import AVFoundation
import SwiftUI

/// Handles text-to-speech for ATC responses with realistic radio voice
final class ATCVoiceService: NSObject, AVSpeechSynthesizerDelegate, @unchecked Sendable {
    static let shared = ATCVoiceService()

    private let synthesizer = AVSpeechSynthesizer()
    private var audioPlayer: AVAudioPlayer?

    // Published state for UI observation
    @MainActor var isSpeaking: Bool = false
    @MainActor var onFinishedSpeaking: (() -> Void)?

    override init() {
        super.init()
        synthesizer.delegate = self
        configureAudioSession()
    }

    private func configureAudioSession() {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
            try session.setActive(true)
        } catch {
            print("Failed to configure audio session: \(error)")
        }
    }

    // MARK: - Public API

    /// Speak ATC response with radio-style voice
    @MainActor
    func speakATC(_ text: String, completion: (() -> Void)? = nil) {
        // Stop any current speech
        if synthesizer.isSpeaking {
            synthesizer.stopSpeaking(at: .immediate)
        }

        onFinishedSpeaking = completion

        // Play radio click sound before speaking
        playRadioClick()

        // Small delay for radio click, then speak
        Task { @MainActor in
            try? await Task.sleep(for: .milliseconds(150))
            self.performSpeak(text)
        }
    }

    @MainActor
    private func performSpeak(_ text: String) {
        // Clean up text for speech (expand abbreviations)
        let cleanedText = prepareTextForSpeech(text)

        let utterance = AVSpeechUtterance(string: cleanedText)

        // Use a voice that sounds more like ATC
        // Prefer "Samantha" (US), "Daniel" (UK), or compact voices for robotic feel
        if let voice = AVSpeechSynthesisVoice(identifier: "com.apple.voice.compact.en-US.Samantha") {
            utterance.voice = voice
        } else if let voice = AVSpeechSynthesisVoice(language: "en-US") {
            utterance.voice = voice
        }

        // ATC-style delivery: slightly fast, clipped, professional
        utterance.rate = 0.52  // Slightly faster than normal (0.5 is default)
        utterance.pitchMultiplier = 0.95  // Slightly lower pitch
        utterance.volume = 0.9
        utterance.preUtteranceDelay = 0
        utterance.postUtteranceDelay = 0.1

        isSpeaking = true
        synthesizer.speak(utterance)
    }

    /// Stop speaking immediately
    @MainActor
    func stopSpeaking() {
        synthesizer.stopSpeaking(at: .immediate)
        isSpeaking = false
    }

    // MARK: - Text Processing

    /// Prepare text for natural speech (expand abbreviations, format numbers)
    private func prepareTextForSpeech(_ text: String) -> String {
        var result = text

        // Expand common ATC abbreviations
        let replacements: [(String, String)] = [
            ("RWY", "runway"),
            ("rwy", "runway"),
            ("TWR", "tower"),
            ("GND", "ground"),
            ("APP", "approach"),
            ("DEP", "departure"),
            ("CTR", "center"),
            ("VFR", "V F R"),
            ("IFR", "I F R"),
            ("ATIS", "A T I S"),
            ("NOTAM", "no tam"),
            ("kts", "knots"),
            ("ft", "feet"),
            ("ALT", "altitude"),
            ("HDG", "heading"),
            ("SQUAWK", "squawk"),
            ("xpdr", "transponder"),
        ]

        for (abbr, expansion) in replacements {
            result = result.replacingOccurrences(of: abbr, with: expansion)
        }

        // Format runway numbers for speech (27L -> "two seven left")
        result = formatRunwayNumbers(result)

        // Format altitudes (3,500 -> "three thousand five hundred")
        result = formatAltitudes(result)

        // Format headings (270 -> "two seven zero")
        result = formatHeadings(result)

        // Format frequencies (118.3 -> "one one eight point three")
        result = formatFrequencies(result)

        // Format callsigns (N12345 -> "november one two three four five")
        result = formatCallsigns(result)

        return result
    }

    private func formatRunwayNumbers(_ text: String) -> String {
        var result = text
        let pattern = "runway\\s*(\\d{1,2})\\s*([LRC]?)"
        if let regex = try? NSRegularExpression(pattern: pattern, options: .caseInsensitive) {
            let range = NSRange(result.startIndex..., in: result)
            let matches = regex.matches(in: result, range: range)

            for match in matches.reversed() {
                if let numberRange = Range(match.range(at: 1), in: result) {
                    let number = String(result[numberRange])
                    let spoken = number.map { spokenDigit($0) }.joined(separator: " ")

                    var suffix = ""
                    if let suffixRange = Range(match.range(at: 2), in: result) {
                        let suffixChar = String(result[suffixRange]).uppercased()
                        if suffixChar == "L" { suffix = " left" }
                        else if suffixChar == "R" { suffix = " right" }
                        else if suffixChar == "C" { suffix = " center" }
                    }

                    if let fullRange = Range(match.range, in: result) {
                        result.replaceSubrange(fullRange, with: "runway \(spoken)\(suffix)")
                    }
                }
            }
        }
        return result
    }

    private func formatAltitudes(_ text: String) -> String {
        // This is simplified - could be more sophisticated
        var result = text
        // Format "X,XXX" altitudes
        let pattern = "(\\d{1,2}),?(\\d{3})\\s*(?:feet|ft)?"
        if let regex = try? NSRegularExpression(pattern: pattern, options: []) {
            let range = NSRange(result.startIndex..., in: result)
            let matches = regex.matches(in: result, range: range)

            for match in matches.reversed() {
                if let fullRange = Range(match.range, in: result),
                   let thousandsRange = Range(match.range(at: 1), in: result),
                   let hundredsRange = Range(match.range(at: 2), in: result) {
                    let thousands = String(result[thousandsRange])
                    let hundreds = String(result[hundredsRange])

                    var spoken = "\(spokenNumber(Int(thousands) ?? 0)) thousand"
                    if hundreds != "000" {
                        let h = Int(hundreds) ?? 0
                        if h > 0 {
                            spoken += " \(spokenNumber(h))"
                        }
                    }

                    result.replaceSubrange(fullRange, with: spoken)
                }
            }
        }
        return result
    }

    private func formatHeadings(_ text: String) -> String {
        var result = text
        let pattern = "heading\\s*(\\d{3})"
        if let regex = try? NSRegularExpression(pattern: pattern, options: .caseInsensitive) {
            let range = NSRange(result.startIndex..., in: result)
            let matches = regex.matches(in: result, range: range)

            for match in matches.reversed() {
                if let fullRange = Range(match.range, in: result),
                   let numberRange = Range(match.range(at: 1), in: result) {
                    let number = String(result[numberRange])
                    let spoken = number.map { spokenDigit($0) }.joined(separator: " ")
                    result.replaceSubrange(fullRange, with: "heading \(spoken)")
                }
            }
        }
        return result
    }

    private func formatFrequencies(_ text: String) -> String {
        var result = text
        let pattern = "(\\d{3})\\.(\\d{1,3})"
        if let regex = try? NSRegularExpression(pattern: pattern, options: []) {
            let range = NSRange(result.startIndex..., in: result)
            let matches = regex.matches(in: result, range: range)

            for match in matches.reversed() {
                if let fullRange = Range(match.range, in: result),
                   let wholeRange = Range(match.range(at: 1), in: result),
                   let decimalRange = Range(match.range(at: 2), in: result) {
                    let whole = String(result[wholeRange])
                    let decimal = String(result[decimalRange])

                    let spokenWhole = whole.map { spokenDigit($0) }.joined(separator: " ")
                    let spokenDecimal = decimal.map { spokenDigit($0) }.joined(separator: " ")

                    result.replaceSubrange(fullRange, with: "\(spokenWhole) point \(spokenDecimal)")
                }
            }
        }
        return result
    }

    private func formatCallsigns(_ text: String) -> String {
        var result = text
        // N-numbers: N12345
        let pattern = "\\b([N])\\s*(\\d{3,5})\\s*([A-Z]?)\\b"
        if let regex = try? NSRegularExpression(pattern: pattern, options: []) {
            let range = NSRange(result.startIndex..., in: result)
            let matches = regex.matches(in: result, range: range)

            for match in matches.reversed() {
                if let fullRange = Range(match.range, in: result),
                   let numberRange = Range(match.range(at: 2), in: result) {
                    let number = String(result[numberRange])
                    let spokenNumber = number.map { spokenDigit($0) }.joined(separator: " ")

                    var suffix = ""
                    if let suffixRange = Range(match.range(at: 3), in: result) {
                        let s = String(result[suffixRange])
                        if !s.isEmpty {
                            suffix = " \(phoneticLetter(s))"
                        }
                    }

                    result.replaceSubrange(fullRange, with: "november \(spokenNumber)\(suffix)")
                }
            }
        }
        return result
    }

    private func spokenDigit(_ char: Character) -> String {
        switch char {
        case "0": return "zero"
        case "1": return "one"
        case "2": return "two"
        case "3": return "three"
        case "4": return "four"
        case "5": return "five"
        case "6": return "six"
        case "7": return "seven"
        case "8": return "eight"
        case "9": return "niner"
        default: return String(char)
        }
    }

    private func spokenNumber(_ num: Int) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .spellOut
        return formatter.string(from: NSNumber(value: num)) ?? "\(num)"
    }

    private func phoneticLetter(_ letter: String) -> String {
        let phonetic: [String: String] = [
            "A": "alpha", "B": "bravo", "C": "charlie", "D": "delta",
            "E": "echo", "F": "foxtrot", "G": "golf", "H": "hotel",
            "I": "india", "J": "juliet", "K": "kilo", "L": "lima",
            "M": "mike", "N": "november", "O": "oscar", "P": "papa",
            "Q": "quebec", "R": "romeo", "S": "sierra", "T": "tango",
            "U": "uniform", "V": "victor", "W": "whiskey", "X": "x-ray",
            "Y": "yankee", "Z": "zulu"
        ]
        return phonetic[letter.uppercased()] ?? letter.lowercased()
    }

    // MARK: - Sound Effects

    private func playRadioClick() {
        // Generate a simple radio click sound
        // In production, you'd use actual audio files
        AudioServicesPlaySystemSound(1104) // Subtle tick sound
    }

    func playRadioStatic() {
        AudioServicesPlaySystemSound(1105)
    }

    // MARK: - AVSpeechSynthesizerDelegate

    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        Task { @MainActor in
            self.isSpeaking = false
            // Play ending radio click
            AudioServicesPlaySystemSound(1104)
            self.onFinishedSpeaking?()
        }
    }

    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) {
        Task { @MainActor in
            self.isSpeaking = false
        }
    }
}
