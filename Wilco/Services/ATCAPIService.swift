import Foundation

actor ATCAPIService {
    static let shared = ATCAPIService()

    private let baseURL: URL
    private let session: URLSession
    private let encoder: JSONEncoder
    private let decoder: JSONDecoder

    init(session: URLSession = .shared) {
        self.baseURL = URL(string: Constants.apiBaseURL)!
        self.session = session
        self.encoder = JSONEncoder()
        self.decoder = JSONDecoder()
    }

    func sendTransmission(
        scenario: String,
        message: String,
        history: [ConversationEntry],
        customSystemPrompt: String? = nil
    ) async throws -> ATCResponse {
        let request = ATCRequest(
            scenario: scenario,
            message: message,
            history: history,
            customSystemPrompt: customSystemPrompt
        )

        var urlRequest = URLRequest(url: baseURL)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.httpBody = try encoder.encode(request)
        urlRequest.timeoutInterval = Constants.requestTimeout

        let (data, response) = try await session.data(for: urlRequest)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw ATCAPIError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            throw ATCAPIError.httpError(statusCode: httpResponse.statusCode)
        }

        let atcResponse = try decoder.decode(ATCResponse.self, from: data)

        guard atcResponse.success else {
            throw ATCAPIError.apiError(message: atcResponse.error ?? "Unknown error")
        }

        return atcResponse
    }
}

enum ATCAPIError: Error, LocalizedError {
    case invalidResponse
    case httpError(statusCode: Int)
    case apiError(message: String)
    case networkUnavailable

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "Invalid response from server"
        case .httpError(let statusCode):
            return "Server error: \(statusCode)"
        case .apiError(let message):
            return message
        case .networkUnavailable:
            return "No network connection"
        }
    }

    var recoverySuggestion: String? {
        switch self {
        case .invalidResponse, .httpError:
            return "Please try again later"
        case .apiError:
            return "Check your transmission and try again"
        case .networkUnavailable:
            return "Check your internet connection"
        }
    }
}
