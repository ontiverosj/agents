# Phone Diagnostics

A native iPhone app (SwiftUI) that shows a live health dashboard for your phone
and tells you, in plain English, what to do about anything it finds.

## What it measures

| Metric | Why it matters |
| --- | --- |
| Battery charge, charging state, Low Power Mode | Low Power Mode deliberately slows the CPU — a common hidden cause of "my phone is slow" |
| Thermal state | When the phone runs hot, iOS throttles performance. This shows whether throttling is happening *right now* |
| Free / total storage | Below ~5–10 GB free, iOS gets sluggish and apps freeze or crash |
| RAM available / in use / wired | High memory pressure explains app freezes and reloads |
| System-wide CPU load | A stuck background task pegging the CPU makes everything laggy |
| Uptime since last restart | Weeks without a reboot is the #1 fixable cause of freezing |
| Device model + iOS version | Context for everything above |

The "What to do" section turns those readings into concrete recommendations
(restart, free storage, cool down, disable Low Power Mode, etc.) and the
dashboard auto-refreshes every 3 seconds.

## What iOS does NOT let any app measure

Apple's sandbox blocks third-party apps from reading battery health / cycle
count, per-app CPU or memory usage, and actual temperatures in degrees. For
battery health use Settings > Battery > Battery Health & Charging.
No App Store app can measure these either — anything claiming to is guessing.

## Building and installing (requires a Mac)

iPhone apps can only be built with Xcode on macOS. One-time setup:

1. Install **Xcode** from the Mac App Store (free, Xcode 16 or newer).
2. Open `PhoneDiagnostics.xcodeproj` in Xcode.
3. Select the **PhoneDiagnostics** project in the sidebar → the
   **PhoneDiagnostics** target → **Signing & Capabilities** tab:
   - Check **Automatically manage signing**.
   - Under **Team**, sign in with your Apple ID (a free account works).
   - Change **Bundle Identifier** from `com.example.PhoneDiagnostics` to
     something unique to you, e.g. `com.yourname.PhoneDiagnostics`.
4. Plug your iPhone into the Mac with a cable and tap **Trust** on the phone.
5. In your iPhone's Settings, enable **Privacy & Security > Developer Mode**
   (the phone will restart).
6. In Xcode's toolbar, select your iPhone as the run destination, then press
   **Run** (⌘R).
7. First launch only: on the phone go to **Settings > General >
   VPN & Device Management** and trust your developer certificate.

**Note on free Apple accounts:** apps signed with a free Apple ID expire after
7 days — just press Run again from Xcode to reinstall. A paid Apple Developer
account ($99/yr) extends this to a year and allows App Store distribution.

## Project layout

```
PhoneDiagnostics/
├── PhoneDiagnostics.xcodeproj/      Xcode project (synchronized folder format)
└── PhoneDiagnostics/
    ├── PhoneDiagnosticsApp.swift    App entry point
    ├── DiagnosticsModel.swift       Reads battery/thermal/storage/memory/CPU data
    └── ContentView.swift            Dashboard UI
```

No third-party dependencies — only Apple frameworks (SwiftUI, UIKit, Mach APIs).
