# iOS UI Debugging

Use this runbook before changing layout constants or adding one-off debug code in `apps/ios`.

## 1. Reproduce with controlled inputs
- Default to fixtures with `WANDERLUST_USE_FIXTURES=1`.
- Override Dynamic Type with `WANDERLUST_DYNAMIC_TYPE_SIZE`.
- Use Xcode’s built-in alignment overlay when you need view-edge guides: `Debug > View Debugging > Show Alignment Rectangles`.
- Hold destination-guide loading states open with `WANDERLUST_PROFILE_DELAY_MS`.
- Force a guide failure with `WANDERLUST_FAIL_PROFILE_DESTINATION_ID`.

## 2. Check environment overrides in Xcode
- Use Xcode Environment Overrides for Dynamic Type, Increase Contrast, Reduce Motion, and light/dark appearance.
- Validate the Discover feed and destination guide on both `iPhone 16` and `iPhone 16 Pro Max`.
- Re-run at one accessibility size before accepting any spacing change.
- Confirm gesture-only entry is still clear in behavior: no visible guide CTA on the feed, left swipe to open, right swipe or back button to exit.

## 3. Inspect layout before editing code
- Use `Debug > View Debugging > Capture View Hierarchy` when content clips, overlaps the tab bar, or crowds the status area.
- Confirm safe-area insets, toolbar height, and bottom CTA placement from the hierarchy before changing padding.
- When the bug looks like a bottom gap, clipped artwork, or bar overlap, inspect the tab bar host and its background first. Do not assume the card or scroll view is the layer that needs resizing.
- Keep page height and scroll snap math tied to the true viewport. Painting behind the tab bar by inflating card/page height is a regression risk because the next page can bleed into the current one.
- Prefer fixing container structure, `safeAreaInset`, `contentMargins`, or section composition before tweaking raw constants.
- Prefer built-in Xcode view debugging over temporary in-app overlays. App-side layout overlays are acceptable only for a tightly scoped investigation and should not become the default debug path.

## 4. Verify accessibility surfaces
- Run Accessibility Inspector on the destination guide and trip workspace after any UI change.
- Confirm toolbar actions, metadata rows, loading states, and error states expose stable labels or identifiers.
- At accessibility sizes, scroll to offscreen content and verify it stays reachable and unclipped.

## 5. Use simulator tooling intentionally
- Use slow animations only when checking transitions or gesture timing.
- Prefer simulator screenshots and UI tests over ad hoc `print` statements.
- When investigating a gesture bug, validate the same path in UI tests so the fix stays reproducible.
- Treat full-screen swipe recognizers as suspect until you have verified they do not block vertical scrolling, story-rail scrolling, toolbar buttons, or the bottom CTA.
- When a transparent or hidden tab bar background is part of the design, verify both states explicitly: the artwork should continue under the bar, and the visible bar controls should remain legible and tappable.
