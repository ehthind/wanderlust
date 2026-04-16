import SwiftUI

struct WanderlustRootView: View {
    @ObservedObject var appState: AppState

    private var showsTabBar: Bool {
        !(appState.selectedTab == .discover && appState.discoverSurface == .profile)
    }

    var body: some View {
        ZStack {
            Color.black
                .ignoresSafeArea()

            TabView(selection: $appState.selectedTab) {
                DiscoverView(appState: appState)
                    .tag(AppState.Tab.discover)

                TripsRootView(appState: appState)
                    .tag(AppState.Tab.trips)

                PlaceholderScreen(
                    title: "Search Will Become a Precision Tool",
                    subtitle: "This slice keeps search secondary while Discover and the trip workspace become the primary booking path.",
                    symbol: "magnifyingglass.circle"
                )
                .tag(AppState.Tab.search)

                PlaceholderScreen(
                    title: "Inbox Lands After Stay Selection",
                    subtitle: "Support, concierge context, and booking recovery stay parked until the selected-stay handoff is in place.",
                    symbol: "tray.full"
                )
                .tag(AppState.Tab.inbox)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .toolbar(.hidden, for: .tabBar)
        }
        .overlay(alignment: .bottom) {
            if showsTabBar {
                WanderlustTabBar(selectedTab: $appState.selectedTab)
                    .padding(.horizontal, 20)
                    .padding(.bottom, 14)
            }
        }
    }
}

private struct WanderlustTabBar: View {
    @Binding var selectedTab: AppState.Tab

    private let items: [(tab: AppState.Tab, title: String)] = [
        (.discover, "Discover"),
        (.trips, "Trips"),
        (.search, "Search"),
        (.inbox, "Inbox"),
    ]

    var body: some View {
        HStack(spacing: 6) {
            ForEach(items, id: \.tab) { item in
                Button {
                    selectedTab = item.tab
                } label: {
                    VStack(spacing: 6) {
                        Circle()
                            .fill(selectedTab == item.tab ? Color.white : Color.white.opacity(0.6))
                            .frame(width: 6, height: 6)

                        Text(item.title)
                            .font(.system(size: 10, weight: .light, design: .default))
                            .tracking(0.6)
                            .foregroundStyle(selectedTab == item.tab ? Color.white : Color.white.opacity(0.7))
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .frame(maxWidth: .infinity)
                    .background {
                        if selectedTab == item.tab {
                            Capsule(style: .continuous)
                                .fill(Color.black.opacity(0.18))
                        }
                    }
                    .shadow(color: Color.black.opacity(selectedTab == item.tab ? 0.22 : 0.14), radius: 10, y: 2)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier("tab.\(item.title.lowercased())")
            }
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
    }
}
