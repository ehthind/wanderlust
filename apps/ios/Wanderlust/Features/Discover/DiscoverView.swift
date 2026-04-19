import SwiftUI
import UIKit

private enum DiscoverViewLayout {
    static let cardScrollAnimationDuration = 0.28
    static let guideDismissSwipeThreshold: CGFloat = 90
    static let errorBannerHorizontalPadding: CGFloat = 16
    static let errorBannerVerticalPadding: CGFloat = 12
    static let errorBannerBottomPadding: CGFloat = 16
    static let feedBottomChromePadding: CGFloat = 36
    static let feedContentSpacing: CGFloat = 18
    static let feedHorizontalPadding: CGFloat = 24
    static let feedBodyLineSpacing: CGFloat = 8
    static let floatingActionReservedWidth: CGFloat = 98
}

private struct DiscoverChromeContext: Equatable {
    let destinationId: String
    let isSaved: Bool
    let isPlanning: Bool
    let isEnabled: Bool
    let saveAccessibilityIdentifier: String
    let accessibilityIdentifier: String
}

struct DiscoverView: View {
    @ObservedObject var appState: AppState
    @ObservedObject var chromeState: DiscoverChromeState
    @StateObject private var viewModel: DiscoverViewModel
    @State private var feedScrollTarget: String?
    @State private var activeDestinationId: String?
    @State private var displayedDestinationId: String?
    @Binding private var isGuidePresented: Bool
    @Environment(\.wanderlustBottomShellMetrics) private var bottomShellMetrics

    init(appState: AppState, isGuidePresented: Binding<Bool>, chromeState: DiscoverChromeState) {
        self.appState = appState
        self.chromeState = chromeState
        _isGuidePresented = isGuidePresented
        _viewModel = StateObject(
            wrappedValue: DiscoverViewModel(
                api: appState.api,
                onTripCreated: { appState.openTrip($0) },
                savedDestinationsStore: appState.savedDestinationsStore
            )
        )
    }

    var body: some View {
        GeometryReader { proxy in
            let pageWidth = min(proxy.size.width, UIScreen.main.bounds.width)
            let feedCardBottomInset = proxy.safeAreaInsets.bottom + bottomShellMetrics.contentInset
            let pageSize = CGSize(
                width: pageWidth,
                height: proxy.size.height + feedCardBottomInset
            )

            ZStack(alignment: .top) {
                DiscoverFeedSurface(
                    viewModel: viewModel,
                    pageSize: pageSize,
                    feedCardBottomInset: feedCardBottomInset,
                    displayedDestinationId: $displayedDestinationId,
                    scrollTarget: $feedScrollTarget,
                    onOpenDestinationGuide: openDestinationGuide
                )
                .frame(width: pageSize.width, height: pageSize.height, alignment: .top)

                if let activeDestinationId {
                    DiscoverDestinationGuideOverlay(
                        destinationId: activeDestinationId,
                        viewModel: viewModel,
                        onClose: closeDestinationGuide
                    )
                    .transition(.move(edge: .trailing))
                    .zIndex(1)
                }
            }
            .frame(width: pageSize.width, height: pageSize.height, alignment: .top)
            .background(Color.black)
        }
        .background(Color.black.ignoresSafeArea())
        .animation(.easeInOut(duration: DiscoverViewLayout.cardScrollAnimationDuration), value: activeDestinationId)
        .task {
            await viewModel.loadIfNeeded()
            feedScrollTarget = viewModel.currentCard?.destination.id
            displayedDestinationId = viewModel.currentCard?.destination.id
            syncChromeState()
        }
        .onAppear {
            isGuidePresented = activeDestinationId != nil
            syncChromeState()
        }
        .onChange(of: activeDestinationId) { _, newValue in
            isGuidePresented = newValue != nil
        }
        .onChange(of: currentChromeContext) { _, _ in
            syncChromeState()
        }
        .onDisappear {
            chromeState.saveCallToAction = nil
            chromeState.planTripCallToAction = nil
        }
    }

