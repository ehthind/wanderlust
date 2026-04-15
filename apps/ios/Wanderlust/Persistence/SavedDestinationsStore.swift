import Foundation

protocol SavedDestinationStoring {
    func loadSavedDestinationIds() -> Set<String>
    func saveSavedDestinationIds(_ destinationIds: Set<String>)
}

final class SavedDestinationsStore: SavedDestinationStoring {
    private let defaults: UserDefaults
    private let key = "wanderlust.savedDestinationIds"

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }

    func loadSavedDestinationIds() -> Set<String> {
        Set(defaults.stringArray(forKey: key) ?? [])
    }

    func saveSavedDestinationIds(_ destinationIds: Set<String>) {
        defaults.set(Array(destinationIds).sorted(), forKey: key)
    }
}
