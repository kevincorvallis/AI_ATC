# Wilco - ATC Radio Training for iOS

A native iOS app for practicing Air Traffic Control radio communications. Built with SwiftUI for iPhone and iPad.

## Features

- **20 Training Scenarios** across 4 categories:
  - Pattern Work (traffic patterns at towered airports)
  - Ground Operations (taxi and ground control)
  - Flight Following (VFR radar services)
  - Emergency Procedures (emergency communications)

- **Voice Input** - Speak your transmissions using the built-in microphone
- **AI-Powered ATC** - Realistic ATC responses powered by GPT-4
- **Offline Demo Mode** - Practice without internet connection
- **Progress Tracking** - Track your sessions and transmissions
- **iPad Optimized** - Sidebar navigation on larger screens

## Requirements

- iOS 17.0+
- Xcode 15.0+
- Swift 5.9+

## Setup Instructions

### 1. Create Xcode Project

1. Open Xcode
2. File → New → Project
3. Select "App" under iOS
4. Configure:
   - Product Name: `Wilco`
   - Organization Identifier: `com.yourname`
   - Interface: SwiftUI
   - Language: Swift
   - Minimum Deployment: iOS 17.0
   - Check "Include Tests" if desired

### 2. Add Source Files

1. Delete the auto-generated `ContentView.swift`
2. Drag and drop all folders from this `Wilco/` directory into your Xcode project:
   - `App/`
   - `Models/`
   - `ViewModels/`
   - `Services/`
   - `Views/`
   - `Resources/`
   - `Extensions/`
   - `Utilities/`
3. Make sure "Copy items if needed" is checked
4. Select "Create groups" for added folders

### 3. Configure Info.plist

The `Info.plist` file contains required privacy descriptions for:
- Microphone access
- Speech recognition

Either:
- Replace the auto-generated Info.plist with the one in this folder, OR
- Add these keys manually in Xcode's Info tab

### 4. Create Assets

In `Assets.xcassets`, create:

**AppIcon** - Your app icon (1024x1024 for App Store)

**Colors**:
- `LaunchBackground` - Dark blue (#0f172a)
- `AccentColor` - Blue (#3b82f6)

### 5. Build and Run

1. Select your target device (iPhone or iPad simulator)
2. Press Cmd+R to build and run

## Architecture

```
Wilco/
├── App/                 # App entry point
├── Models/              # Data models (Category, Scenario, Message)
├── ViewModels/          # MVVM view models with @Observable
├── Services/            # API, Speech, Storage, Network services
├── Views/               # SwiftUI views organized by feature
├── Resources/           # Scenario data
├── Extensions/          # Color theme extensions
└── Utilities/           # Constants, HapticManager
```

## API Integration

The app connects to the existing AWS Lambda backend:
```
POST https://3zk0d6e54l.execute-api.us-east-1.amazonaws.com/atc
```

When offline, the app automatically falls back to demo mode with pattern-matched responses.

## Key Technologies

- **SwiftUI** with iOS 17 features (@Observable, NavigationSplitView)
- **Speech Framework** for voice input
- **Async/await** for networking
- **MVVM Architecture** with dependency injection
- **UserDefaults** for local persistence

## License

MIT License - Feel free to use and modify for your own projects.
