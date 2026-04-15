import Foundation

struct AppEnvironment: Equatable {
    let baseURL: URL
    let useFixtures: Bool

    static var current: AppEnvironment {
        let processInfo = ProcessInfo.processInfo
        let baseURLString = processInfo.environment["WANDERLUST_API_BASE_URL"] ?? "http://127.0.0.1:3000"
        let baseURL = URL(string: baseURLString) ?? URL(string: "http://127.0.0.1:3000")!
        let fixturesOverride = parseBool(processInfo.environment["WANDERLUST_USE_FIXTURES"])

        return AppEnvironment(
            baseURL: baseURL,
            useFixtures: fixturesOverride ?? defaultUseFixtures
        )
    }

    private static var defaultUseFixtures: Bool {
#if DEBUG
        true
#else
        false
#endif
    }

    private static func parseBool(_ value: String?) -> Bool? {
        guard let normalized = value?.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() else {
            return nil
        }

        switch normalized {
        case "1", "true", "yes", "on":
            return true
        case "0", "false", "no", "off":
            return false
        default:
            return nil
        }
    }
}
