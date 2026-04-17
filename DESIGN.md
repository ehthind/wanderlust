# Design

Wanderlust should feel editorial and high-taste first, then practical and actionable.

## Emotional order
1. Seduce me
2. Orient me
3. Help me act

## Primary navigation
- Discover
- Trips
- Search
- Inbox

## Core loop
`Discover -> Destination conviction -> Save or Plan -> Trip workspace -> Stay selection -> Inbox support`

## UX defaults
- Discovery is destination-first, not post-first.
- Destination profiles are editorial before they are factual.
- iPhone destination guides should use safe-area-aware layout, grouped content, Dynamic Type, and system toolbar/navigation patterns before custom chrome.
- Treat tab bar and safe-area problems as container-ownership problems first. Keep page snap height equal to the real viewport and adjust the bar/background layer before stretching feed pages or adding fake spacer chrome.
- If Discover artwork should read through the tab bar, keep the system tab bar visible and style its background appropriately instead of replacing it with a custom bottom bar.
- The Discover feed should support gesture-only entry into destination guides from a left swipe on the active card rather than a visible feed CTA.
- The guide should support both a visible back button and a right-swipe return into Discover while keeping a single bottom CTA.
- Gesture-heavy surfaces must preserve native priorities: vertical feed paging, horizontal editorial rails, toolbar actions, and bottom CTAs cannot be blocked by a full-screen swipe recognizer.
- Save flows stay lightweight.
- Planning is curated, not enterprise travel software.
- Booking enters after conviction, not at first touch.
