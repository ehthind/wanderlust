import SwiftUI

private enum WanderlustTabItem {
    static let accentColor = Color(red: 0.85, green: 0.74, blue: 0.49)
    static let discoverSymbol = "sparkles"
    static let tripsSymbol = "suitcase.rolling"
    static let searchSymbol = "magnifyingglass"
    static let inboxSymbol = "tray.full"

    static func title(for tab: AppState.Tab) -> String {
        switch tab {
        case .discover:
            "Discover"
        case .trips:
            "Trips"
        case .search:
            "Search"
        case .inbox:
            "Inbox"
        }
    }

    static func symbol(for tab: AppState.Tab) -> String {
        switch tab {
        case .discover:
            discoverSymbol
        case .trips:
            tripsSymbol
        case .search:
            searchSymbol
        case .inbox:
            inboxSymbol
        }
    }
}

struct WanderlustBottomShellMetrics {
    enum ContentMode {
        case labeled
        case iconOnly
    }

    let contentMode: ContentMode
    let shellHeight: CGFloat
    let bottomPadding: CGFloat
    let horizontalPadding: CGFloat
    let contentInset: CGFloat
    let groupTabWidth: CGFloat
    let topOrbSize: CGFloat
    let topPadding: CGFloat
    let topContentInset: CGFloat
    let groupSpacing: CGFloat
    let selectionInset: CGFloat

    static let `default` = Self(
        contentMode: .labeled,
        shellHeight: 46,
        bottomPadding: 12,
        horizontalPadding: 16,
        contentInset: 76,
        groupTabWidth: 60,
        topOrbSize: 46,
        topPadding: 10,
        topContentInset: 74,
        groupSpacing: 4,
        selectionInset: 4
    )

    static func resolve(for size: CGSize, dynamicTypeSize: DynamicTypeSize) -> Self {
        let contentMode: ContentMode =
            dynamicTypeSize.isAccessibilitySize || size.width < 390
            ? .iconOnly
            : .labeled

        let shellHeight: CGFloat = contentMode == .labeled ? 46 : 42
        let bottomPadding: CGFloat = size.height < 760 ? 18 : 22
        let horizontalPadding: CGFloat = size.width >= 430 ? 20 : 16
        let groupTabWidth: CGFloat = contentMode == .labeled ? 64 : 46
        let topOrbSize: CGFloat = contentMode == .labeled ? 46 : 44
        let topPadding: CGFloat = size.height < 760 ? 8 : 10
        let groupSpacing: CGFloat = 4
        let selectionInset: CGFloat = 4

        return Self(
            contentMode: contentMode,
            shellHeight: shellHeight,
            bottomPadding: bottomPadding,
            horizontalPadding: horizontalPadding,
            contentInset: shellHeight + bottomPadding + 18,
            groupTabWidth: groupTabWidth,
            topOrbSize: topOrbSize,
            topPadding: topPadding,
            topContentInset: topOrbSize + topPadding + 18,
            groupSpacing: groupSpacing,
            selectionInset: selectionInset
        )
    }

    var groupWidth: CGFloat {
        groupTabWidth * 3 + groupSpacing * 2 + selectionInset * 2
    }

    var groupContentHeight: CGFloat {
        shellHeight - selectionInset * 2
    }
}

private struct WanderlustBottomShellMetricsKey: EnvironmentKey {
    static let defaultValue = WanderlustBottomShellMetrics.default
}

extension EnvironmentValues {
    var wanderlustBottomShellMetrics: WanderlustBottomShellMetrics {
        get { self[WanderlustBottomShellMetricsKey.self] }
        set { self[WanderlustBottomShellMetricsKey.self] = newValue }
    }
}

@MainActor
final class DiscoverChromeState: ObservableObject {
    struct SaveCallToAction {
        let isSaved: Bool
        let accessibilityIdentifier: String
        let action: () -> Void
    }

    struct PlanTripCallToAction {
        let isPlanning: Bool
        let isEnabled: Bool
        let accessibilityIdentifier: String
        let action: () -> Void
    }

