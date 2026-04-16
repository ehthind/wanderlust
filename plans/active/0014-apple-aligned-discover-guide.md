# 0014 Apple-Aligned Discover Guide Rebuild

## Summary
Rebuild the iPhone Discover destination guide around Apple-aligned layout rules while preserving Wanderlust's editorial feel. The guide now opens from a left swipe on the active Discover card, keeps tab chrome visible, uses safe-area-aware grouped content, and routes into the trip workspace through a single bottom CTA.

## Decisions
- Keep Discover as a full-screen vertical card feed on iPhone.
- Open the destination guide from a left swipe on the active card instead of the previous adjacent profile surface.
- Rebuild the guide layout around grouped sections, Dynamic Type, safe-area insets, and toolbar actions instead of edge-to-edge custom chrome.
- Keep `Save` in the top bar and `Plan Trip` as the only persistent bottom CTA.
- Use fixture-driven environment overrides and UI tests to validate loading, error, Dynamic Type, and trip-handoff states.

## Progress
- [x] remove the old adjacent profile surface and replace it with the rebuilt guide overlay
- [x] move Discover tab chrome back to the system `TabView`
- [x] rebuild the guide layout with adaptive metadata, editorial story rail, loading/error fallbacks, and safe-area-aware actions
- [x] add swipe-based guide entry, guide/back accessibility identifiers, and updated UI coverage
- [x] document the new Discover guide contract and iOS UI debugging workflow