    private func openDestinationGuide(destinationId: String) {
        viewModel.setCurrentCard(destinationId: destinationId)
        feedScrollTarget = destinationId
        withAnimation(.easeInOut(duration: DiscoverViewLayout.cardScrollAnimationDuration)) {
            activeDestinationId = destinationId
        }
    }

    private func closeDestinationGuide() {
        withAnimation(.easeInOut(duration: DiscoverViewLayout.cardScrollAnimationDuration)) {
            activeDestinationId = nil
        }
    }

    private var currentChromeContext: DiscoverChromeContext? {
        guard let currentCard = viewModel.currentCard else { return nil }

        let destinationId = currentCard.destination.id
        return DiscoverChromeContext(
            destinationId: destinationId,
            isSaved: viewModel.isSaved(destinationId: destinationId),
            isPlanning: viewModel.isPlanning && viewModel.currentCard?.destination.id == destinationId,
            isEnabled: viewModel.currentCard?.destination.id == destinationId && !viewModel.isPlanning,
            saveAccessibilityIdentifier: "discover.saveButton.\(destinationId)",
            accessibilityIdentifier: "discover.planTripButton.\(destinationId)"
        )
    }

    private func syncChromeState() {
        guard let currentChromeContext else {
            chromeState.saveCallToAction = nil
            chromeState.planTripCallToAction = nil
            return
        }

        chromeState.saveCallToAction = DiscoverChromeState.SaveCallToAction(
            isSaved: currentChromeContext.isSaved,
            accessibilityIdentifier: currentChromeContext.saveAccessibilityIdentifier,
            action: {
                viewModel.toggleSaved(destinationId: currentChromeContext.destinationId)
            }
        )

        chromeState.planTripCallToAction = DiscoverChromeState.PlanTripCallToAction(
            isPlanning: currentChromeContext.isPlanning,
            isEnabled: currentChromeContext.isEnabled,
            accessibilityIdentifier: currentChromeContext.accessibilityIdentifier,
            action: {
                Task {
                    await viewModel.planTrip(destinationId: currentChromeContext.destinationId)
                }
            }
        )
    }
}

private struct DiscoverDestinationGuideOverlay: View {
    let destinationId: String
    @ObservedObject var viewModel: DiscoverViewModel
    let onClose: () -> Void

    var body: some View {
        NavigationStack {
            destinationGuide
                .toolbar {
                    ToolbarItem(placement: .topBarLeading) {
                        Button(action: onClose) {
                            Label("Discover", systemImage: "chevron.backward")
                        }
                        .accessibilityIdentifier("discover.detail.backButton")
                    }
                }
        }
        .simultaneousGesture(
            DragGesture(minimumDistance: 24)
                .onEnded { value in
                    guard
                        value.translation.width >= DiscoverViewLayout.guideDismissSwipeThreshold,
                        abs(value.translation.width) > abs(value.translation.height)
                    else {
                        return
                    }

                    onClose()
                }
        )
    }

    @ViewBuilder
    private var destinationGuide: some View {
        if let destination = viewModel.destination(destinationId: destinationId) {
            DiscoverDestinationDetailScreen(
                destination: destination,
                profile: viewModel.destinationProfile(destinationId: destinationId),
                isLoadingProfile: viewModel.isProfileLoading(destinationId: destinationId),
                profileErrorMessage: viewModel.profileError(destinationId: destinationId),
                isSaved: viewModel.isSaved(destinationId: destinationId),
                isPlanning: viewModel.isPlanning && viewModel.currentCard?.destination.id == destinationId,
                showsBottomShell: false,
                onToggleSaved: {
                    viewModel.toggleSaved(destinationId: destinationId)
                },
                onPlanTrip: {
                    Task {
                        await viewModel.planTrip(destinationId: destinationId)
                    }
                },
                onRetry: {
                    Task {
                        await viewModel.retryDestinationProfile(destinationId: destinationId)
                    }
                }
            )
            .task(id: destinationId) {
                viewModel.setCurrentCard(destinationId: destinationId)
                await viewModel.loadDestinationProfileIfNeeded(destinationId: destinationId)
            }
        } else {
            ContentUnavailableView(
                "Destination guide unavailable",
                systemImage: "map",
                description: Text("Return to Discover and choose another destination.")
            )
        }
    }
}

