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
            HStack(spacing: 0) {
                DiscoverFeedSurface(
                    viewModel: viewModel,
                    pageSize: proxy.size,
                    scrollTarget: $feedScrollTarget
                )
                .frame(width: proxy.size.width, height: proxy.size.height)
                .clipped()
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
                .frame(width: proxy.size.width, height: proxy.size.height)
                .clipped()
                .allowsHitTesting(appState.discoverSurface == .profile)
                .accessibilityHidden(appState.discoverSurface != .profile)
            }
            .frame(width: proxy.size.width * 2, height: proxy.size.height, alignment: .leading)
            .offset(x: appState.discoverSurface == .feed ? 0 : -proxy.size.width)
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
                    .frame(height: max(proxy.size.height - 120, 0), alignment: .top)
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

private struct DiscoverProfileSurface: View {
    let destination: DestinationSummary?
    let profile: DestinationProfileView?
    let isLoadingProfile: Bool
    let profileErrorMessage: String?
    let isSaved: Bool
    let isPlanning: Bool
    let onToggleSaved: () -> Void
    let onPlanTrip: () -> Void
    let onRetry: () -> Void

    private let accentColor = Color(red: 0.85, green: 0.74, blue: 0.49)

    var body: some View {
        GeometryReader { proxy in
            ZStack(alignment: .bottom) {
                Color.black

                if let destination, let profile {
                    ScrollView(.vertical) {
                        VStack(spacing: 0) {
                            profileHero(destination: destination)
                            detailPanel(profile: profile)
                            storyGrid(profile: profile)
                        }
                        .frame(width: proxy.size.width, alignment: .topLeading)
                    }
                    .padding(.bottom, 124)
                    .frame(width: proxy.size.width, height: proxy.size.height, alignment: .top)
                    .scrollIndicators(.hidden)
                    .accessibilityIdentifier("discover.profile.\(destination.id)")

                    actionBar(destinationId: destination.id)
                        .frame(width: proxy.size.width, alignment: .center)
                        .padding(.bottom, max(proxy.safeAreaInsets.bottom, 20))

                } else if isLoadingProfile, destination != nil {
                    ProgressView("Loading destination...")
                        .tint(.white)
                        .foregroundStyle(.white)
                } else if let destination {
                    VStack(spacing: 18) {
                        Image(systemName: "rectangle.stack.badge.person.crop")
                            .font(.system(size: 26, weight: .light))
                            .foregroundStyle(.white.opacity(0.78))

                        Text("Destination details are unavailable")
                            .font(.system(size: 22, weight: .semibold, design: .serif))
                            .foregroundStyle(.white)

                        Text(profileErrorMessage ?? "Try again in a moment.")
                            .font(.system(size: 15, weight: .regular, design: .default))
                            .foregroundStyle(Color.white.opacity(0.72))
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 28)

                        Button(action: onRetry) {
                            Text("Retry")
                                .font(.system(size: 15, weight: .medium))
                                .foregroundStyle(.black)
                                .padding(.horizontal, 22)
                                .padding(.vertical, 12)
                                .background(Color.white, in: Capsule(style: .continuous))
                        }
                        .buttonStyle(.plain)
                        .accessibilityIdentifier("discover.profile.retryButton.\(destination.id)")
                    }
                    .padding(.horizontal, 32)
                    .frame(width: proxy.size.width)
                } else {
                    ContentUnavailableView(
                        "Discover is unavailable",
                        systemImage: "sparkles.rectangle.stack",
                        description: Text("Load the destination feed first.")
                    )
                    .foregroundStyle(.white)
                    .frame(width: proxy.size.width)
                }
            }
        }
    }

    private func profileHero(destination: DestinationSummary) -> some View {
        ZStack(alignment: .bottomLeading) {
            DiscoverHeroImage(destination: destination)
                .frame(height: 320)

            LinearGradient(
                colors: [
                    Color.clear,
                    Color.black.opacity(0.14),
                    Color.black.opacity(0.48)
                ],
                startPoint: .top,
                endPoint: .bottom
            )

            VStack(alignment: .leading, spacing: 8) {
                Text(destination.city)
                    .font(.system(size: 42, weight: .bold, design: .serif))
                    .foregroundStyle(.white)

                Text(destination.thesis)
                    .font(.system(size: 15, weight: .light))
                    .foregroundStyle(Color.white.opacity(0.82))
                    .lineSpacing(6)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 28)
        }
        .frame(maxWidth: .infinity)
        .clipped()
    }

    private func detailPanel(profile: DestinationProfileView) -> some View {
        VStack(spacing: 0) {
            HStack(alignment: .center, spacing: 14) {
                ZStack {
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .fill(Color.white.opacity(0.08))
                        .frame(width: 44, height: 44)

                    Image(systemName: "airplane")
                        .font(.system(size: 17, weight: .regular))
                        .foregroundStyle(accentColor)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text(profile.destination.city.uppercased())
                        .font(.system(size: 13, weight: .semibold, design: .monospaced))
                        .tracking(1.2)
                        .foregroundStyle(accentColor)

                    Text(profile.destination.country.uppercased())
                        .font(.system(size: 11, weight: .regular, design: .monospaced))
                        .tracking(1.0)
                        .foregroundStyle(Color.white.opacity(0.66))
                }

                Spacer()
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 18)

            Divider()
                .overlay(Color.white.opacity(0.08))

            ForEach(profile.details.indices, id: \.self) { index in
                detailRow(profile.details[index], isLast: index == profile.details.count - 1)
            }
        }
        .background(Color.black)
    }

    private func detailRow(_ detail: DestinationProfileDetail, isLast: Bool) -> some View {
        VStack(spacing: 0) {
            HStack(alignment: .top, spacing: 16) {
                Text(detail.label.uppercased())
                    .font(.system(size: 11, weight: .semibold, design: .monospaced))
                    .tracking(1.0)
                    .foregroundStyle(accentColor)
                    .fixedSize()

                Spacer(minLength: 12)

                Text(detail.value)
                    .font(.system(size: 15, weight: .medium, design: .default))
                    .foregroundStyle(.white)
                    .multilineTextAlignment(.trailing)
                    .frame(maxWidth: .infinity, alignment: .trailing)
                    .fixedSize(horizontal: false, vertical: true)
                    .layoutPriority(1)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 20)
            .padding(.vertical, 16)

            if !isLast {
                Divider()
                    .overlay(Color.white.opacity(0.08))
            }
        }
    }

    private func storyGrid(profile: DestinationProfileView) -> some View {
        LazyVGrid(
            columns: [
                GridItem(.flexible(), spacing: 14),
                GridItem(.flexible(), spacing: 14)
            ],
            spacing: 14
        ) {
            ForEach(profile.stories) { story in
                DiscoverStoryTile(story: story, accentColor: accentColor)
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 18)
        .padding(.bottom, 28)
        .background(Color.black)
    }

    private func actionBar(destinationId: String) -> some View {
        HStack(alignment: .center, spacing: 12) {
            DiscoverSaveButton(
                isSaved: isSaved,
                label: "Save",
                fontWeight: .light,
                accessibilityIdentifier: "discover.profile.saveButton.\(destinationId)",
                onTap: onToggleSaved
            )

            Spacer(minLength: 0)

            DiscoverPlanTripButton(
                title: "Plan Trip",
                isPlanning: isPlanning,
                fontWeight: .light,
                isEnabled: !isPlanning,
                accessibilityIdentifier: "discover.profile.planTripButton.\(destinationId)",
                onTap: onPlanTrip
            )
        }
        .frame(maxWidth: .infinity)
        .padding(.horizontal, 20)
        .padding(.top, 14)
        .padding(.bottom, 20)
        .background(
            Color.black.opacity(0.94)
        )
        .overlay(alignment: .top) {
            Rectangle()
                .fill(Color.white.opacity(0.08))
                .frame(height: 1)
        }
    }
}

