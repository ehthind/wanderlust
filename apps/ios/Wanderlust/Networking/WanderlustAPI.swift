import Foundation

@MainActor
protocol WanderlustAPI {
    func fetchDiscoverFeed() async throws -> DiscoverFeedView
    func fetchFeaturedDiscoverCard() async throws -> FeaturedDiscoverCard
    func fetchDestinationProfile(destinationId: String) async throws -> DestinationProfileView
    func planTrip(_ input: PlanTripInput) async throws -> PlanTripResponse
    func fetchTripWorkspace(tripDraftId: String) async throws -> TripWorkspaceView
    func searchTripStays(tripDraftId: String, input: TripStaySearchInput) async throws -> TripStaySearchResult
    func selectTripStay(tripDraftId: String, offer: LodgingOfferSummary) async throws -> TripSelectedStay
}