private struct DiscoverFeedSurface: View {
    @ObservedObject var viewModel: DiscoverViewModel
    let pageSize: CGSize
    let feedCardBottomInset: CGFloat
    @Binding var displayedDestinationId: String?
    @Binding var scrollTarget: String?
    let onOpenDestinationGuide: (String) -> Void

    var body: some View {
        ZStack {
            if viewModel.isLoading, viewModel.cards.isEmpty {
                ProgressView("Loading discover feed...")
                    .tint(.white)
                    .foregroundStyle(.white)
            } else if viewModel.cards.isEmpty {
                ContentUnavailableView(
                    "Discover is unavailable",
                    systemImage: "sparkles.rectangle.stack",
                    description: Text(viewModel.errorMessage ?? "Try again in a moment.")
                )
                .foregroundStyle(.white)
            } else {
                ScrollViewReader { proxy in
                    ScrollView(.vertical) {
                        VStack(spacing: 0) {
                            ForEach(viewModel.cards) { card in
                                DiscoverFeedCard(
                                    card: card,
                                    pageSize: pageSize,
                                    bottomContentInset: feedCardBottomInset,
                                    isDisplayed: displayedDestinationId == card.destination.id,
                                    isCurrent: viewModel.currentCard?.destination.id == card.destination.id
                                )
                                .id(card.destination.id)
                            }
                        }
                        .frame(width: pageSize.width, alignment: .leading)
                    }
                    .accessibilityIdentifier("discover.feed")
                    .scrollDisabled(true)
                    .scrollIndicators(.hidden)
                    .onChange(of: scrollTarget) { _, newValue in
                        guard let newValue else { return }
                        withAnimation(.easeInOut(duration: DiscoverViewLayout.cardScrollAnimationDuration)) {
                            proxy.scrollTo(newValue, anchor: .top)
                        }
                    }
                    .task(id: viewModel.cards.map(\.destination.id).joined(separator: ",")) {
                        guard let scrollTarget else { return }
                        proxy.scrollTo(scrollTarget, anchor: .top)
                    }
                }
            }
        }
        .frame(width: pageSize.width, height: pageSize.height)
        .ignoresSafeArea(edges: [.top, .bottom])
        .overlay {
            DiscoverSwipeCaptureView(
                onSwipeUp: {
                    pageFeed(by: 1)
                },
                onSwipeDown: {
                    pageFeed(by: -1)
                },
                onSwipeLeft: {
                    guard let destinationId = viewModel.currentCard?.destination.id else { return }
                    onOpenDestinationGuide(destinationId)
                },
                onSwipeRight: {}
            )
        }
        .overlay(alignment: .bottom) {
            if let errorMessage = viewModel.errorMessage, !viewModel.cards.isEmpty {
                Text(errorMessage)
                    .font(.system(.footnote, design: .rounded))
                    .foregroundStyle(.white)
                    .padding(.horizontal, DiscoverViewLayout.errorBannerHorizontalPadding)
                    .padding(.vertical, DiscoverViewLayout.errorBannerVerticalPadding)
                    .background(Color.black.opacity(0.72), in: Capsule())
                    .padding(.bottom, DiscoverViewLayout.errorBannerBottomPadding + feedCardBottomInset + 12)
            }
        }
    }

    private func pageFeed(by delta: Int) {
        guard !viewModel.cards.isEmpty else { return }

        let currentIndex = viewModel.cards.firstIndex { $0.destination.id == viewModel.currentCard?.destination.id } ?? 0
        let nextIndex = min(max(currentIndex + delta, 0), viewModel.cards.count - 1)
        guard nextIndex != currentIndex else { return }

        let destinationId = viewModel.cards[nextIndex].destination.id
        viewModel.setCurrentCard(destinationId: destinationId)
        scrollTarget = destinationId

        Task { @MainActor in
            try? await Task.sleep(
                nanoseconds: UInt64(DiscoverViewLayout.cardScrollAnimationDuration * 1_000_000_000)
            )

            guard scrollTarget == destinationId else { return }
            displayedDestinationId = destinationId
        }
    }
}

