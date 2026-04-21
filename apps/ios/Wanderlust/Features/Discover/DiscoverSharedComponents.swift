import SwiftUI
import UIKit

private enum DiscoverSharedLayout {
    static let buttonHeight: CGFloat = 46
    static let iconButtonSize: CGFloat = 46
    static let subtleStrokeWidth: CGFloat = 1
    static let heroFallbackGradientStartRadius: CGFloat = 40
    static let heroFallbackGradientEndRadius: CGFloat = 420
}

struct DiscoverSaveButton: View {
    let isSaved: Bool
    let fontWeight: Font.Weight
    let accessibilityIdentifier: String?
    let onTap: () -> Void

    init(
        isSaved: Bool,
        fontWeight: Font.Weight,
        accessibilityIdentifier: String?,
        onTap: @escaping () -> Void
    ) {
        self.isSaved = isSaved
        self.fontWeight = fontWeight
        self.accessibilityIdentifier = accessibilityIdentifier
        self.onTap = onTap
    }

    var body: some View {
        Group {
            if #available(iOS 26.0, *) {
                Button(action: onTap) {
                    icon
                }
                .buttonBorderShape(.circle)
                .tint(isSaved ? savedTint : clearTint)
                .if(isSaved) { view in
                    view.buttonStyle(.glassProminent)
                }
                .if(!isSaved) { view in
                    view.buttonStyle(.glass)
                }
            } else {
                Button(action: onTap) {
                    icon
                }
                .buttonStyle(.plain)
                .background {
                    Circle()
                        .fill(.ultraThinMaterial)
                        .overlay {
                            if isSaved {
                                Circle()
                                    .fill(savedTint.opacity(colorScheme == .dark ? 0.3 : 0.4))
                            }
                        }
                        .overlay {
                            Circle()
                                .strokeBorder(
                                    isSaved ? savedStrokeColor : outlineColor,
                                    lineWidth: DiscoverSharedLayout.subtleStrokeWidth
                                )
                        }
                }
            }
        }
        .frame(
            width: DiscoverSharedLayout.iconButtonSize,
            height: DiscoverSharedLayout.iconButtonSize
        )
        .contentShape(Circle())
        .accessibilityLabel(isSaved ? "Saved" : "Save")
        .accessibilityValue(isSaved ? "saved" : "unsaved")
        .accessibilityIdentifier(accessibilityIdentifier ?? "")
    }

    @Environment(\.colorScheme) private var colorScheme

    private var icon: some View {
        Image(systemName: isSaved ? "bookmark.fill" : "bookmark")
            .font(.system(size: 18, weight: fontWeight))
            .foregroundStyle(isSaved ? Color.primary : Color.secondary)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var clearTint: Color {
        colorScheme == .dark ? Color.white.opacity(0.03) : Color.white.opacity(0.06)
    }

    private var savedTint: Color {
        Color(red: 0.95, green: 0.92, blue: 0.85).opacity(colorScheme == .dark ? 0.15 : 0.22)
    }

    private var outlineColor: Color {
        colorScheme == .dark ? Color.white.opacity(0.08) : Color.black.opacity(0.06)
    }

    private var savedStrokeColor: Color {
        colorScheme == .dark ? Color.white.opacity(0.12) : Color.white.opacity(0.2)
    }
}

struct DiscoverPlanTripButton: View {
    let isPlanning: Bool
    let isEnabled: Bool
    let accessibilityIdentifier: String?
    let onTap: () -> Void

    init(
        isPlanning: Bool,
        isEnabled: Bool,
        accessibilityIdentifier: String?,
        onTap: @escaping () -> Void
    ) {
        self.isPlanning = isPlanning
        self.isEnabled = isEnabled
        self.accessibilityIdentifier = accessibilityIdentifier
        self.onTap = onTap
    }

    var body: some View {
        Group {
            if #available(iOS 26.0, *) {
                Button(action: onTap) {
                    icon
                }
                .buttonBorderShape(.circle)
                .buttonStyle(.glass)
                .tint(clearTint)
            } else {
                Button(action: onTap) {
                    icon
                }
                .buttonStyle(.plain)
                .background {
                    Circle()
                        .fill(.ultraThinMaterial)
                        .overlay {
                            Circle()
                                .strokeBorder(outlineColor, lineWidth: DiscoverSharedLayout.subtleStrokeWidth)
                        }
                }
            }
        }
        .frame(width: DiscoverSharedLayout.iconButtonSize, height: DiscoverSharedLayout.iconButtonSize)
        .contentShape(Circle())
        .disabled(!isEnabled)
        .accessibilityLabel("Plan Trip")
        .accessibilityValue(isPlanning ? "planning" : "ready")
        .accessibilityIdentifier(accessibilityIdentifier ?? "")
    }

    @Environment(\.colorScheme) private var colorScheme

    private var icon: some View {
        Group {
            if isPlanning {
                ProgressView()
                    .tint(.primary)
            } else {
                Image(systemName: "airplane")
                    .font(.system(size: 18, weight: .medium))
                    .foregroundStyle(Color.primary)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var clearTint: Color {
        colorScheme == .dark ? Color.white.opacity(0.04) : Color.white.opacity(0.07)
    }

    private var outlineColor: Color {
        colorScheme == .dark ? Color.white.opacity(0.08) : Color.black.opacity(0.06)
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
