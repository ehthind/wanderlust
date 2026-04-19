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

    static let `default` = Self(
        contentMode: .labeled,
        shellHeight: 58,
        bottomPadding: 12,
        horizontalPadding: 16,
        contentInset: 76
    )

    static func resolve(for size: CGSize, dynamicTypeSize: DynamicTypeSize) -> Self {
        let contentMode: ContentMode =
            dynamicTypeSize.isAccessibilitySize || size.width < 390
            ? .iconOnly
            : .labeled

        let shellHeight: CGFloat = contentMode == .labeled ? 58 : 56
        let bottomPadding: CGFloat = size.height < 760 ? 10 : 12
        let horizontalPadding: CGFloat = size.width >= 430 ? 20 : 16

        return Self(
            contentMode: contentMode,
            shellHeight: shellHeight,
            bottomPadding: bottomPadding,
            horizontalPadding: horizontalPadding,
            contentInset: shellHeight + bottomPadding + 10
        )
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

    var body: some View {
        GeometryReader { proxy in
            let metrics = WanderlustBottomShellMetrics.resolve(
                for: proxy.size,
                dynamicTypeSize: dynamicTypeSize
            )

            ZStack(alignment: .bottom) {
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
                .toolbar(.hidden, for: .tabBar)
                .environment(\.wanderlustBottomShellMetrics, metrics)

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
        .tint(WanderlustTabItem.accentColor)
    }
}

private struct WanderlustBottomShell: View {
    @Binding var selectedTab: AppState.Tab
    let metrics: WanderlustBottomShellMetrics

    @Environment(\.colorScheme) private var colorScheme

    private let groupedTabs: [AppState.Tab] = [.discover, .trips, .inbox]

    var body: some View {
        HStack(alignment: .bottom, spacing: 14) {
            shellGroup
                .accessibilityElement(children: .contain)
                .accessibilityIdentifier("shell.tab.group")
                .accessibilityValue(metrics.contentMode == .labeled ? "labeled" : "iconOnly")

            searchOrb
        }
        .frame(maxWidth: .infinity, alignment: .bottomLeading)
        .animation(.spring(response: 0.26, dampingFraction: 0.82), value: selectedTab)
        .accessibilityElement(children: .contain)
    }

    @ViewBuilder
    private var shellGroup: some View {
        if #available(iOS 26.0, *) {
            GlassEffectContainer(spacing: 16) {
                HStack(spacing: 8) {
                    ForEach(groupedTabs, id: \.self) { tab in
                        shellButton(for: tab, iconOnly: metrics.contentMode == .iconOnly)
                    }
                }
                .padding(6)
                .glassEffect(.regular.tint(groupShellTint).interactive(false), in: Capsule())
            }
        } else {
            HStack(spacing: 8) {
                ForEach(groupedTabs, id: \.self) { tab in
                    shellButton(for: tab, iconOnly: metrics.contentMode == .iconOnly)
                }
            }
            .padding(6)
            .background(.ultraThinMaterial, in: Capsule())
            .overlay {
                Capsule()
                    .strokeBorder(shellBorderColor, lineWidth: 1)
            }
            .shadow(color: Color.black.opacity(colorScheme == .dark ? 0.18 : 0.08), radius: 18, y: 8)
        }
    }

    @ViewBuilder
    private var searchOrb: some View {
        let isSelected = selectedTab == .search
        let usesLightForeground = selectedTab == .discover
        let accentColor = WanderlustTabItem.accentColor
        let labelColor = isSelected
            ? accentColor
            : usesLightForeground
                ? Color.white.opacity(0.98)
                : Color.primary.opacity(0.88)

        if #available(iOS 26.0, *) {
            let button = Button {
                selectedTab = .search
            } label: {
                Image(systemName: WanderlustTabItem.searchSymbol)
                    .font(.system(size: 20, weight: isSelected ? .semibold : .medium))
                    .foregroundStyle(labelColor)
                    .frame(width: 50, height: 50)
            }

            if isSelected {
                button
                    .buttonStyle(.glassProminent)
                    .tint(accentColor)
                    .accessibilityIdentifier("shell.tab.search")
                    .accessibilityLabel(WanderlustTabItem.title(for: .search))
                    .accessibilityValue(isSelected ? "selected" : "not selected")
            } else {
                button
                    .buttonStyle(.glass)
                    .tint(usesLightForeground ? Color.white.opacity(0.16) : Color.clear)
                    .accessibilityIdentifier("shell.tab.search")
                    .accessibilityLabel(WanderlustTabItem.title(for: .search))
                    .accessibilityValue(isSelected ? "selected" : "not selected")
            }
        } else {
            Button {
                selectedTab = .search
            } label: {
                Image(systemName: WanderlustTabItem.searchSymbol)
                    .font(.system(size: 19, weight: isSelected ? .semibold : .medium))
                    .foregroundStyle(labelColor)
                    .frame(width: 50, height: 50)
            }
            .buttonStyle(.plain)
            .background(.ultraThinMaterial, in: Circle())
            .overlay {
                Circle()
                    .strokeBorder(shellBorderColor, lineWidth: 1)
            }
            .shadow(color: Color.black.opacity(colorScheme == .dark ? 0.18 : 0.08), radius: 18, y: 8)
            .accessibilityIdentifier("shell.tab.search")
            .accessibilityLabel(WanderlustTabItem.title(for: .search))
            .accessibilityValue(isSelected ? "selected" : "not selected")
        }
    }

    private func shellButton(for tab: AppState.Tab, iconOnly: Bool) -> some View {
        let isSelected = selectedTab == tab
        let shapeIsCircle = tab == .search
        let size = metrics.contentMode == .iconOnly ? CGFloat(44) : CGFloat(46)
        let accentColor = WanderlustTabItem.accentColor
        let usesLightForeground = selectedTab == .discover
        let labelColor = isSelected
            ? accentColor
            : shapeIsCircle && usesLightForeground
                ? Color.white.opacity(0.98)
                : usesLightForeground
                    ? Color.white.opacity(0.9)
                    : Color.primary.opacity(0.88)

        return Button {
            selectedTab = tab
        } label: {
            Group {
                if iconOnly {
                    Image(systemName: WanderlustTabItem.symbol(for: tab))
                        .symbolRenderingMode(.hierarchical)
                        .font(.system(size: shapeIsCircle ? 19 : 17, weight: isSelected ? .semibold : .medium))
                        .frame(width: shapeIsCircle ? 50 : size, height: shapeIsCircle ? 50 : size)
                } else {
                    Label {
                        Text(WanderlustTabItem.title(for: tab))
                            .font(.system(.footnote, design: .rounded).weight(isSelected ? .semibold : .medium))
                            .lineLimit(1)
                    } icon: {
                        Image(systemName: WanderlustTabItem.symbol(for: tab))
                            .symbolRenderingMode(.hierarchical)
                            .font(.system(size: 13, weight: isSelected ? .semibold : .medium))
                    }
                    .labelStyle(.titleAndIcon)
                    .padding(.horizontal, 10)
                    .frame(height: 46)
                }
            }
            .foregroundStyle(labelColor)
            .contentShape(shapeIsCircle ? AnyShape(Circle()) : AnyShape(Capsule()))
        }
        .buttonStyle(.plain)
        .background {
            if #available(iOS 26.0, *) {
                if isSelected {
                    if shapeIsCircle {
                        Circle()
                            .fill(.clear)
                            .glassEffect(.regular.tint(accentColor.opacity(0.26)).interactive(), in: Circle())
                    } else {
                        Capsule()
                            .fill(.clear)
                            .glassEffect(.regular.tint(accentColor.opacity(0.22)).interactive(), in: Capsule())
                    }
                } else if shapeIsCircle {
                    Circle()
                        .fill(.clear)
                        .glassEffect(
                            usesLightForeground
                                ? .regular.tint(Color.white.opacity(0.14)).interactive()
                                : .regular.interactive(),
                            in: Circle()
                        )
                }
            } else {
                if isSelected {
                    if shapeIsCircle {
                        Circle()
                            .fill(accentColor.opacity(colorScheme == .dark ? 0.3 : 0.18))
                            .overlay {
                                Circle()
                                    .strokeBorder(accentColor.opacity(0.32), lineWidth: 1)
                            }
                    } else {
                        Capsule()
                            .fill(accentColor.opacity(colorScheme == .dark ? 0.3 : 0.18))
                            .overlay {
                                Capsule()
                                    .strokeBorder(accentColor.opacity(0.3), lineWidth: 1)
                            }
                    }
                }
            }
        }
        .accessibilityIdentifier(accessibilityIdentifier(for: tab))
        .accessibilityLabel(WanderlustTabItem.title(for: tab))
        .accessibilityValue(isSelected ? "selected" : "not selected")
    }

    private var groupShellTint: Color {
        colorScheme == .dark ? Color.white.opacity(0.08) : Color.white.opacity(0.18)
    }

    private var shellBorderColor: Color {
        colorScheme == .dark ? Color.white.opacity(0.12) : Color.black.opacity(0.08)
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