private struct DiscoverFeedCard: View {
    let card: FeaturedDiscoverCard
    let pageSize: CGSize
    let bottomContentInset: CGFloat
    let isDisplayed: Bool
    let isCurrent: Bool

    var body: some View {
        ZStack(alignment: .topLeading) {
            DiscoverHeroImage(destination: card.destination)
                .frame(width: pageSize.width, height: pageSize.height, alignment: .top)

            LinearGradient(
                colors: [
                    Color.black.opacity(0.54),
                    Color.black.opacity(0.0),
                    Color.black.opacity(0.0),
                    Color.black.opacity(0.46)
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .frame(width: pageSize.width, height: pageSize.height, alignment: .top)

            VStack(alignment: .leading, spacing: 0) {
                Spacer()

                VStack(alignment: .leading, spacing: DiscoverViewLayout.feedContentSpacing) {
                    Text(card.destination.city)
                        .font(.system(size: 48, weight: .bold, design: .serif))
                        .foregroundStyle(.white)

                    Text(card.destination.thesis)
                        .font(.system(size: 16, weight: .light, design: .default))
                        .foregroundStyle(Color.white.opacity(0.86))
                        .lineSpacing(DiscoverViewLayout.feedBodyLineSpacing)
                        .fixedSize(horizontal: false, vertical: true)
                        .padding(.trailing, DiscoverViewLayout.floatingActionReservedWidth)
                }
                .padding(.horizontal, DiscoverViewLayout.feedHorizontalPadding)
                .padding(.bottom, DiscoverViewLayout.feedBottomChromePadding + bottomContentInset)
            }
            .frame(
                width: pageSize.width,
                height: pageSize.height,
                alignment: .topLeading
            )
        }
        .frame(width: pageSize.width, height: pageSize.height, alignment: .topLeading)
        .zIndex(isDisplayed ? 1 : 0)
        .background(alignment: .topLeading) {
            Color.clear
                .frame(width: 1, height: 1)
                .allowsHitTesting(false)
                .accessibilityElement()
                .accessibilityHint("Swipe left to open the destination guide.")
                .accessibilityValue(isCurrent ? "current" : "offscreen")
                .accessibilityIdentifier("discover.card.\(card.destination.id)")
        }
    }
}

private struct DiscoverPreviewContainer: View {
    @StateObject private var appState = AppState(
        environment: .init(baseURL: URL(string: "https://example.test")!, useFixtures: true),
        api: FixtureAPIService(),
        lastTripStore: DiscoverPreviewLastTripStore(),
        savedDestinationsStore: DiscoverPreviewSavedDestinationsStore()
    )
    @StateObject private var chromeState = DiscoverChromeState()
    @State private var isGuidePresented = false

    var body: some View {
        DiscoverView(
            appState: appState,
            isGuidePresented: $isGuidePresented,
            chromeState: chromeState
        )
    }
}

private final class DiscoverPreviewLastTripStore: LastTripStoring {
    func loadTripDraftId() -> String? {
        nil
    }

    func saveTripDraftId(_ tripDraftId: String?) {}
}

private final class DiscoverPreviewSavedDestinationsStore: SavedDestinationStoring {
    private var savedDestinationIds: Set<String> = []

    func loadSavedDestinationIds() -> Set<String> {
        savedDestinationIds
    }

    func saveSavedDestinationIds(_ destinationIds: Set<String>) {
        savedDestinationIds = destinationIds
    }
}

struct DiscoverView_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            DiscoverPreviewContainer()
                .previewDevice("iPhone 16")
                .previewDisplayName("Discover Feed / iPhone 16")

            DiscoverPreviewContainer()
                .previewDevice("iPhone 16 Pro Max")
                .previewDisplayName("Discover Feed / iPhone 16 Pro Max")

            DiscoverPreviewContainer()
                .previewDevice("iPhone 16")
                .environment(\.dynamicTypeSize, .accessibility3)
                .previewDisplayName("Discover Feed / Accessibility")
        }
    }
}
