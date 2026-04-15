import XCTest
@testable import Wanderlust

final class DiscoverViewModelTests: XCTestCase {
    final class MockSavedDestinationsStore: SavedDestinationStoring {
        private(set) var savedDestinationIds: Set<String>
        private(set) var saveCallCount = 0

        init(savedDestinationIds: Set<String> = []) {
            self.savedDestinationIds = savedDestinationIds
        }

        func loadSavedDestinationIds() -> Set<String> {
            savedDestinationIds
        }

        func saveSavedDestinationIds(_ destinationIds: Set<String>) {
            saveCallCount += 1
            savedDestinationIds = destinationIds
        }
    }

    @MainActor
    final class MockAPI: WanderlustAPI {
        let feed: DiscoverFeedView
        let profiles: [String: DestinationProfileView]
        private(set) var lastPlanTripInput: PlanTripInput?
        private(set) var fetchedProfileDestinationIds: [String] = []

        init() {
            let destinations = [
                MockAPI.makeDestination(id: "dest_paris", slug: "paris", city: "Paris", country: "France"),
                MockAPI.makeDestination(id: "dest_kyoto", slug: "kyoto", city: "Kyoto", country: "Japan"),
                MockAPI.makeDestination(id: "dest_mexico_city", slug: "mexico-city", city: "Mexico City", country: "Mexico")
            ]

            self.feed = DiscoverFeedView(
                cards: destinations.map { destination in
                    MockAPI.makeCard(destination: destination)
                }
            )
            self.profiles = Dictionary(
                uniqueKeysWithValues: destinations.map { destination in
                    (destination.id, MockAPI.makeProfile(destination: destination))
                }
            )
        }

        func fetchDiscoverFeed() async throws -> DiscoverFeedView {
            feed
        }

        func fetchFeaturedDiscoverCard() async throws -> FeaturedDiscoverCard {
            feed.cards[0]
        }

        func fetchDestinationProfile(destinationId: String) async throws -> DestinationProfileView {
            fetchedProfileDestinationIds.append(destinationId)
            if let profile = profiles[destinationId] {
                return profile
            }

            throw APIClientError.server(statusCode: 404, message: "Destination \(destinationId) was not found.")
        }

        func planTrip(_ input: PlanTripInput) async throws -> PlanTripResponse {
            lastPlanTripInput = input
            return PlanTripResponse(
                tripDraft: TripDraft(
                    id: "trip_\(input.destinationId)",
                    destinationId: input.destinationId,
                    travelerCount: input.travelerCount,
                    vibe: input.vibe,
                    budgetStyle: input.budgetStyle,
                    status: .planning,
                    workflowId: "wf_\(input.destinationId)",
                    workflowRunId: "run_\(input.destinationId)",
                    workflowStatus: .running,
                    planSummary: nil,
                    travelMonth: nil,
                    tripNights: nil,
                    adults: nil
                ),
                execution: TripExecutionSummary(
                    workflowId: "wf_\(input.destinationId)",
                    runId: "run_\(input.destinationId)",
                    status: .running
                )
            )
        }

        func fetchTripWorkspace(tripDraftId: String) async throws -> TripWorkspaceView {
            TripWorkspaceView(
                tripDraft: TripDraft(
                    id: tripDraftId,
                    destinationId: "dest_paris",
                    travelerCount: 2,
                    vibe: "romantic",
                    budgetStyle: .balanced,
                    status: .planning,
                    workflowId: nil,
                    workflowRunId: nil,
                    workflowStatus: .running,
                    planSummary: nil,
                    travelMonth: nil,
                    tripNights: nil,
                    adults: nil
                ),
                execution: nil,
                staySearch: TripStaySearchPreferences(travelMonth: nil, tripNights: nil, adults: nil),
                selectedStay: nil
            )
        }