    @Published var saveCallToAction: SaveCallToAction?
    @Published var planTripCallToAction: PlanTripCallToAction?
}

struct WanderlustRootView: View {
    @ObservedObject var appState: AppState
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @State private var isDiscoverGuidePresented = false
    @StateObject private var discoverChromeState = DiscoverChromeState()

    var body: some View {
        GeometryReader { proxy in
            let metrics = WanderlustBottomShellMetrics.resolve(
                for: proxy.size,
                dynamicTypeSize: dynamicTypeSize
            )
            let showsRootChrome = appState.selectedTab != .discover || !isDiscoverGuidePresented

            ZStack {
                TabView(selection: $appState.selectedTab) {
                    DiscoverView(
                        appState: appState,
                        isGuidePresented: $isDiscoverGuidePresented,
                        chromeState: discoverChromeState
                    )
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
                .toolbar(.hidden, for: .tabBar)

                if showsRootChrome {
                    WanderlustRootChrome(
                        selectedTab: $appState.selectedTab,
                        metrics: metrics,
                        discoverSaveCallToAction: appState.selectedTab == .discover
                            ? discoverChromeState.saveCallToAction
                            : nil,
                        discoverPlanTripCallToAction: appState.selectedTab == .discover
                            ? discoverChromeState.planTripCallToAction
                            : nil
                    )
                    .padding(.horizontal, metrics.horizontalPadding)
                    .safeAreaPadding(.top, metrics.topPadding)
                    .safeAreaPadding(.bottom, metrics.bottomPadding)
                    .accessibilityElement(children: .contain)
                    .accessibilityIdentifier("shell.tab.container")
                    .zIndex(1)
                }
            }
            .environment(\.wanderlustBottomShellMetrics, metrics)
        }
        .tint(WanderlustTabItem.accentColor)
    }
}

private struct WanderlustRootChrome: View {
    @Binding var selectedTab: AppState.Tab
    let metrics: WanderlustBottomShellMetrics
    let discoverSaveCallToAction: DiscoverChromeState.SaveCallToAction?
    let discoverPlanTripCallToAction: DiscoverChromeState.PlanTripCallToAction?
    private let bottomRowHorizontalInset: CGFloat = 12

