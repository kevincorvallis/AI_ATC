import Foundation

struct ATCResponse: Codable {
    let success: Bool
    let atcResponse: String?
    let hasFeedback: Bool?
    let error: String?

    enum CodingKeys: String, CodingKey {
        case success
        case atcResponse = "atc_response"
        case hasFeedback = "has_feedback"
        case error
    }
}
