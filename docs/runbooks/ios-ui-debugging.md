# iOS UI Debugging

Use this runbook before changing layout constants or adding one-off debug code in `apps/ios`.

## 1. Reproduce with controlled inputs
- Default to fixtures with `WANDERLUST_USE_FIXTURES=1`.
- Override Dynamic Type with `WANDERLUST_DYNAMIC_TYPE_SIZE`.
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
- Prefer fixing container structure, `safeAreaInset`, `contentMargins`, or section composition before tweaking raw constants.

## 4. Verify accessibility surfaces
- Run Accessibility Inspector on the destination guide and trip workspace after any UI change.
- Confirm toolbar actions, metadata rows, loading states, and error states expose stable labels or identifiers.
- At accessibility sizes, scroll to offscreen content and verify it stays reachable and unclipped.

## 5. Use simulator tooling intentionally
- Use slow animations only when checking transitions or gesture timing.
- Prefer simulator screenshots and UI tests over ad hoc `print` statements.
- When investigating a gesture bug, validate the same path in UI tests so the fix stays reproducible.
- Treat full-screen swipe recognizers as suspect until you have verified they do not block vertical scrolling, story-rail scrolling, toolbar buttons, or the bottom CTA.