    var body: some View {
        VStack(spacing: 0) {
            Spacer()

            bottomRow
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var searchButton: some View {
        RootChromeSearchButton(
            selectedTab: $selectedTab,
            metrics: metrics
        )
    }

    private var groupedTabsSection: some View {
        RootChromeTabGroup(
            selectedTab: $selectedTab,
            metrics: metrics
        )
    }

    private var bottomRow: some View {
        HStack(alignment: .bottom, spacing: 12) {
            groupedTabsSection

            Spacer(minLength: 0)

            actionStack
        }
        .padding(.horizontal, bottomRowHorizontalInset)
    }

    private var actionStack: some View {
        VStack(spacing: 10) {
            searchButton

            if let discoverSaveCallToAction {
                DiscoverSaveButton(
                    isSaved: discoverSaveCallToAction.isSaved,
                    fontWeight: .medium,
                    accessibilityIdentifier: discoverSaveCallToAction.accessibilityIdentifier,
                    onTap: discoverSaveCallToAction.action
                )
            }

            if let discoverPlanTripCallToAction {
                DiscoverPlanTripButton(
                    isPlanning: discoverPlanTripCallToAction.isPlanning,
                    isEnabled: discoverPlanTripCallToAction.isEnabled,
                    accessibilityIdentifier: discoverPlanTripCallToAction.accessibilityIdentifier,
                    onTap: discoverPlanTripCallToAction.action
                )
            }
        }
    }
}

private struct RootChromeTabGroup: View {
    @Binding var selectedTab: AppState.Tab
    let metrics: WanderlustBottomShellMetrics

    @Environment(\.colorScheme) private var colorScheme
    @Namespace private var selectionNamespace

    private let groupedTabs: [AppState.Tab] = [.discover, .trips, .inbox]

    private var selectedGroupedTab: AppState.Tab? {
        groupedTabs.contains(selectedTab) ? selectedTab : nil
    }

    var body: some View {
        ZStack {
            groupShell
            selectionTrack
            buttonRow
        }
        .frame(width: metrics.groupWidth, height: metrics.shellHeight)
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("shell.tab.group")
        .accessibilityValue(metrics.contentMode == .labeled ? "labeled" : "iconOnly")
        .animation(.spring(response: 0.34, dampingFraction: 0.84), value: selectedTab)
    }

    @ViewBuilder
    private var groupShell: some View {
        if #available(iOS 26.0, *) {
            Capsule()
                .fill(.clear)
                .glassEffect(.regular.tint(groupShellTint).interactive(false), in: Capsule())
        } else {
            Capsule()
                .fill(.ultraThinMaterial)
                .overlay {
                    Capsule()
                        .strokeBorder(shellBorderColor, lineWidth: 1)
                }
                .shadow(color: Color.black.opacity(colorScheme == .dark ? 0.18 : 0.08), radius: 18, y: 8)
        }
    }

    private var selectionTrack: some View {
        HStack(spacing: metrics.groupSpacing) {
            ForEach(groupedTabs, id: \.self) { tab in
                selectionBackground(for: tab)
                    .frame(width: metrics.groupTabWidth, height: metrics.groupContentHeight)
            }
        }
        .padding(metrics.selectionInset)
        .allowsHitTesting(false)
    }

    private var buttonRow: some View {
        HStack(spacing: metrics.groupSpacing) {
            ForEach(groupedTabs, id: \.self) { tab in
                groupButton(for: tab)
            }
        }
        .padding(metrics.selectionInset)
    }

    @ViewBuilder
    private func selectionBackground(for tab: AppState.Tab) -> some View {
        if selectedGroupedTab == tab {
            selectedTabBackground
                .accessibilityElement()
                .accessibilityIdentifier("shell.tab.selection")
                .accessibilityLabel("Selected tab")
                .accessibilityValue(WanderlustTabItem.title(for: tab))
        } else {
            Color.clear
        }
    }

    private var selectedTabBackground: some View {
        Group {
            if #available(iOS 26.0, *) {
                Capsule()
                    .fill(.clear)
                    .glassEffect(.regular.tint(selectedShellTint).interactive(false), in: Capsule())
            } else {
                Capsule()
                    .fill(selectedShellTint.opacity(colorScheme == .dark ? 0.32 : 0.44))
                    .overlay {
                        Capsule()
                            .strokeBorder(selectionBorderColor, lineWidth: 1)
                    }
                    .shadow(color: Color.black.opacity(colorScheme == .dark ? 0.16 : 0.06), radius: 8, y: 4)
            }
        }
        .matchedGeometryEffect(
            id: "selected-tab",
            in: selectionNamespace,
            properties: .frame
        )
    }