private struct DiscoverSaveButton: View {
    let isSaved: Bool
    let label: String
    let fontWeight: Font.Weight
    let accessibilityIdentifier: String?
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 10) {
                Image(systemName: isSaved ? "bookmark.fill" : "bookmark")
                    .font(.system(size: 18, weight: fontWeight))

                Text(isSaved ? "Saved" : label)
                    .font(.system(size: 16, weight: fontWeight, design: .default))
            }
            .foregroundStyle(Color.white.opacity(isSaved ? 0.96 : 0.74))
            .padding(.horizontal, 16)
            .frame(width: 136, height: 52, alignment: .leading)
            .background(Color.white.opacity(0.06), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        }
        .buttonStyle(.plain)
        .accessibilityLabel(isSaved ? "Saved" : "Save")
        .accessibilityValue(isSaved ? "saved" : "unsaved")
        .accessibilityIdentifier(accessibilityIdentifier ?? "")
    }
}

private struct DiscoverPlanTripButton: View {
    let title: String
    let isPlanning: Bool
    let fontWeight: Font.Weight
    let isEnabled: Bool
    let accessibilityIdentifier: String?
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            Text(isPlanning ? "Building Trip..." : title)
                .font(.system(size: 16, weight: fontWeight, design: .default))
                .foregroundStyle(Color.white.opacity(0.92))
                .padding(.horizontal, 22)
                .padding(.vertical, 12)
                .frame(width: 148)
                .background(Color.black.opacity(0.01), in: Capsule(style: .continuous))
                .overlay {
                    Capsule(style: .continuous)
                        .strokeBorder(Color.white.opacity(0.34), lineWidth: 1)
                }
        }
        .buttonStyle(.plain)
        .disabled(!isEnabled)
        .accessibilityIdentifier(accessibilityIdentifier ?? "")
    }
}

