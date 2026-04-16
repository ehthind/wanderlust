import SwiftUI

struct DiscoverProfileSurface: View {
    let destination: DestinationSummary?
    let profile: DestinationProfileView?
    let isLoadingProfile: Bool
    let profileErrorMessage: String?
    let isSaved: Bool
    let isPlanning: Bool
    let pageSize: CGSize
    let bottomSafeInset: CGFloat
    let onToggleSaved: () -> Void
    let onPlanTrip: () -> Void
    let onRetry: () -> Void

    private let accentColor = Color(red: 0.85, green: 0.74, blue: 0.49)

    var body: some View {
        let metrics = DiscoverProfileLayoutMetrics(
            pageSize: pageSize,
            bottomSafeInset: bottomSafeInset
        )

        ZStack(alignment: .bottom) {
            Color.black

            if let destination, let profile {
                DiscoverProfileLoadedState(
                    destination: destination,
                    profile: profile,
                    accentColor: accentColor,
                    metrics: metrics
                )

                DiscoverProfileActionBar(
                    destinationId: destination.id,
                    isSaved: isSaved,
                    isPlanning: isPlanning,
                    buttonWidth: metrics.actionButtonWidth,
                    horizontalPadding: metrics.horizontalPadding,
                    topPadding: metrics.actionBarTopPadding,
                    bottomPadding: metrics.actionBarInnerBottomPadding,
                    onToggleSaved: onToggleSaved,
                    onPlanTrip: onPlanTrip
                )
                .frame(width: metrics.pageSize.width, alignment: .center)
                .padding(.bottom, metrics.actionBarBottomInset)

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
                .frame(width: pageSize.width)
            } else {
                ContentUnavailableView(
                    "Discover is unavailable",
                    systemImage: "sparkles.rectangle.stack",
                    description: Text("Load the destination feed first.")
                )
                .foregroundStyle(.white)
                .frame(width: metrics.pageSize.width)
            }
        }
        .frame(width: metrics.pageSize.width, height: metrics.pageSize.height, alignment: .bottom)
    }
}

private struct DiscoverProfileLayoutMetrics {
    let pageSize: CGSize
    let bottomSafeInset: CGFloat
    
    let horizontalPadding: CGFloat = 24
    let sectionSpacing: CGFloat = 14
    let heroHeight: CGFloat = 320
    let storyTileHeight: CGFloat = 220
    let actionButtonWidth: CGFloat = 148
    let detailTrailingInset: CGFloat = 16
    let storySectionTopPadding: CGFloat = 20
    let storySectionBottomPadding: CGFloat = 28
    let actionBarTopPadding: CGFloat = 14
    let actionBarInnerBottomPadding: CGFloat = 20
    
    var contentWidth: CGFloat {
        max(pageSize.width - (horizontalPadding * 2), 0)
    }

    var storyTileWidth: CGFloat {
        max((contentWidth - sectionSpacing) / 2, 0)
    }
    
    var actionBarBottomInset: CGFloat {
        max(bottomSafeInset, 20)
    }

    var scrollBottomPadding: CGFloat {
        actionBarBottomInset + 110
    }
}

private struct DiscoverProfileLoadedState: View {
    let destination: DestinationSummary
    let profile: DestinationProfileView
    let accentColor: Color
    let metrics: DiscoverProfileLayoutMetrics

    var body: some View {
        ScrollView(.vertical) {
            VStack(spacing: 0) {
                DiscoverProfileHeroSection(
                    destination: destination,
                    contentWidth: metrics.contentWidth,
                    heroHeight: metrics.heroHeight,
                    horizontalPadding: metrics.horizontalPadding
                )
                DiscoverProfileDetailsSection(
                    profile: profile,
                    accentColor: accentColor,
                    metrics: metrics
                )
                DiscoverProfileStoriesSection(
                    stories: profile.stories,
                    accentColor: accentColor,
                    metrics: metrics
                )
            }
            .frame(width: metrics.pageSize.width, alignment: .topLeading)
        }
        .frame(width: metrics.pageSize.width, height: metrics.pageSize.height, alignment: .top)
        .padding(.bottom, metrics.scrollBottomPadding)
        .scrollIndicators(.hidden)
    }
}