    private func groupButton(for tab: AppState.Tab) -> some View {
        let isSelected = selectedTab == tab

        return Button {
            selectedTab = tab
        } label: {
            groupButtonLabel(for: tab, isSelected: isSelected)
                .frame(width: metrics.groupTabWidth, height: metrics.groupContentHeight)
                .contentShape(Capsule())
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier(accessibilityIdentifier(for: tab))
        .accessibilityLabel(WanderlustTabItem.title(for: tab))
        .accessibilityValue(isSelected ? "selected" : "not selected")
    }

    private func groupButtonLabel(for tab: AppState.Tab, isSelected: Bool) -> some View {
        Text(metrics.contentMode == .iconOnly ? compactTitle(for: tab) : WanderlustTabItem.title(for: tab))
            .font(
                .system(
                    size: metrics.contentMode == .iconOnly ? 12 : 14,
                    weight: isSelected ? .semibold : .regular,
                    design: .rounded
                )
            )
            .lineLimit(1)
            .minimumScaleFactor(0.76)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .foregroundStyle(isSelected ? Color.primary : Color.white.opacity(0.82))
    }

    private func compactTitle(for tab: AppState.Tab) -> String {
        switch tab {
        case .discover:
            "Disc"
        case .trips:
            "Trips"
        case .search:
            "Search"
        case .inbox:
            "Inbox"
        }
    }

    private var groupShellTint: Color {
        colorScheme == .dark ? Color.white.opacity(0.05) : Color.white.opacity(0.08)
    }

    private var inactiveShellTint: Color {
        colorScheme == .dark ? Color.white.opacity(0.03) : Color.white.opacity(0.06)
    }
    private var selectedShellTint: Color {
        Color(red: 0.95, green: 0.92, blue: 0.85).opacity(colorScheme == .dark ? 0.14 : 0.2)
    }

    private var shellBorderColor: Color {
        colorScheme == .dark ? Color.white.opacity(0.08) : Color.black.opacity(0.06)
    }

    private var selectionBorderColor: Color {
        colorScheme == .dark ? Color.white.opacity(0.1) : Color.white.opacity(0.18)
    }

    private func accessibilityIdentifier(for tab: AppState.Tab) -> String {
        switch tab {
        case .discover:
            "shell.tab.discover"
        case .trips:
            "shell.tab.trips"
        case .search:
            "shell.tab.search"
        case .inbox:
            "shell.tab.inbox"
        }
    }
}

private struct RootChromeSearchButton: View {
    @Binding var selectedTab: AppState.Tab
    let metrics: WanderlustBottomShellMetrics

    @Environment(\.colorScheme) private var colorScheme

    private var isSelected: Bool {
        selectedTab == .search
    }

    var body: some View {
        Group {
            if #available(iOS 26.0, *) {
                Button {
                    selectedTab = .search
                } label: {
                    searchLabel
                }
                .buttonBorderShape(.circle)
                .tint(isSelected ? selectedShellTint : inactiveShellTint)
                .if(isSelected) { view in
                    view.buttonStyle(.glassProminent)
                }
                .if(!isSelected) { view in
                    view.buttonStyle(.glass)
                }
            } else {
                Button {
                    selectedTab = .search
                } label: {
                    searchLabel
                }
                .buttonStyle(.plain)
                .background {
                    Circle()
                        .fill(.ultraThinMaterial)
                        .overlay {
                            if isSelected {
                                Circle()
                                    .fill(selectedShellTint.opacity(colorScheme == .dark ? 0.28 : 0.36))
                            }
                        }
                        .overlay {
                            Circle()
                                .strokeBorder(
                                    isSelected ? selectionBorderColor : shellBorderColor,
                                    lineWidth: 1
                                )
                        }
                }
                .shadow(color: Color.black.opacity(colorScheme == .dark ? 0.18 : 0.08), radius: 18, y: 8)
            }
        }
        .frame(width: metrics.topOrbSize, height: metrics.topOrbSize)
        .contentShape(Circle())
        .accessibilityIdentifier("shell.tab.search")
        .accessibilityLabel(WanderlustTabItem.title(for: .search))
        .accessibilityValue(isSelected ? "selected" : "not selected")
    }

    private var searchLabel: some View {
        Image(systemName: WanderlustTabItem.searchSymbol)
            .symbolRenderingMode(.hierarchical)
            .font(.system(size: 18, weight: isSelected ? .semibold : .medium))
            .foregroundStyle(isSelected ? Color.primary : Color.secondary)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var inactiveShellTint: Color {
        colorScheme == .dark ? Color.white.opacity(0.03) : Color.white.opacity(0.06)
    }

    private var selectedShellTint: Color {
        Color(red: 0.95, green: 0.92, blue: 0.85).opacity(colorScheme == .dark ? 0.14 : 0.2)
    }

    private var shellBorderColor: Color {
        colorScheme == .dark ? Color.white.opacity(0.08) : Color.black.opacity(0.06)
    }

    private var selectionBorderColor: Color {
        colorScheme == .dark ? Color.white.opacity(0.1) : Color.white.opacity(0.18)
    }
}

private extension View {
    @ViewBuilder
    func `if`<Content: View>(_ condition: Bool, transform: (Self) -> Content) -> some View {
        if condition {
            transform(self)
        } else {
            self
        }
    }
}
