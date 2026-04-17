import SwiftUI

private enum WanderlustTabItem {
    static let discoverSymbol = "sparkles"
    static let tripsSymbol = "suitcase.rolling"
    static let searchSymbol = "magnifyingglass"
    static let inboxSymbol = "tray.full"
}

struct WanderlustRootView: View {
    @ObservedObject var appState: AppState

    var body: some View {
        TabView(selection: $appState.selectedTab) {
            DiscoverView(appState: appState)
                .tag(AppState.Tab.discover)
                .tabItem {
                    Label("Discover", systemImage: WanderlustTabItem.discoverSymbol)
                }

            TripsRootView(appState: appState)
                .tag(AppState.Tab.trips)
                .tabItem {
                    Label("Trips", systemImage: WanderlustTabItem.tripsSymbol)
                }

            PlaceholderScreen(
                title: "Search Will Become a Precision Tool",
                subtitle: "This slice keeps search secondary while Discover and the trip workspace become the primary booking path.",
                symbol: "magnifyingglass.circle"
            )
            .tag(AppState.Tab.search)
            .tabItem {
                Label("Search", systemImage: WanderlustTabItem.searchSymbol)
            }

            PlaceholderScreen(
                title: "Inbox Lands After Stay Selection",
                subtitle: "Support, concierge context, and booking recovery stay parked until the selected-stay handoff is in place.",
                symbol: "tray.full"
            )
            .tag(AppState.Tab.inbox)
            .tabItem {
                Label("Inbox", systemImage: WanderlustTabItem.inboxSymbol)
            }
        }
        .tint(Color(red: 0.85, green: 0.74, blue: 0.49))
    }
}
