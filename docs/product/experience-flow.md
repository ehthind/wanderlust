# Experience Flow

Wanderlust should feel editorial first and practical second, with the iPhone app acting as the primary guest surface.

## Core loop
`Discover -> Destination conviction -> Plan Trip -> Native trip workspace -> Flexible-month stay search -> Stay selection -> Inbox support`

## Primary screens
- Discover feed
- Destination guide
- Future trips
- Trip workspace
- Search
- Inbox

The current Discover implementation is a full-screen vertical feed on iPhone with local save state and curated destination cards that immediately route into trip planning. A left swipe on the active feed card opens the destination guide for that city while keeping the root tab chrome visible. The guide itself uses a standard top bar for back/save and a single bottom `Plan Trip` action instead of a hidden-tab adjacent surface.
