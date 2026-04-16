import SwiftUI
import UIKit

private enum DiscoverSharedLayout {
    static let buttonWidth: CGFloat = 148
    static let buttonHeight: CGFloat = 52
    static let buttonHorizontalPadding: CGFloat = 16
    static let buttonContentSpacing: CGFloat = 10
    static let buttonCornerRadius: CGFloat = 16
    static let subtleStrokeWidth: CGFloat = 1
    static let heroFallbackGradientStartRadius: CGFloat = 40
    static let heroFallbackGradientEndRadius: CGFloat = 420
}

struct DiscoverSaveButton: View {
    let isSaved: Bool
    let label: String
    let fontWeight: Font.Weight
    let width: CGFloat
    let accessibilityIdentifier: String?
    let onTap: () -> Void

    init(
        isSaved: Bool,
        label: String,
        fontWeight: Font.Weight,
        width: CGFloat = DiscoverSharedLayout.buttonWidth,
        accessibilityIdentifier: String?,
        onTap: @escaping () -> Void
    ) {
        self.isSaved = isSaved
        self.label = label
        self.fontWeight = fontWeight
        self.width = width
        self.accessibilityIdentifier = accessibilityIdentifier
        self.onTap = onTap
    }

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: DiscoverSharedLayout.buttonContentSpacing) {
                Image(systemName: isSaved ? "bookmark.fill" : "bookmark")
                    .font(.system(size: 18, weight: fontWeight))

                Text(isSaved ? "Saved" : label)
                    .font(.system(size: 16, weight: fontWeight, design: .default))
            }
            .foregroundStyle(Color.white.opacity(isSaved ? 0.96 : 0.74))
            .padding(.horizontal, DiscoverSharedLayout.buttonHorizontalPadding)
            .frame(width: width, height: DiscoverSharedLayout.buttonHeight, alignment: .leading)
            .background(
                Color.white.opacity(0.06),
                in: RoundedRectangle(
                    cornerRadius: DiscoverSharedLayout.buttonCornerRadius,
                    style: .continuous
                )
            )
        }
        .buttonStyle(.plain)
        .accessibilityLabel(isSaved ? "Saved" : "Save")
        .accessibilityValue(isSaved ? "saved" : "unsaved")
        .accessibilityIdentifier(accessibilityIdentifier ?? "")
    }
}

struct DiscoverPlanTripButton: View {
    let title: String
    let isPlanning: Bool
    let fontWeight: Font.Weight
    let width: CGFloat
    let isEnabled: Bool
    let accessibilityIdentifier: String?
    let onTap: () -> Void

    init(
        title: String,
        isPlanning: Bool,
        fontWeight: Font.Weight,
        width: CGFloat = DiscoverSharedLayout.buttonWidth,
        isEnabled: Bool,
        accessibilityIdentifier: String?,
        onTap: @escaping () -> Void
    ) {
        self.title = title
        self.isPlanning = isPlanning
        self.fontWeight = fontWeight
        self.width = width
        self.isEnabled = isEnabled
        self.accessibilityIdentifier = accessibilityIdentifier
        self.onTap = onTap
    }

    var body: some View {
        Button(action: onTap) {
            Text(isPlanning ? "Building Trip..." : title)
                .font(.system(size: 16, weight: fontWeight, design: .default))
                .foregroundStyle(Color.white.opacity(0.92))
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color.black.opacity(0.01), in: Capsule(style: .continuous))
                .overlay {
                    Capsule(style: .continuous)
                        .strokeBorder(
                            Color.white.opacity(0.34),
                            lineWidth: DiscoverSharedLayout.subtleStrokeWidth
                        )
                }
        }
        .frame(width: width, height: DiscoverSharedLayout.buttonHeight)
        .buttonStyle(.plain)
        .disabled(!isEnabled)
        .accessibilityIdentifier(accessibilityIdentifier ?? "")
    }
}

struct DiscoverHeroImage: View {
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
                        startRadius: DiscoverSharedLayout.heroFallbackGradientStartRadius,
                        endRadius: DiscoverSharedLayout.heroFallbackGradientEndRadius
                    )
                )
        }
        .accessibilityLabel(destination.heroImageAccessibilityLabel)
    }
}

struct DiscoverSwipeCaptureView: UIViewRepresentable {
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
