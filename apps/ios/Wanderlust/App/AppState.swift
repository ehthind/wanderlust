import Foundation
import SwiftUI

@MainActor
final class AppState: ObservableObject {
    enum Tab: Hashable {
        case discover
        case trips
        case search
        case inbox
    }

    enum DiscoverSurface: Hashable {
        case feed
        case profile
    }

    @Published var selectedTab: Tab = .discover {
        didSet {
            if selectedTab != .discover {
                discoverSurface = .feed
            }
        }
    }
    @Published var discoverSurface: DiscoverSurface = .feed
    @Published var activeTripDraftId: String?

    let api: any WanderlustAPI
    let savedDestinationsStore: any SavedDestinationStoring

    private let lastTripStore: any LastTripStoring

    init(
        environment: AppEnvironment = .current,
        api: (any WanderlustAPI)? = nil,
        lastTripStore: (any LastTripStoring)? = nil,
        savedDestinationsStore: (any SavedDestinationStoring)? = nil
    ) {
        let tripStore = lastTripStore ?? LastTripStore()
        let destinationStore = savedDestinationsStore ?? SavedDestinationsStore()
        self.lastTripStore = tripStore
        self.savedDestinationsStore = destinationStore
        if ProcessInfo.processInfo.environment["WANDERLUST_RESET_STATE"] == "1" {
            tripStore.saveTripDraftId(nil)
            destinationStore.saveSavedDestinationIds(Set<String>())
        }
        self.activeTripDraftId = tripStore.loadTripDraftId()
        self.api = api ?? (environment.useFixtures ? FixtureAPIService() : APIClient(environment: environment))
    }

    func openTrip(_ tripDraftId: String) {
        activeTripDraftId = tripDraftId
        lastTripStore.saveTripDraftId(tripDraftId)
        discoverSurface = .feed
        selectedTab = .trips
    }
}
