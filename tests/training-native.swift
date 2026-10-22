import Foundation

// The response generator needs only category cases. Keep these tests independent
// of SwiftUI so they can run without launching a simulator or using microphone/API.
enum Category { case patternWork, groundOperations, flightFollowing, emergency }

@main
struct DemoResponseChecks {
    static func main() {
        let demo = DemoModeService()
        let cases: [(String, Category, String)] = [
            ("Cleared for takeoff runway 27, N12345", .patternWork, "report downwind"),
            ("Cleared to land runway 27, N12345", .patternWork, "N12345, roger."),
            ("Ground N12345 ready to taxi", .groundOperations, "hold short runway 27"),
            ("Taxi via Alpha hold short runway 27, N12345", .groundOperations, "readback received"),
            ("N12345 holding short runway 27", .groundOperations, "contact tower 118.3"),
            ("Contact tower 118.3, N12345", .groundOperations, "frequency change approved")
        ]
        for (message, category, expected) in cases {
            let response = demo.generateResponse(for: message, category: category)
            precondition(response.contains(expected), "Unexpected response for \(message): \(response)")
        }
        print("Passed \(cases.count) native demo response checks")
    }
}
