import XCTest
@testable import Wanderlust

final class LastTripStoreTests: XCTestCase {
    func testPersistsLastTripDraftId() {
        let suiteName = "wanderlust.tests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defaults.removePersistentDomain(forName: suiteName)

        let store = LastTripStore(defaults: defaults)
        store.saveTripDraftId("trip_123")

        XCTAssertEqual(store.loadTripDraftId(), "trip_123")
    }
}
