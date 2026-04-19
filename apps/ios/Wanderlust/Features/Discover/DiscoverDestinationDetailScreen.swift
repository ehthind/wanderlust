import SwiftUI

private enum DiscoverDestinationDetailLayout {
    static let accentColor = Color(red: 0.85, green: 0.74, blue: 0.49)
    static let contentSpacing: CGFloat = 24
    static let sectionSpacing: CGFloat = 16
    static let cardCornerRadius: CGFloat = 24
    static let cardPadding: CGFloat = 20
    static let heroHeight: CGFloat = 280
    static let heroCornerRadius: CGFloat = 28
    static let heroTextSpacing: CGFloat = 10
    static let metadataSpacing: CGFloat = 16
    static let metadataLabelSpacing: CGFloat = 4
    static let storySpacing: CGFloat = 16
    static let storyCardWidth: CGFloat = 280
    static let accessibilityStoryCardWidth: CGFloat = 320
    static let storyImageHeight: CGFloat = 170
    static let storyTextSpacing: CGFloat = 10
    static let toolbarIconSize: CGFloat = 18
    static let actionPadding: CGFloat = 12
    static let actionBottomPaddingWithoutShell: CGFloat = 52
    static let buttonCornerRadius: CGFloat = 18
    static let borderWidth: CGFloat = 1
}