        func searchTripStays(tripDraftId: String, input: TripStaySearchInput) async throws -> TripStaySearchResult {
            TripStaySearchResult(candidateWindows: [], offers: [])
        }

        func selectTripStay(tripDraftId: String, offer: LodgingOfferSummary) async throws -> TripSelectedStay {
            TripSelectedStay(
                provider: offer.provider,
                windowId: offer.windowId,
                windowLabel: offer.windowLabel,
                checkin: offer.checkin,
                checkout: offer.checkout,
                nights: offer.nights,
                propertyId: offer.propertyId,
                roomId: offer.roomId,
                rateId: offer.rateId,
                propertyName: offer.propertyName,
                roomName: offer.roomName,
                imageUrl: offer.imageUrl,
                addressLine1: offer.addressLine1,
                city: offer.city,
                countryCode: offer.countryCode,
                starRating: offer.starRating,
                reviewScore: offer.reviewScore,
                totalPrice: offer.totalPrice,
                nightlyPrice: offer.nightlyPrice,
                currency: offer.currency,
                cancellationSummary: offer.cancellationSummary,
                currentRefundability: offer.currentRefundability,
                amenities: offer.amenities,
                selectedAt: "2026-04-15T00:00:00.000Z"
            )
        }

        private static func makeDestination(id: String, slug: String, city: String, country: String) -> DestinationSummary {
            DestinationSummary(
                id: id,
                slug: slug,
                city: city,
                country: country,
                thesis: "Glow",
                bestSeason: "Apr-Oct",
                budget: "$$$",
                visa: "Visa-free",
                idealTripLength: "4-7 days",
                heroImageUrl: "https://example.test/\(slug).jpg",
                heroImageAccessibilityLabel: "\(city) skyline"
            )
        }

        private static func makeCard(destination: DestinationSummary) -> FeaturedDiscoverCard {
            FeaturedDiscoverCard(
                destination: destination,
                chips: [
                    FeaturedDiscoverChip(label: "Best season", value: "Apr-Oct")
                ],
                cues: FeaturedDiscoverCues(
                    primaryAction: "Plan Trip",
                    secondaryAction: "Save",
                    gestureHint: "Swipe for next destination"
                )
            )
        }

        private static func makeProfile(destination: DestinationSummary) -> DestinationProfileView {
            DestinationProfileView(
                destination: destination,
                details: [
                    DestinationProfileDetail(label: "Best season", value: "Apr-Oct"),
                    DestinationProfileDetail(label: "Budget", value: "$$$"),
                    DestinationProfileDetail(label: "Visa", value: "Visa-free"),
                    DestinationProfileDetail(label: "Trip length", value: "4-7 days")
                ],
                stories: (1...8).map { index in
                    DestinationProfileStoryCard(
                        id: "\(destination.slug)-story-\(index)",
                        category: "Dining",
                        title: "Story \(index)",
                        imageUrl: "https://example.test/\(destination.slug)-story-\(index).jpg",
                        imageAccessibilityLabel: "\(destination.city) story \(index)"
                    )
                }
            )
        }
    }

    @MainActor
    func testLoadDefaultsCurrentCardToFirstFeedCardAndPrefetchesProfile() async {
        let api = MockAPI()
        let store = MockSavedDestinationsStore()
        let viewModel = DiscoverViewModel(
            api: api,
            onTripCreated: { _ in },
            savedDestinationsStore: store
        )

        await viewModel.loadIfNeeded()

        XCTAssertEqual(viewModel.cards.count, 3)
        XCTAssertEqual(viewModel.currentCard?.destination.id, "dest_paris")
        XCTAssertEqual(viewModel.currentProfile?.destination.id, "dest_paris")
        XCTAssertEqual(api.fetchedProfileDestinationIds, ["dest_paris"])
    }

