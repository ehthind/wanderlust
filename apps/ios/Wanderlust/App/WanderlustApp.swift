import SwiftUI
import UIKit

@main
struct WanderlustApp: App {
    @StateObject private var appState = AppState()

    init() {
        configureTabBarAppearance()
    }

    var body: some Scene {
        WindowGroup {
            if let dynamicTypeSize = dynamicTypeSizeOverride {
                WanderlustRootView(appState: appState)
                    .environment(\.dynamicTypeSize, dynamicTypeSize)
            } else {
                WanderlustRootView(appState: appState)
            }
        }
    }

    private var dynamicTypeSizeOverride: DynamicTypeSize? {
        guard
            let rawValue = ProcessInfo.processInfo.environment["WANDERLUST_DYNAMIC_TYPE_SIZE"]?
                .trimmingCharacters(in: .whitespacesAndNewlines)
                .lowercased()
        else {
            return nil
        }

        switch rawValue {
        case "xsmall":
            return .xSmall
        case "small":
            return .small
        case "medium":
            return .medium
        case "large":
            return .large
        case "xlarge":
            return .xLarge
        case "xxlarge":
            return .xxLarge
        case "xxxlarge":
            return .xxxLarge
        case "accessibility1":
            return .accessibility1
        case "accessibility2":
            return .accessibility2
        case "accessibility3":
            return .accessibility3
        case "accessibility4":
            return .accessibility4
        case "accessibility5":
            return .accessibility5
        default:
            return nil
        }
    }

    private func configureTabBarAppearance() {
        let tabBar = UITabBar.appearance()
        tabBar.isHidden = true
        tabBar.isTranslucent = true
        tabBar.backgroundImage = UIImage()
        tabBar.shadowImage = UIImage()
    }
}
