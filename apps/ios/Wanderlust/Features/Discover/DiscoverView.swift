import SwiftUI
import UIKit

struct DiscoverView: View {
    @ObservedObject var appState: AppState
    @StateObject private var viewModel: DiscoverViewModel
    @State private var feedScrollTarget: String?

    init(appState: AppState) {
        self.appState = appState
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
            let pageSize = CGSize(width: pageWidth, height: proxy.size.height)

            ZStack(alignment: .leading) {
                DiscoverFeedSurface(
                    viewModel: viewModel,
                    pageSize: pageSize,
                    scrollTarget: $feedScrollTarget
                )
                .frame(width: pageSize.width, height: pageSize.height)
                .clipped()
                .offset(x: appState.discoverSurface == .feed ? 0 : -pageSize.width)
                .allowsHitTesting(appState.discoverSurface == .feed)
                .accessibilityHidden(appState.discoverSurface != .feed)
                .accessibilityIdentifier("discover.feed.surface")

                DiscoverProfileSurface(
                    destination: currentDestination,
                    profile: viewModel.currentProfile,
                    isLoadingProfile: currentDestination.map { viewModel.isProfileLoading(destinationId: $0.id) } ?? false,
                    profileErrorMessage: currentDestination.flatMap { viewModel.profileError(destinationId: $0.id) },
                    isSaved: currentDestination.map { viewModel.isSaved(destinationId: $0.id) } ?? false,
                    isPlanning: viewModel.isPlanning,
                    pageSize: pageSize,
                    bottomSafeInset: proxy.safeAreaInsets.bottom,
                    onToggleSaved: {
                        guard let destinationId = currentDestination?.id else { return }
                        viewModel.toggleSaved(destinationId: destinationId)
                    },
                    onPlanTrip: {
                        Task {
                            await viewModel.planTrip()
                        }
                    },
                    onRetry: {
                        Task {
                            await viewModel.retryCurrentProfile()
                        }
                    }
                )
                .frame(width: pageSize.width, height: pageSize.height)
                .clipped()
                .offset(x: appState.discoverSurface == .feed ? pageSize.width : 0)
                .allowsHitTesting(appState.discoverSurface == .profile)
                .accessibilityHidden(appState.discoverSurface != .profile)
            }
            .frame(width: pageSize.width, height: pageSize.height, alignment: .leading)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
            .animation(.easeInOut(duration: 0.24), value: appState.discoverSurface)
            .contentShape(Rectangle())
            .background(Color.black)
            .clipped()
            .overlay {
                if appState.discoverSurface == .feed {
                    DiscoverSwipeCaptureView(
                        onSwipeUp: {
                            guard appState.discoverSurface == .feed else { return }
                            pageFeed(by: 1)
                        },
                        onSwipeDown: {
                            guard appState.discoverSurface == .feed else { return }
                            pageFeed(by: -1)
                        },
                        onSwipeLeft: {
                            guard appState.discoverSurface == .feed else { return }
                            guard currentDestination != nil else { return }
                            appState.discoverSurface = .profile
                        },
                        onSwipeRight: {}
                    )
                    .frame(height: max(pageSize.height - 120, 0), alignment: .top)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
                } else {
                    DiscoverSwipeCaptureView(
                        onSwipeUp: {},
                        onSwipeDown: {},
                        onSwipeLeft: {},
                        onSwipeRight: {
                            guard appState.discoverSurface == .profile else { return }
                            appState.discoverSurface = .feed
                        }
                    )
                    .frame(width: 28)
                    .frame(maxHeight: .infinity, alignment: .leading)
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
        }
        .background(Color.black)
        .ignoresSafeArea()
        .task {
            await viewModel.loadIfNeeded()
            feedScrollTarget = viewModel.currentCard?.destination.id
        }
        .onChange(of: appState.discoverSurface) { _, newValue in
            guard newValue == .profile else { return }
            Task {
                await viewModel.prefetchCurrentProfileIfNeeded()
            }
        }
    }

    private var currentDestination: DestinationSummary? {
        viewModel.currentCard?.destination ?? viewModel.cards.first?.destination
    }

    private func pageFeed(by delta: Int) {
        guard !viewModel.cards.isEmpty else { return }

        let currentIndex = viewModel.cards.firstIndex { $0.destination.id == currentDestination?.id } ?? 0
        let nextIndex = min(max(currentIndex + delta, 0), viewModel.cards.count - 1)
        guard nextIndex != currentIndex else { return }

        let destinationId = viewModel.cards[nextIndex].destination.id
        viewModel.setCurrentCard(destinationId: destinationId)
        feedScrollTarget = destinationId
    }
}

private struct DiscoverFeedSurface: View {
    @ObservedObject var viewModel: DiscoverViewModel
    let pageSize: CGSize
    @Binding var scrollTarget: String?

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
                                    isSaved: viewModel.isSaved(destinationId: card.destination.id),
                                    isCurrent: viewModel.currentCard?.destination.id == card.destination.id,
                                    isPlanning: viewModel.isPlanning && viewModel.currentCard?.destination.id == card.destination.id,
                                    onToggleSaved: {
                                        viewModel.toggleSaved(destinationId: card.destination.id)
                                    },
                                    onPlanTrip: {
                                        Task {
                                            await viewModel.planTrip()
                                        }
                                    }
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
                        withAnimation(.easeInOut(duration: 0.28)) {
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
        .overlay(alignment: .bottom) {
            if let errorMessage = viewModel.errorMessage, !viewModel.cards.isEmpty {
                Text(errorMessage)
                    .font(.system(.footnote, design: .rounded))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .background(Color.black.opacity(0.72), in: Capsule())
                    .padding(.bottom, 18)
            }
        }
    }

}

private struct DiscoverFeedCard: View {
    let card: FeaturedDiscoverCard
    let pageSize: CGSize
    let isSaved: Bool
    let isCurrent: Bool
    let isPlanning: Bool
    let onToggleSaved: () -> Void
    let onPlanTrip: () -> Void

