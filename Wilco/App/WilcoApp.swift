import SwiftUI

@main
struct WilcoApp: App {
    @State private var appViewModel = AppViewModel()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(appViewModel)
                .preferredColorScheme(.dark)
        }
    }
}
