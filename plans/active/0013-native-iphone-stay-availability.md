# 0013 Native iPhone Stay Availability and Selection

## Summary
Build Wanderlust as an iPhone-first product slice with a native SwiftUI app in `apps/ios`, a first-party Next.js API layer in `apps/web`, curated Expedia Rapid lodging availability for seeded destinations, and a trip workspace that ends at stay selection rather than checkout.

## Decisions
- `apps/ios` is the primary guest-facing product surface for this slice.
- `apps/web` remains the BFF for mobile and owns all provider access, Supabase writes, and workflow coordination.
- Flexible-month stay search persists `travelMonth`, `tripNights`, and `adults` on `trip_drafts`, generates weekend-biased exact windows, and blends Expedia results into one ranked list.
- The booking slice stops at `trip_selected_stays`; it does not create booking intents, run price checks, or collect payment.
- Guest continuity is device-local through the most recent `tripDraftId`.

## Progress
- [x] add the native iPhone app scaffold in `apps/ios` with a SwiftUI `TabView`, discover flow, trip workspace, fixture/live API clients, unit tests, and UI tests
- [x] extend shared schemas, env config, Supabase schema, and seeded destination data for stay-search preferences and selected stays
- [x] replace the placeholder booking provider with a real Expedia Rapid adapter using signature auth, curated region inventory, and normalized availability results
- [x] add workspace/discover/stay search/stay select JSON routes in `apps/web`
- [x] update repo docs so the iPhone-first runtime split and stay-selection flow are explicit