private struct DiscoverProfileHeroSection: View {
    let destination: DestinationSummary
    let contentWidth: CGFloat
    let heroHeight: CGFloat
    let horizontalPadding: CGFloat

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            DiscoverHeroImage(destination: destination)
                .frame(height: heroHeight)

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
            .frame(width: contentWidth, alignment: .leading)
            .padding(.horizontal, horizontalPadding)
            .padding(.bottom, 28)
        }
        .frame(maxWidth: .infinity)
        .clipped()
    }
}

private struct DiscoverProfileDetailsSection: View {
    let profile: DestinationProfileView
    let accentColor: Color
    let metrics: DiscoverProfileLayoutMetrics

    var body: some View {
        DiscoverProfileSectionContainer(metrics: metrics) {
            VStack(spacing: 0) {
                DiscoverProfileLocationHeader(
                    city: profile.destination.city,
                    country: profile.destination.country,
                    accentColor: accentColor
                )
                .padding(.vertical, 18)

                Divider()
                    .overlay(Color.white.opacity(0.08))

                ForEach(Array(profile.details.enumerated()), id: \.element.id) { index, detail in
                    DiscoverProfileDetailRow(
                        detail: detail,
                        accentColor: accentColor,
                        trailingInset: metrics.detailTrailingInset
                    )

                    if index != profile.details.count - 1 {
                        Divider()
                            .overlay(Color.white.opacity(0.08))
                    }
                }
            }
        }
    }
}

private struct DiscoverProfileSectionContainer<Content: View>: View {
    let metrics: DiscoverProfileLayoutMetrics
    let topPadding: CGFloat
    let bottomPadding: CGFloat
    @ViewBuilder let content: Content

    init(
        metrics: DiscoverProfileLayoutMetrics,
        topPadding: CGFloat = 0,
        bottomPadding: CGFloat = 0,
        @ViewBuilder content: () -> Content
    ) {
        self.metrics = metrics
        self.topPadding = topPadding
        self.bottomPadding = bottomPadding
        self.content = content()
    }

    var body: some View {
        content
            .frame(width: metrics.contentWidth, alignment: .leading)
            .padding(.horizontal, metrics.horizontalPadding)
            .padding(.top, topPadding)
            .padding(.bottom, bottomPadding)
            .frame(width: metrics.pageSize.width, alignment: .leading)
            .background(Color.black)
    }
}

private struct DiscoverProfileLocationHeader: View {
    let city: String
    let country: String
    let accentColor: Color

    var body: some View {
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
                Text(city.uppercased())
                    .font(.system(size: 13, weight: .semibold, design: .monospaced))
                    .tracking(1.2)
                    .foregroundStyle(accentColor)

                Text(country.uppercased())
                    .font(.system(size: 11, weight: .regular, design: .monospaced))
                    .tracking(1.0)
                    .foregroundStyle(Color.white.opacity(0.66))
            }

            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

private struct DiscoverProfileDetailRow: View {
    let detail: DestinationProfileDetail
    let accentColor: Color
    let trailingInset: CGFloat

    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            Text(detail.label.uppercased())
                .font(.system(size: 11, weight: .semibold, design: .monospaced))
                .tracking(1.0)
                .foregroundStyle(accentColor)
                .fixedSize()

            Spacer(minLength: 12)

            HStack(spacing: 0) {
                Spacer(minLength: 0)

                Text(detail.value)
                    .font(.system(size: 15, weight: .medium, design: .default))
                    .foregroundStyle(.white)
                    .multilineTextAlignment(.trailing)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityIdentifier("discover.profile.detail.\(detail.accessibilityKey)")
            }
            .frame(maxWidth: .infinity, alignment: .trailing)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.trailing, trailingInset)
        .padding(.vertical, 16)
    }
}