private struct DiscoverStoryTile: View {
    let story: DestinationProfileStoryCard
    let accentColor: Color

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            AsyncImage(url: URL(string: story.imageUrl)) { phase in
                switch phase {
                case let .success(image):
                    image
                        .resizable()
                        .scaledToFill()
                default:
                    fallbackBackground
                }
            }

            LinearGradient(
                colors: [
                    Color.clear,
                    Color.black.opacity(0.22),
                    Color.black.opacity(0.74)
                ],
                startPoint: .top,
                endPoint: .bottom
            )

            VStack(alignment: .leading, spacing: 8) {
                Text(story.category.uppercased())
                    .font(.system(size: 10, weight: .semibold, design: .monospaced))
                    .tracking(1.0)
                    .foregroundStyle(accentColor)

                Text(story.title)
                    .font(.system(size: 18, weight: .semibold, design: .serif))
                    .foregroundStyle(.white)
                    .lineLimit(3)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(.horizontal, 14)
            .padding(.bottom, 14)
        }
        .frame(maxWidth: .infinity)
        .frame(height: 220)
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .strokeBorder(Color.white.opacity(0.06), lineWidth: 1)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(story.category). \(story.title)")
        .accessibilityIdentifier("discover.profile.story.\(story.id)")
    }

    private var fallbackBackground: some View {
        LinearGradient(
            colors: [
                Color(red: 0.24, green: 0.23, blue: 0.22),
                Color(red: 0.08, green: 0.08, blue: 0.09),
                Color.black
            ],
            startPoint: .top,
            endPoint: .bottom
        )
        .overlay {
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .fill(
                    RadialGradient(
                        colors: [
                            Color.white.opacity(0.08),
                            Color.clear
                        ],
                        center: .topLeading,
                        startRadius: 24,
                        endRadius: 180
                    )
                )
        }
    }
}

