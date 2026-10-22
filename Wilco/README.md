# Wilco for iOS

A native SwiftUI preview for practicing ATC radio communications on iPhone and iPad. It includes **8 scenarios** across pattern work, ground operations, flight following, and emergencies, with voice input, spoken responses, scripted fallback, and local progress tracking.

Practice simulation only. It is not a navigation aid, real ATC, or a substitute for instruction.

## Open and build

Open the existing `Wilco.xcodeproj` in Xcode. The deployment target is iOS 17.0; no third-party packages are required. From the repository root, build without signing:

```sh
xcodebuild -project Wilco/Wilco.xcodeproj -scheme Wilco \
  -configuration Release -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath /tmp/wilco-build CODE_SIGNING_ALLOWED=NO build
```

Configure signing in Xcode before running on a physical device. Microphone and speech-recognition permission descriptions are included in `Info.plist`.

## Current status

The Release simulator build was verified with Xcode 27 for arm64 and x86_64. Sessions cancel pending responses and voice playback, reject stale callbacks, check speech permissions, and identify scripted fallback when AI is unavailable. Speech recognition may use Apple's service; offline speech recognition is not guaranteed. The app stores settings and progress locally and does not save audio recordings.

The native preview still requires physical-device microphone and session-lifecycle testing, signed archive validation, and authentication integration with the protected backend before release. `Utilities/Constants.swift` currently contains the legacy API endpoint; configure it for your deployment. An unavailable endpoint falls back to scripted practice responses.

The public web demo has its own release process and does not require the native app.

## Regression checks

From the repository root:

```sh
swiftc Wilco/Services/DemoModeService.swift tests/training-native.swift \
  -o /tmp/wilco-demo-check
/tmp/wilco-demo-check
```

The six checks cover takeoff and landing readbacks, taxi requests and readbacks, and tower handoffs. They exercise the response generator without microphone access or network requests.

## Structure

- `App/`, `Views/`, `ViewModels/`: SwiftUI interface and session state
- `Services/`: API, voice, recognition, network, and persistence
- `Models/`, `Resources/`: scenario data, briefings, and assets
- `Utilities/`, `Extensions/`: configuration and shared helpers

MIT license.
