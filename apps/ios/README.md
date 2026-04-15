# Wanderlust iOS

Native SwiftUI iPhone client for the Discover -> Plan Trip -> Stay Selection flow.

## Local commands
- `xcodegen generate`
- `open Wanderlust.xcodeproj`
- `xcodebuild test -project Wanderlust.xcodeproj -scheme Wanderlust -destination 'platform=iOS Simulator,name=iPhone 16'`

## Local API defaults
- Debug launches default to fixture mode.
- Set `WANDERLUST_USE_FIXTURES=0` to force the live client locally.
- When fixtures are disabled, the live client defaults to `http://127.0.0.1:3000`.
- Override the live endpoint with `WANDERLUST_API_BASE_URL`.
