# Wanderlust iOS

Native SwiftUI iPhone client for the Discover -> Plan Trip -> Stay Selection flow.

## Local commands
- `xcodegen generate --spec apps/ios/project.yml`
- `open apps/ios/Wanderlust.xcodeproj`
- `xcodebuild test -project apps/ios/Wanderlust.xcodeproj -scheme Wanderlust -destination 'platform=iOS Simulator,name=iPhone 16'`

## Local API defaults
- Debug launches default to fixture mode.
- Set `WANDERLUST_USE_FIXTURES=0` to force the live client locally.
- When fixtures are disabled, the live client defaults to `http://127.0.0.1:3000`.
- Override the live endpoint with `WANDERLUST_API_BASE_URL`.

## UI debugging
- Use Xcode Environment Overrides before touching layout constants. `WANDERLUST_DYNAMIC_TYPE_SIZE` accepts `xSmall`, `small`, `medium`, `large`, `xLarge`, `xxLarge`, `xxxLarge`, or `accessibility1` through `accessibility5`.
- Use `WANDERLUST_PROFILE_DELAY_MS` and `WANDERLUST_FAIL_PROFILE_DESTINATION_ID` with fixtures to hold loading states open or force a destination-guide failure.
- Inspect spacing and clipping with Xcode Debug View Hierarchy before changing padding or safe-area insets.
- Run Accessibility Inspector against the destination guide after layout changes, especially after Dynamic Type or toolbar updates.
- See [`docs/runbooks/ios-ui-debugging.md`](../../docs/runbooks/ios-ui-debugging.md) for the full workflow.