private struct DiscoverHeroImage: View {
    let destination: DestinationSummary

    var body: some View {
        AsyncImage(url: URL(string: destination.heroImageUrl)) { phase in
            switch phase {
            case let .success(image):
                image
                    .resizable()
                    .scaledToFill()
                    .accessibilityLabel(destination.heroImageAccessibilityLabel)
            default:
                fallbackBackground
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .clipped()
    }

    private var fallbackBackground: some View {
        LinearGradient(
            colors: [
                Color(red: 0.22, green: 0.22, blue: 0.24),
                Color(red: 0.08, green: 0.08, blue: 0.1),
                Color.black
            ],
            startPoint: .top,
            endPoint: .bottom
        )
        .overlay {
            RoundedRectangle(cornerRadius: 0)
                .fill(
                    RadialGradient(
                        colors: [
                            Color.white.opacity(0.08),
                            Color.clear
                        ],
                        center: .topLeading,
                        startRadius: 40,
                        endRadius: 420
                    )
                )
        }
        .accessibilityLabel(destination.heroImageAccessibilityLabel)
    }
}

private struct DiscoverSwipeCaptureView: UIViewRepresentable {
    let onSwipeUp: () -> Void
    let onSwipeDown: () -> Void
    let onSwipeLeft: () -> Void
    let onSwipeRight: () -> Void

    func makeCoordinator() -> Coordinator {
        Coordinator(
            onSwipeUp: onSwipeUp,
            onSwipeDown: onSwipeDown,
            onSwipeLeft: onSwipeLeft,
            onSwipeRight: onSwipeRight
        )
    }

    func makeUIView(context: Context) -> UIView {
        let view = UIView()
        view.backgroundColor = .clear

        let swipeUp = UISwipeGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.handleSwipeUp))
        swipeUp.direction = .up
        swipeUp.cancelsTouchesInView = false
        swipeUp.delegate = context.coordinator

        let swipeDown = UISwipeGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.handleSwipeDown))
        swipeDown.direction = .down
        swipeDown.cancelsTouchesInView = false
        swipeDown.delegate = context.coordinator

        let swipeLeft = UISwipeGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.handleSwipeLeft))
        swipeLeft.direction = .left
        swipeLeft.cancelsTouchesInView = false
        swipeLeft.delegate = context.coordinator

        let swipeRight = UISwipeGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.handleSwipeRight))
        swipeRight.direction = .right
        swipeRight.cancelsTouchesInView = false
        swipeRight.delegate = context.coordinator

        view.addGestureRecognizer(swipeUp)
        view.addGestureRecognizer(swipeDown)
        view.addGestureRecognizer(swipeLeft)
        view.addGestureRecognizer(swipeRight)
        return view
    }

    func updateUIView(_ uiView: UIView, context: Context) {}

    final class Coordinator: NSObject, UIGestureRecognizerDelegate {
        private let onSwipeUp: () -> Void
        private let onSwipeDown: () -> Void
        private let onSwipeLeft: () -> Void
        private let onSwipeRight: () -> Void

        init(
            onSwipeUp: @escaping () -> Void,
            onSwipeDown: @escaping () -> Void,
            onSwipeLeft: @escaping () -> Void,
            onSwipeRight: @escaping () -> Void
        ) {
            self.onSwipeUp = onSwipeUp
            self.onSwipeDown = onSwipeDown
            self.onSwipeLeft = onSwipeLeft
            self.onSwipeRight = onSwipeRight
        }

        @objc func handleSwipeUp() {
            onSwipeUp()
        }

        @objc func handleSwipeDown() {
            onSwipeDown()
        }

        @objc func handleSwipeLeft() {
            onSwipeLeft()
        }

        @objc func handleSwipeRight() {
            onSwipeRight()
        }

        func gestureRecognizer(
            _ gestureRecognizer: UIGestureRecognizer,
            shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer
        ) -> Bool {
            true
        }
    }
}