struct DiscoverDestinationDetailScreen: View {
    let destination: DestinationSummary
    let profile: DestinationProfileView?
    let isLoadingProfile: Bool
    let profileErrorMessage: String?
    let isSaved: Bool
    let isPlanning: Bool
    let showsBottomShell: Bool
    let onToggleSaved: () -> Void
    let onPlanTrip: () -> Void
    let onRetry: () -> Void

    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.wanderlustBottomShellMetrics) private var bottomShellMetrics

    private let accentColor = DiscoverDestinationDetailLayout.accentColor

    var body: some View {
        ZStack {
            backgroundGradient
                .ignoresSafeArea()

            ScrollView(.vertical) {
                LazyVStack(alignment: .leading, spacing: DiscoverDestinationDetailLayout.contentSpacing) {
                    heroSection
                    summarySection
                    profileStateSection
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.vertical, DiscoverDestinationDetailLayout.contentSpacing)
            }
            .contentMargins(.horizontal, 20, for: .scrollContent)
            .safeAreaPadding(.top, 12)
            .safeAreaPadding(.bottom, 12)
            .scrollIndicators(.hidden)
        }
        .navigationTitle(destination.city)
        .navigationBarTitleDisplayMode(.large)
        .toolbar(.visible, for: .navigationBar)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button(action: onToggleSaved) {
                    Image(systemName: isSaved ? "bookmark.fill" : "bookmark")
                        .font(.system(size: DiscoverDestinationDetailLayout.toolbarIconSize, weight: .semibold))
                }
                .accessibilityLabel(isSaved ? "Saved" : "Save")
                .accessibilityValue(isSaved ? "saved" : "unsaved")
                .accessibilityIdentifier("discover.detail.saveButton.\(destination.id)")
            }
        }
        .safeAreaInset(edge: .bottom, spacing: 0) {
            bottomActionBar
                .padding(
                    .bottom,
                    showsBottomShell
                        ? bottomShellMetrics.contentInset
                            + bottomShellMetrics.shellHeight
                            + bottomShellMetrics.bottomPadding
                        : max(
                            DiscoverDestinationDetailLayout.actionBottomPaddingWithoutShell,
                            bottomShellMetrics.bottomPadding
                        )
                )
        }
        .background(alignment: .topLeading) {
            Color.clear
                .frame(width: 1, height: 1)
                .allowsHitTesting(false)
                .accessibilityElement()
                .accessibilityIdentifier("discover.detail.screen.\(destination.id)")
        }
    }

    private var heroSection: some View {
        VStack(alignment: .leading, spacing: 18) {
            DiscoverHeroImage(destination: destination)
                .frame(maxWidth: .infinity)
                .frame(height: DiscoverDestinationDetailLayout.heroHeight)
                .clipShape(
                    RoundedRectangle(
                        cornerRadius: DiscoverDestinationDetailLayout.heroCornerRadius,
                        style: .continuous
                    )
                )
                .overlay {
                    RoundedRectangle(
                        cornerRadius: DiscoverDestinationDetailLayout.heroCornerRadius,
                        style: .continuous
                    )
                    .strokeBorder(cardBorderColor, lineWidth: DiscoverDestinationDetailLayout.borderWidth)
                }

            VStack(alignment: .leading, spacing: DiscoverDestinationDetailLayout.heroTextSpacing) {
                Text(destination.country.uppercased())
                    .font(.system(.footnote, design: .monospaced).weight(.semibold))
                    .tracking(1.1)
                    .foregroundStyle(accentColor)

                Text(destination.thesis)
                    .font(.system(.title3, design: .serif).weight(.semibold))
                    .foregroundStyle(.primary)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    private var summarySection: some View {
        DiscoverDestinationDetailSectionCard {
            VStack(alignment: .leading, spacing: DiscoverDestinationDetailLayout.sectionSpacing) {
                DiscoverDestinationDetailSectionHeader(
                    title: "Why Go",
                    accentColor: accentColor
                )

                Text(destination.thesis)
                    .font(.system(.body, design: .rounded))
                    .foregroundStyle(.primary)
                    .fixedSize(horizontal: false, vertical: true)

                Divider()

                VStack(alignment: .leading, spacing: 8) {
                    Text("Designed for quick conviction before planning.")
                        .font(.system(.subheadline, design: .rounded).weight(.semibold))
                        .foregroundStyle(.primary)

                    Text("Use the guide to get oriented, save it if it fits, and move into the trip workspace when you are ready to commit.")
                        .font(.system(.subheadline, design: .rounded))
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
    }

    @ViewBuilder
    private var profileStateSection: some View {
        if let profile {
            VStack(alignment: .leading, spacing: DiscoverDestinationDetailLayout.contentSpacing) {
                metadataSection(profile: profile)
                storiesSection(stories: profile.stories)
            }
        } else if isLoadingProfile {
            DiscoverDestinationDetailSectionCard {
                HStack(spacing: 12) {
                    ProgressView()
                    Text("Loading destination guide...")
                        .font(.system(.body, design: .rounded).weight(.medium))
                }
                .foregroundStyle(.primary)
                .background(alignment: .topLeading) {
                    Color.clear
                        .frame(width: 1, height: 1)
                        .allowsHitTesting(false)
                        .accessibilityElement()
                        .accessibilityIdentifier("discover.detail.loadingState.\(destination.id)")
                }
            }
        } else {
            DiscoverDestinationDetailSectionCard {
                ContentUnavailableView {
                    Label("Destination guide unavailable", systemImage: "map")
                } description: {
                    Text(profileErrorMessage ?? "Try again in a moment.")
                } actions: {
                    Button("Retry", action: onRetry)
                        .accessibilityIdentifier("discover.detail.retryButton.\(destination.id)")
                }
                .foregroundStyle(.primary)
                .background(alignment: .topLeading) {
                    Color.clear
                        .frame(width: 1, height: 1)
                        .allowsHitTesting(false)
                        .accessibilityElement()
                        .accessibilityIdentifier("discover.detail.errorState.\(destination.id)")
                }
            }
        }
    }

    private func metadataSection(profile: DestinationProfileView) -> some View {
        DiscoverDestinationDetailSectionCard {
            VStack(alignment: .leading, spacing: DiscoverDestinationDetailLayout.sectionSpacing) {
                DiscoverDestinationDetailSectionHeader(
                    title: "At A Glance",
                    accentColor: accentColor
                )

                VStack(alignment: .leading, spacing: DiscoverDestinationDetailLayout.metadataSpacing) {
                    ForEach(profile.details) { detail in
                        DiscoverDestinationDetailRow(detail: detail, accentColor: accentColor)
                    }
                }
            }
        }
    }

    private func storiesSection(stories: [DestinationProfileStoryCard]) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            DiscoverDestinationDetailSectionHeader(
                title: "Editorial Notes",
                accentColor: accentColor
            )
            .padding(.horizontal, DiscoverDestinationDetailLayout.cardPadding)

            ScrollView(.horizontal) {
                LazyHStack(alignment: .top, spacing: DiscoverDestinationDetailLayout.storySpacing) {
                    ForEach(stories) { story in
                        DiscoverDestinationStoryCard(story: story, accentColor: accentColor)
                    }
                }
                .padding(.horizontal, DiscoverDestinationDetailLayout.cardPadding)
                .padding(.vertical, 2)
            }
            .scrollIndicators(.hidden)
            .accessibilityIdentifier("discover.detail.storyRail.\(destination.id)")
        }
        .padding(.vertical, DiscoverDestinationDetailLayout.cardPadding)
        .background(cardBackground, in: RoundedRectangle(cornerRadius: DiscoverDestinationDetailLayout.cardCornerRadius, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: DiscoverDestinationDetailLayout.cardCornerRadius, style: .continuous)
                .strokeBorder(cardBorderColor, lineWidth: DiscoverDestinationDetailLayout.borderWidth)
        }
    }

    private var bottomActionBar: some View {
        Button(action: onPlanTrip) {
            HStack(spacing: 12) {
                if isPlanning {
                    ProgressView()
                        .tint(.white)
                }

                Text(isPlanning ? "Building Trip..." : "Plan Trip")
                    .font(.system(.headline, design: .rounded).weight(.bold))

                Spacer()

                Image(systemName: "arrow.right.circle.fill")
                    .font(.system(.title3, design: .rounded).weight(.semibold))
            }
            .foregroundStyle(.white)
            .padding(.horizontal, 18)
            .padding(.vertical, 16)
            .frame(maxWidth: .infinity)
            .background(
                accentColor,
                in: RoundedRectangle(
                    cornerRadius: DiscoverDestinationDetailLayout.buttonCornerRadius,
                    style: .continuous
                )
            )
        }
        .buttonStyle(.plain)
        .disabled(isPlanning)
        .accessibilityIdentifier("discover.detail.planButton.\(destination.id)")
        .padding(DiscoverDestinationDetailLayout.actionPadding)
        .background(
            .regularMaterial,
            in: RoundedRectangle(cornerRadius: 28, style: .continuous)
        )
        .overlay {
            RoundedRectangle(cornerRadius: 28, style: .continuous)
                .strokeBorder(cardBorderColor, lineWidth: DiscoverDestinationDetailLayout.borderWidth)
        }
        .padding(.horizontal, 20)
        .padding(.top, DiscoverDestinationDetailLayout.actionPadding)
    }

    private var backgroundGradient: some View {
        LinearGradient(
            colors: colorScheme == .dark
            ? [
                Color(red: 0.05, green: 0.05, blue: 0.06),
                Color(red: 0.08, green: 0.08, blue: 0.1),
                Color.black
            ]
            : [
                Color(red: 0.98, green: 0.97, blue: 0.94),
                Color(red: 0.93, green: 0.95, blue: 0.97),
                Color.white
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    private var cardBackground: some ShapeStyle {
        colorScheme == .dark
        ? AnyShapeStyle(Color.white.opacity(0.06))
        : AnyShapeStyle(Color.white.opacity(0.9))
    }

    private var cardBorderColor: Color {
        colorScheme == .dark ? Color.white.opacity(0.08) : Color.black.opacity(0.08)
    }
}

private struct DiscoverDestinationDetailSectionCard<Content: View>: View {
    @ViewBuilder let content: Content

    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        content
            .padding(DiscoverDestinationDetailLayout.cardPadding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                colorScheme == .dark
                ? Color.white.opacity(0.06)
                : Color.white.opacity(0.9),
                in: RoundedRectangle(
                    cornerRadius: DiscoverDestinationDetailLayout.cardCornerRadius,
                    style: .continuous
                )
            )
            .overlay {
                RoundedRectangle(
                    cornerRadius: DiscoverDestinationDetailLayout.cardCornerRadius,
                    style: .continuous
                )
                .strokeBorder(
                    colorScheme == .dark ? Color.white.opacity(0.08) : Color.black.opacity(0.08),
                    lineWidth: DiscoverDestinationDetailLayout.borderWidth
                )
            }
    }
}

private struct DiscoverDestinationDetailSectionHeader: View {
    let title: String
    let accentColor: Color

    var body: some View {
        Text(title.uppercased())
            .font(.system(.footnote, design: .monospaced).weight(.semibold))
            .tracking(1.1)
            .foregroundStyle(accentColor)
    }
}

private struct DiscoverDestinationDetailRow: View {
    let detail: DestinationProfileDetail
    let accentColor: Color

    var body: some View {
        VStack(alignment: .leading, spacing: DiscoverDestinationDetailLayout.metadataLabelSpacing) {
            Text(detail.label.uppercased())
                .font(.system(.caption, design: .monospaced).weight(.semibold))
                .tracking(1.0)
                .foregroundStyle(accentColor)

            Text(detail.value)
                .font(.system(.body, design: .rounded).weight(.semibold))
                .foregroundStyle(.primary)
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(detail.value)
                .accessibilityIdentifier("discover.detail.value.\(detail.accessibilityKey)")
        }
    }
}

private struct DiscoverDestinationStoryCard: View {
    let story: DestinationProfileStoryCard
    let accentColor: Color

    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    var body: some View {
        VStack(alignment: .leading, spacing: DiscoverDestinationDetailLayout.storyTextSpacing) {
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
            .frame(maxWidth: .infinity)
            .frame(height: DiscoverDestinationDetailLayout.storyImageHeight)
            .clipShape(
                RoundedRectangle(
                    cornerRadius: DiscoverDestinationDetailLayout.cardCornerRadius,
                    style: .continuous
                )
            )

            VStack(alignment: .leading, spacing: 8) {
                Text(story.category.uppercased())
                    .font(.system(.caption, design: .monospaced).weight(.semibold))
                    .tracking(1.0)
                    .foregroundStyle(accentColor)

                Text(story.title)
                    .font(.system(.headline, design: .serif).weight(.semibold))
                    .foregroundStyle(.primary)
                    .lineLimit(dynamicTypeSize.isAccessibilitySize ? nil : 4)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(16)
        .frame(width: dynamicTypeSize.isAccessibilitySize ? DiscoverDestinationDetailLayout.accessibilityStoryCardWidth : DiscoverDestinationDetailLayout.storyCardWidth, alignment: .topLeading)
        .background(
            colorScheme == .dark
            ? Color.white.opacity(0.06)
            : Color.white.opacity(0.94),
            in: RoundedRectangle(
                cornerRadius: DiscoverDestinationDetailLayout.cardCornerRadius,
                style: .continuous
            )
        )
        .overlay {
            RoundedRectangle(
                cornerRadius: DiscoverDestinationDetailLayout.cardCornerRadius,
                style: .continuous
            )
            .strokeBorder(
                colorScheme == .dark ? Color.white.opacity(0.08) : Color.black.opacity(0.08),
                lineWidth: DiscoverDestinationDetailLayout.borderWidth
            )
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(story.category). \(story.title)")
        .accessibilityIdentifier("discover.detail.story.\(story.id)")
    }

    private var fallbackBackground: some View {
        LinearGradient(
            colors: colorScheme == .dark
            ? [
                Color(red: 0.24, green: 0.23, blue: 0.22),
                Color(red: 0.08, green: 0.08, blue: 0.09),
                Color.black
            ]
            : [
                Color(red: 0.95, green: 0.92, blue: 0.88),
                Color(red: 0.88, green: 0.92, blue: 0.95),
                Color.white
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
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

private let previewDestination = DestinationSummary(
    id: "dest_paris",
    slug: "paris",
    city: "Paris",
    country: "France",
    thesis: "Go for the late-night glow, layered history, and beauty as part of daily life.",
    bestSeason: "Apr-Oct",
    budget: "$$$",
    visa: "Visa-free",
    idealTripLength: "4-7 days",
    heroImageUrl: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1600&q=80",
    heroImageAccessibilityLabel: "Eiffel Tower and Paris rooftops in the evening light"
)

private let previewProfile = DestinationProfileView(
    destination: previewDestination,
    details: [
        DestinationProfileDetail(label: "Best season", value: "Apr-Oct"),
        DestinationProfileDetail(label: "Budget", value: "$$$"),
        DestinationProfileDetail(label: "Visa", value: "Visa-free"),
        DestinationProfileDetail(label: "Trip length", value: "4-7 days")
    ],
    stories: [
        DestinationProfileStoryCard(
            id: "preview-story-1",
            category: "Neighborhood",
            title: "Walk Saint-Germain before the city fully wakes up.",
            imageUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80",
            imageAccessibilityLabel: "Morning light on a Parisian street near Saint-Germain-des-Pres"
        ),
        DestinationProfileStoryCard(
            id: "preview-story-2",
            category: "Dining",
            title: "Book one long dinner and leave the rest for terraces.",
            imageUrl: "https://images.unsplash.com/photo-1522093007474-d86e9bf7ba6f?auto=format&fit=crop&w=1200&q=80",
            imageAccessibilityLabel: "Paris cafe tables set outside along a narrow street"
        )
    ]
)

struct DiscoverDestinationDetailScreen_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            previewScreen(isSaved: false)
                .previewDevice("iPhone 16")
                .previewDisplayName("Destination Detail / iPhone 16")

            previewScreen(isSaved: true)
                .previewDevice("iPhone 16 Pro Max")
                .previewDisplayName("Destination Detail / iPhone 16 Pro Max")

            previewScreen(isSaved: false)
                .previewDevice("iPhone 16")
                .environment(\.dynamicTypeSize, .accessibility3)
                .previewDisplayName("Destination Detail / Accessibility")
        }
    }

    private static func previewScreen(isSaved: Bool) -> some View {
        NavigationStack {
            DiscoverDestinationDetailScreen(
                destination: previewDestination,
                profile: previewProfile,
                isLoadingProfile: false,
                profileErrorMessage: nil,
                isSaved: isSaved,
                isPlanning: false,
                showsBottomShell: false,
                onToggleSaved: {},
                onPlanTrip: {},
                onRetry: {}
            )
        }
    }
}
