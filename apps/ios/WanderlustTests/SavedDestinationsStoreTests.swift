import XCTest
@testable import Wanderlust

final class SavedDestinationsStoreTests: XCTestCase {
    func testPersistsSavedDestinationIds() {
        let suiteName = "wanderlust.saved-destinations.tests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defaults.removePersistentDomain(forName: suiteName)

        let store = SavedDestinationsStore(defaults: defaults)
        store.saveSavedDestinationIds(["dest_paris", "dest_kyoto"])

        XCTAssertEqual(store.loadSavedDestinationIds(), Set(["dest_paris", "dest_kyoto"]))
    }
}
