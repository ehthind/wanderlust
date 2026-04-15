import Foundation

protocol LastTripStoring {
    func loadTripDraftId() -> String?
    func saveTripDraftId(_ tripDraftId: String?)
}

final class LastTripStore: LastTripStoring {
    private let defaults: UserDefaults
    private let key = "wanderlust.lastTripDraftId"

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }

    func loadTripDraftId() -> String? {
        defaults.string(forKey: key)
    }

    func saveTripDraftId(_ tripDraftId: String?) {
        defaults.set(tripDraftId, forKey: key)
    }
}
