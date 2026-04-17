import Foundation

@MainActor
final class DiscoverViewModel: ObservableObject {
    @Published private(set) var cards: [FeaturedDiscoverCard] = []
    @Published private(set) var currentCardId: String?
    @Published private(set) var isLoading = false
    @Published private(set) var isPlanning = false
    @Published private(set) var savedDestinationIds: Set<String>
    @Published private(set) var destinationProfiles: [String: DestinationProfileView] = [:]
    @Published private(set) var loadingProfileDestinationIds: Set<String> = []
    @Published private(set) var profileErrors: [String: String] = [:]
    @Published var errorMessage: String?

    private let api: any WanderlustAPI
    private let onTripCreated: (String) -> Void
    private let savedDestinationsStore: any SavedDestinationStoring
    private var hasLoaded = false

    init(
        api: any WanderlustAPI,
        onTripCreated: @escaping (String) -> Void,
        savedDestinationsStore: any SavedDestinationStoring
    ) {
        self.api = api
        self.onTripCreated = onTripCreated
        self.savedDestinationsStore = savedDestinationsStore
        self.savedDestinationIds = savedDestinationsStore.loadSavedDestinationIds()
    }

    var currentCard: FeaturedDiscoverCard? {
        guard !cards.isEmpty else { return nil }

        if let currentCardId {
            return cards.first(where: { $0.destination.id == currentCardId }) ?? cards[0]
        }

        return cards[0]
    }

    var currentProfile: DestinationProfileView? {
        guard let destinationId = currentCard?.destination.id else { return nil }
        return destinationProfiles[destinationId]
    }

    func destination(destinationId: String) -> DestinationSummary? {
        cards.first(where: { $0.destination.id == destinationId })?.destination
    }

    func destinationProfile(destinationId: String) -> DestinationProfileView? {
        destinationProfiles[destinationId]
    }

    func loadIfNeeded() async {
        guard !hasLoaded else { return }
        hasLoaded = true
        await reload()
    }

    func reload() async {
        isLoading = true
        defer { isLoading = false }

        do {
            let feed = try await api.fetchDiscoverFeed()
            cards = feed.cards
            if currentCardId == nil || cards.contains(where: { $0.destination.id == currentCardId }) == false {
                currentCardId = cards.first?.destination.id
            }
            errorMessage = nil
            await prefetchCurrentProfileIfNeeded()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func setCurrentCard(destinationId: String?) {
        guard let destinationId, cards.contains(where: { $0.destination.id == destinationId }) else {
            if currentCardId == nil {
                currentCardId = cards.first?.destination.id
            }
            return
        }

        let didChange = currentCardId != destinationId
        currentCardId = destinationId
        if didChange {
            Task {
                await self.prefetchCurrentProfileIfNeeded()
            }
        }
    }

    func isSaved(destinationId: String) -> Bool {
        savedDestinationIds.contains(destinationId)
    }

    func toggleSaved(destinationId: String) {
        var nextSavedDestinationIds = savedDestinationIds
        if nextSavedDestinationIds.contains(destinationId) {
            nextSavedDestinationIds.remove(destinationId)
        } else {
            nextSavedDestinationIds.insert(destinationId)
        }

        savedDestinationIds = nextSavedDestinationIds
        savedDestinationsStore.saveSavedDestinationIds(nextSavedDestinationIds)
    }

    func isProfileLoading(destinationId: String) -> Bool {
        loadingProfileDestinationIds.contains(destinationId)
    }

    func profileError(destinationId: String) -> String? {
        profileErrors[destinationId]
    }

    func prefetchCurrentProfileIfNeeded() async {
        guard let destinationId = currentCard?.destination.id else { return }
        await loadDestinationProfile(destinationId: destinationId, force: false)
    }

    func retryCurrentProfile() async {
        guard let destinationId = currentCard?.destination.id else { return }
        await loadDestinationProfile(destinationId: destinationId, force: true)
    }

    func loadDestinationProfileIfNeeded(destinationId: String) async {
        await loadDestinationProfile(destinationId: destinationId, force: false)
    }

    func retryDestinationProfile(destinationId: String) async {
        await loadDestinationProfile(destinationId: destinationId, force: true)
    }

    func planTrip() async {
        guard let destinationId = currentCard?.destination.id else { return }
        await planTrip(destinationId: destinationId)
    }

    func planTrip(destinationId: String) async {
        isPlanning = true
        defer { isPlanning = false }

        do {
            let response = try await api.planTrip(
                PlanTripInput(
                    destinationId: destinationId,
                    travelerCount: 2,
                    vibe: "romantic",
                    budgetStyle: .balanced
                )
            )

            errorMessage = nil
            onTripCreated(response.tripDraft.id)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func loadDestinationProfile(destinationId: String, force: Bool) async {
        if !force, destinationProfiles[destinationId] != nil || loadingProfileDestinationIds.contains(destinationId) {
            return
        }

        loadingProfileDestinationIds.insert(destinationId)
        profileErrors[destinationId] = nil
        defer { loadingProfileDestinationIds.remove(destinationId) }

        do {
            destinationProfiles[destinationId] = try await api.fetchDestinationProfile(destinationId: destinationId)
        } catch {
            profileErrors[destinationId] = error.localizedDescription
        }
    }
}
