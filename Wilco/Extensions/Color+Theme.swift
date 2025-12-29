import SwiftUI

extension Color {
    // App theme colors
    static let appBackground = Color(red: 0.06, green: 0.09, blue: 0.16)
    static let appSurface = Color(red: 0.1, green: 0.14, blue: 0.22)
    static let appSurfaceLight = Color(red: 0.15, green: 0.2, blue: 0.3)

    static let appPrimary = Color.blue
    static let appSecondary = Color(red: 0.58, green: 0.64, blue: 0.72)

    static let transmitRed = Color.red
    static let receiveGreen = Color.green

    // Message bubble colors
    static let pilotBubble = Color.blue
    static let atcBubble = Color(red: 0.2, green: 0.25, blue: 0.35)
    static let systemBubble = Color(red: 0.15, green: 0.18, blue: 0.25)
}

extension ShapeStyle where Self == Color {
    static var appBackground: Color { .appBackground }
    static var appSurface: Color { .appSurface }
}