    private let bottomChromeClearance: CGFloat = 104

    var body: some View {
        ZStack(alignment: .topLeading) {
            DiscoverHeroImage(destination: card.destination)

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

            VStack(alignment: .leading, spacing: 0) {
                Spacer()

                VStack(alignment: .leading, spacing: 20) {
                    Text(card.destination.city)
                        .font(.system(size: 48, weight: .bold, design: .serif))
                        .foregroundStyle(.white)

                    Text(card.destination.thesis)
                        .font(.system(size: 16, weight: .light, design: .default))
                        .foregroundStyle(Color.white.opacity(0.86))
                        .lineSpacing(8)
                        .fixedSize(horizontal: false, vertical: true)

                    HStack(alignment: .center) {
                        saveButton

                        Spacer()

                        planTripButton
                    }
                }
                .padding(.horizontal, 24)
                .padding(.bottom, bottomChromeClearance)
            }
            .frame(
                width: pageSize.width,
                height: pageSize.height,
                alignment: .topLeading
            )
        }
        .frame(width: pageSize.width, height: pageSize.height, alignment: .topLeading)
        .contentShape(Rectangle())
        .clipped()
        .overlay {
            Rectangle()
                .fill(Color.clear)
                .allowsHitTesting(false)
                .accessibilityElement()
                .accessibilityValue(isCurrent ? "current" : "offscreen")
                .accessibilityIdentifier("discover.card.\(card.destination.id)")
        }
    }

    private var saveButton: some View {
        DiscoverSaveButton(
            isSaved: isSaved,
            label: card.cues.secondaryAction,
            fontWeight: .light,
            accessibilityIdentifier: "discover.saveButton.\(card.destination.id)",
            onTap: onToggleSaved
        )
    }

    private var planTripButton: some View {
        DiscoverPlanTripButton(
            title: card.cues.primaryAction,
            isPlanning: isPlanning,
            fontWeight: .light,
            isEnabled: isCurrent && !isPlanning,
            accessibilityIdentifier: "discover.planTripButton.\(card.destination.id)",
            onTap: onPlanTrip
        )
    }
}
