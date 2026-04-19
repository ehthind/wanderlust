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
    let searchOrbSize: CGFloat
    let groupGap: CGFloat
    let selectionInset: CGFloat

    static let `default` = Self(
        contentMode: .labeled,
        shellHeight: 46,
        bottomPadding: 12,
        horizontalPadding: 16,
        contentInset: 70,
        groupTabWidth: 70,
        searchOrbSize: 46,
        groupGap: 12,
        selectionInset: 3
    )

    static func resolve(for size: CGSize, dynamicTypeSize: DynamicTypeSize) -> Self {
        let contentMode: ContentMode =
            dynamicTypeSize.isAccessibilitySize || size.width < 390
            ? .iconOnly
            : .labeled

        let shellHeight: CGFloat = contentMode == .labeled ? 46 : 42
        let bottomPadding: CGFloat = size.height < 760 ? 10 : 12
        let horizontalPadding: CGFloat = size.width >= 430 ? 20 : 16
        let groupTabWidth: CGFloat = contentMode == .labeled ? 70 : 40
        let searchOrbSize: CGFloat = shellHeight
        let selectionInset: CGFloat = 3

        return Self(
            contentMode: contentMode,
            shellHeight: shellHeight,
            bottomPadding: bottomPadding,
            horizontalPadding: horizontalPadding,
            contentInset: shellHeight + bottomPadding + 12,
            groupTabWidth: groupTabWidth,
            searchOrbSize: searchOrbSize,
            groupGap: 12,
            selectionInset: selectionInset
        )
    }

    var groupWidth: CGFloat {
        groupTabWidth * 3 + selectionInset * 2
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

struct WanderlustRootView: View {
    @ObservedObject var appState: AppState
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @State private var isDiscoverGuidePresented = false

    var body: some View {
        GeometryReader { proxy in
            let metrics = WanderlustBottomShellMetrics.resolve(
                for: proxy.size,
                dynamicTypeSize: dynamicTypeSize
            )
            let showsBottomShell = appState.selectedTab != .discover || !isDiscoverGuidePresented

            ZStack(alignment: .bottom) {
                TabView(selection: $appState.selectedTab) {
                    DiscoverView(
                        appState: appState,
                        isGuidePresented: $isDiscoverGuidePresented
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
                .environment(\.wanderlustBottomShellMetrics, metrics)

                if showsBottomShell {
                    WanderlustBottomShell(
                        selectedTab: $appState.selectedTab,
                        metrics: metrics
                    )
                    .padding(.horizontal, metrics.horizontalPadding)
                    .safeAreaPadding(.bottom, metrics.bottomPadding)
                    .accessibilityElement(children: .contain)
                    .accessibilityIdentifier("shell.tab.container")
                    .zIndex(1)
                }
            }
        }
        .tint(WanderlustTabItem.accentColor)
    }
}

private struct WanderlustBottomShell: View {
    @Binding var selectedTab: AppState.Tab
    let metrics: WanderlustBottomShellMetrics

    @Environment(\.colorScheme) private var colorScheme
    @Namespace private var selectionNamespace

    private let groupedTabs: [AppState.Tab] = [.discover, .trips, .inbox]

    private var selectedGroupedTab: AppState.Tab? {
        groupedTabs.contains(selectedTab) ? selectedTab : nil
    }

    var body: some View {
        Group {
            if #available(iOS 26.0, *) {
                GlassEffectContainer(spacing: metrics.groupGap) {
                    shellContents
                }
            } else {
                shellContents
            }
        }
        .frame(maxWidth: .infinity, alignment: .bottomLeading)
        .animation(.spring(response: 0.34, dampingFraction: 0.84), value: selectedTab)
        .accessibilityElement(children: .contain)
    }

    private var shellContents: some View {
        HStack(alignment: .center, spacing: metrics.groupGap) {
            shellGroup
                .accessibilityElement(children: .contain)
                .accessibilityIdentifier("shell.tab.group")
                .accessibilityValue(metrics.contentMode == .labeled ? "labeled" : "iconOnly")

            searchOrb
        }
    }

    private var shellGroup: some View {
        ZStack {
            groupSelectionTrack
            groupButtons
        }
        .frame(width: metrics.groupWidth, height: metrics.shellHeight)
        .background(groupShellBackground)
    }

    private var groupSelectionTrack: some View {
        HStack(spacing: 0) {
            ForEach(groupedTabs, id: \.self) { tab in
                selectionSlot(for: tab)
                    .frame(width: metrics.groupTabWidth, height: metrics.groupContentHeight)
            }
        }
        .padding(metrics.selectionInset)
        .allowsHitTesting(false)
    }

    private var groupButtons: some View {
        HStack(spacing: 0) {
            ForEach(groupedTabs, id: \.self) { tab in
                Button {
                    selectedTab = tab
                } label: {
                    groupButtonLabel(for: tab)
                        .frame(width: metrics.groupTabWidth, height: metrics.groupContentHeight)
                        .contentShape(Capsule())
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier(accessibilityIdentifier(for: tab))
                .accessibilityLabel(WanderlustTabItem.title(for: tab))
                .accessibilityValue(selectedTab == tab ? "selected" : "not selected")
            }
        }
        .padding(metrics.selectionInset)
    }

    @ViewBuilder
    private func selectionSlot(for tab: AppState.Tab) -> some View {
        if selectedGroupedTab == tab {
            selectionSurface
                .accessibilityElement()
                .accessibilityIdentifier("shell.tab.selection")
                .accessibilityLabel("Selected tab")
                .accessibilityValue(WanderlustTabItem.title(for: tab))
        } else {
            Color.clear
        }
    }

    @ViewBuilder
    private var selectionSurface: some View {
        if #available(iOS 26.0, *) {
            Capsule()
                .fill(.clear)
                .glassEffect(.regular.tint(selectedShellTint).interactive(false), in: Capsule())
                .glassEffectID("selected-tab", in: selectionNamespace)
                .glassEffectTransition(.matchedGeometry)
        } else {
            Capsule()
                .fill(selectedShellTint.opacity(colorScheme == .dark ? 0.34 : 0.58))
                .overlay {
                    Capsule()
                        .strokeBorder(selectionBorderColor, lineWidth: 1)
                }
                .shadow(color: Color.black.opacity(colorScheme == .dark ? 0.16 : 0.08), radius: 10, y: 4)
                .matchedGeometryEffect(id: "selected-tab", in: selectionNamespace, properties: .frame)
        }
    }

    @ViewBuilder
    private var groupShellBackground: some View {
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

    private func groupButtonLabel(for tab: AppState.Tab) -> some View {
        let isSelected = selectedTab == tab

        return Group {
            if metrics.contentMode == .iconOnly {
                Image(systemName: WanderlustTabItem.symbol(for: tab))
                    .symbolRenderingMode(.hierarchical)
                    .font(.system(size: 16, weight: isSelected ? .semibold : .medium))
            } else {
                VStack(spacing: 1) {
                    Image(systemName: WanderlustTabItem.symbol(for: tab))
                        .symbolRenderingMode(.hierarchical)
                        .font(.system(size: 14, weight: isSelected ? .semibold : .medium))

                    Text(WanderlustTabItem.title(for: tab))
                        .font(.system(size: 9, weight: isSelected ? .semibold : .medium, design: .rounded))
                        .lineLimit(1)
                        .minimumScaleFactor(0.82)
                }
            }
        }
        .foregroundStyle(isSelected ? Color.primary : Color.secondary)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    @ViewBuilder
    private var searchOrb: some View {
        if #available(iOS 26.0, *) {
            searchOrbButton
                .buttonBorderShape(.circle)
                .buttonSizing(.fitted)
                .controlSize(.mini)
                .if(selectedTab == .search) { view in
                    view
                        .buttonStyle(.glassProminent)
                        .tint(selectedShellTint)
                }
                .if(selectedTab != .search) { view in
                    view.buttonStyle(.glass)
                }
        } else {
            searchOrbButton
                .buttonStyle(.plain)
                .background {
                    Circle()
                        .fill(.ultraThinMaterial)
                        .overlay {
                            if selectedTab == .search {
                                Circle()
                                    .fill(selectedShellTint.opacity(colorScheme == .dark ? 0.28 : 0.44))
                            }
                        }
                        .overlay {
                            Circle()
                                .strokeBorder(
                                    selectedTab == .search ? selectionBorderColor : shellBorderColor,
                                    lineWidth: 1
                                )
                        }
                }
                .shadow(color: Color.black.opacity(colorScheme == .dark ? 0.18 : 0.08), radius: 18, y: 8)
        }
    }

    private var searchOrbButton: some View {
        let isSelected = selectedTab == .search

        return Button {
            selectedTab = .search
        } label: {
            Image(systemName: WanderlustTabItem.searchSymbol)
                .font(.system(size: 18, weight: isSelected ? .semibold : .medium))
                .foregroundStyle(isSelected ? Color.primary : Color.secondary)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .frame(width: metrics.searchOrbSize, height: metrics.searchOrbSize)
        .contentShape(Circle())
        .accessibilityIdentifier("shell.tab.search")
        .accessibilityLabel(WanderlustTabItem.title(for: .search))
        .accessibilityValue(isSelected ? "selected" : "not selected")
    }

    private var groupShellTint: Color {
        colorScheme == .dark ? Color.white.opacity(0.08) : Color.white.opacity(0.18)
    }

    private var selectedShellTint: Color {
        Color(red: 0.94, green: 0.9, blue: 0.8).opacity(colorScheme == .dark ? 0.18 : 0.38)
    }

    private var shellBorderColor: Color {
        colorScheme == .dark ? Color.white.opacity(0.12) : Color.black.opacity(0.08)
    }

    private var selectionBorderColor: Color {
        colorScheme == .dark ? Color.white.opacity(0.16) : Color.white.opacity(0.5)
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