private struct DiscoverProfileStoriesSection: View {
    let stories: [DestinationProfileStoryCard]
    let accentColor: Color
    let metrics: DiscoverProfileLayoutMetrics

    var body: some View {
        DiscoverProfileSectionContainer(
            metrics: metrics,
            topPadding: metrics.storySectionTopPadding,
            bottomPadding: metrics.storySectionBottomPadding
        ) {
            VStack(alignment: .leading, spacing: metrics.sectionSpacing) {
                ForEach(Array(storyRows.enumerated()), id: \.offset) { _, row in
                    DiscoverStoryRow(
                        stories: row,
                        accentColor: accentColor,
                        metrics: metrics
                    )
                }
            }
        }
    }

    private var storyRows: [[DestinationProfileStoryCard]] {
        stride(from: 0, to: stories.count, by: 2).map { index in
            Array(stories[index..<min(index + 2, stories.count)])
        }
    }
}

private struct DiscoverStoryRow: View {
    let stories: [DestinationProfileStoryCard]
    let accentColor: Color
    let metrics: DiscoverProfileLayoutMetrics

    var body: some View {
        HStack(alignment: .top, spacing: metrics.sectionSpacing) {
            ForEach(stories) { story in
                DiscoverStoryTile(story: story, accentColor: accentColor)
                    .frame(width: metrics.storyTileWidth, height: metrics.storyTileHeight)
            }

            if stories.count == 1 {
                Color.clear
                    .frame(width: metrics.storyTileWidth, height: metrics.storyTileHeight)
                    .accessibilityHidden(true)
            }
        }
        .frame(width: metrics.contentWidth, alignment: .leading)
    }
}

private struct DiscoverProfileActionBar: View {
    let destinationId: String
    let isSaved: Bool
    let isPlanning: Bool
    let buttonWidth: CGFloat
    let horizontalPadding: CGFloat
    let topPadding: CGFloat
    let bottomPadding: CGFloat
    let onToggleSaved: () -> Void
    let onPlanTrip: () -> Void

    var body: some View {
        HStack(alignment: .center, spacing: 12) {
            DiscoverSaveButton(
                isSaved: isSaved,
                label: "Save",
                fontWeight: .light,
                width: buttonWidth,
                accessibilityIdentifier: "discover.profile.saveButton.\(destinationId)",
                onTap: onToggleSaved
            )

            Spacer(minLength: 0)

            DiscoverPlanTripButton(
                title: "Plan Trip",
                isPlanning: isPlanning,
                fontWeight: .light,
                width: buttonWidth,
                isEnabled: !isPlanning,
                accessibilityIdentifier: "discover.profile.planTripButton.\(destinationId)",
                onTap: onPlanTrip
            )
        }
        .frame(maxWidth: .infinity)
        .padding(.horizontal, horizontalPadding)
        .padding(.top, topPadding)
        .padding(.bottom, bottomPadding)
        .background(Color.black.opacity(0.94))
        .overlay(alignment: .top) {
            Rectangle()
                .fill(Color.white.opacity(0.08))
                .frame(height: 1)
        }
    }
}

private struct DiscoverStoryTile: View {
    let story: DestinationProfileStoryCard
    let accentColor: Color

    var body: some View {
        GeometryReader { geometry in
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
                .frame(width: geometry.size.width, height: geometry.size.height)
                .clipped()

                LinearGradient(
                    colors: [
                        Color.clear,
                        Color.black.opacity(0.22),
                        Color.black.opacity(0.74)
                    ],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .frame(width: geometry.size.width, height: geometry.size.height)

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
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomLeading)
                .padding(.horizontal, 14)
                .padding(.bottom, 14)
            }
            .frame(width: geometry.size.width, height: geometry.size.height, alignment: .bottomLeading)
        }
        .background(Color.black)
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

private extension DestinationProfileDetail {
    var accessibilityKey: String {
        label
            .lowercased()
            .replacingOccurrences(of: "[^a-z0-9]+", with: "_", options: .regularExpression)
            .trimmingCharacters(in: CharacterSet(charactersIn: "_"))
    }
}