    @MainActor
    func testChangingCurrentCardPrefetchesAndCachesMatchingProfile() async {
        let api = MockAPI()
        let store = MockSavedDestinationsStore()
        let viewModel = DiscoverViewModel(
            api: api,
            onTripCreated: { _ in },
            savedDestinationsStore: store
        )

        await viewModel.loadIfNeeded()
        viewModel.setCurrentCard(destinationId: "dest_kyoto")
        await viewModel.prefetchCurrentProfileIfNeeded()

        XCTAssertEqual(viewModel.currentCard?.destination.id, "dest_kyoto")
        XCTAssertEqual(viewModel.currentProfile?.destination.id, "dest_kyoto")
        XCTAssertEqual(api.fetchedProfileDestinationIds, ["dest_paris", "dest_kyoto"])

        await viewModel.prefetchCurrentProfileIfNeeded()
        XCTAssertEqual(api.fetchedProfileDestinationIds, ["dest_paris", "dest_kyoto"])
    }

    @MainActor
    func testPlanTripUsesCurrentVisibleDestination() async {
        let api = MockAPI()
        let store = MockSavedDestinationsStore()
        var openedTripId: String?
        let viewModel = DiscoverViewModel(
            api: api,
            onTripCreated: { openedTripId = $0 },
            savedDestinationsStore: store
        )

        await viewModel.loadIfNeeded()
        viewModel.setCurrentCard(destinationId: "dest_mexico_city")
        await viewModel.planTrip()

        XCTAssertEqual(api.lastPlanTripInput?.destinationId, "dest_mexico_city")
        XCTAssertEqual(openedTripId, "trip_dest_mexico_city")
    }

    @MainActor
    func testToggleSavedPersistsDestinationIdsLocallyAndSharesStateWithProfile() async {
        let api = MockAPI()
        let store = MockSavedDestinationsStore(savedDestinationIds: ["dest_kyoto"])
        let viewModel = DiscoverViewModel(
            api: api,
            onTripCreated: { _ in },
            savedDestinationsStore: store
        )

        await viewModel.loadIfNeeded()
        XCTAssertTrue(viewModel.isSaved(destinationId: "dest_kyoto"))
        XCTAssertEqual(viewModel.currentProfile?.destination.id, "dest_paris")

        viewModel.toggleSaved(destinationId: viewModel.currentProfile?.destination.id ?? "")
        XCTAssertTrue(viewModel.isSaved(destinationId: "dest_paris"))
        XCTAssertTrue(store.savedDestinationIds.contains("dest_paris"))

        viewModel.toggleSaved(destinationId: "dest_mexico_city")
        XCTAssertTrue(viewModel.isSaved(destinationId: "dest_mexico_city"))
        XCTAssertTrue(store.savedDestinationIds.contains("dest_mexico_city"))

        viewModel.toggleSaved(destinationId: "dest_mexico_city")
        XCTAssertFalse(viewModel.isSaved(destinationId: "dest_mexico_city"))
        XCTAssertEqual(store.saveCallCount, 3)
    }

    @MainActor
    func testAppStateResetsDiscoverSurfaceWhenLeavingDiscover() async {
        let appState = AppState(
            environment: .init(baseURL: URL(string: "https://example.test")!, useFixtures: true),
            api: MockAPI(),
            lastTripStore: InMemoryLastTripStore(),
            savedDestinationsStore: MockSavedDestinationsStore()
        )

        appState.discoverSurface = .profile
        appState.selectedTab = .trips
        XCTAssertEqual(appState.discoverSurface, .feed)

        appState.discoverSurface = .profile
        appState.openTrip("trip_dest_paris")
        XCTAssertEqual(appState.selectedTab, .trips)
        XCTAssertEqual(appState.discoverSurface, .feed)
    }
}

private final class InMemoryLastTripStore: LastTripStoring {
    private var tripDraftId: String?

    func loadTripDraftId() -> String? {
        tripDraftId
    }

    func saveTripDraftId(_ tripDraftId: String?) {
        self.tripDraftId = tripDraftId
    }
}
