import XCTest
@testable import Wanderlust

@MainActor
final class TripWorkspaceViewModelTests: XCTestCase {
    @MainActor
    final class MockAPI: WanderlustAPI {
        var featuredCard = FeaturedDiscoverCard(
            destination: DestinationSummary(
                id: "dest_paris",
                slug: "paris",
                city: "Paris",
                country: "France",
                thesis: "Glow",
                bestSeason: "Apr-Oct",
                budget: "$$$",
                visa: "Visa-free",
                idealTripLength: "4-7 days",
                heroImageUrl: "https://example.test/paris.jpg",
                heroImageAccessibilityLabel: "Paris skyline"
            ),
            chips: [],
            cues: FeaturedDiscoverCues(primaryAction: "Plan Trip", secondaryAction: "Save", gestureHint: "Swipe")
        )
        lazy var feed = DiscoverFeedView(cards: [featuredCard])
        var workspace = TripWorkspaceView(
            tripDraft: TripDraft(
                id: "trip_123",
                destinationId: "dest_paris",
                travelerCount: 2,
                vibe: "romantic",
                budgetStyle: .balanced,
                status: .planning,
                workflowId: "wf_123",
                workflowRunId: "run_123",
                workflowStatus: .running,
                planSummary: nil,
                travelMonth: "2026-05",
                tripNights: 4,
                adults: 2
            ),
            execution: TripExecutionSummary(workflowId: "wf_123", runId: "run_123", status: .running),
            staySearch: TripStaySearchPreferences(travelMonth: "2026-05", tripNights: 4, adults: 2),
            selectedStay: nil
        )
        var searchResult = TripStaySearchResult(
            candidateWindows: [
                CandidateDateWindow(
                    id: "2026-05-01_2026-05-05",
                    label: "Fri, May 1 - Tue, May 5",
                    checkin: "2026-05-01",
                    checkout: "2026-05-05",
                    nights: 4
                )
            ],
            offers: [
                LodgingOfferSummary(
                    provider: "expedia-rapid",
                    windowId: "2026-05-01_2026-05-05",
                    windowLabel: "Fri, May 1 - Tue, May 5",
                    checkin: "2026-05-01",
                    checkout: "2026-05-05",
                    nights: 4,
                    propertyId: "property_1",
                    roomId: "room_1",
                    rateId: "rate_1",
                    propertyName: "Maison Rive",
                    roomName: "River Suite",
                    imageUrl: nil,
                    addressLine1: nil,
                    city: "Paris",
                    countryCode: "FR",
                    starRating: 5,
                    reviewScore: 9.3,
                    totalPrice: 240,
                    nightlyPrice: 60,
                    currency: "USD",
                    cancellationSummary: "Partially refundable",
                    currentRefundability: .partiallyRefundable,
                    amenities: ["Spa"]
                )
            ]
        )

        private(set) var lastSearchInput: TripStaySearchInput?

        func fetchDiscoverFeed() async throws -> DiscoverFeedView {
            feed
        }

        func fetchFeaturedDiscoverCard() async throws -> FeaturedDiscoverCard {
            featuredCard
        }

        func fetchDestinationProfile(destinationId: String) async throws -> DestinationProfileView {
            DestinationProfileView(
                destination: featuredCard.destination,
                details: [
                    DestinationProfileDetail(label: "Best season", value: "Apr-Oct"),
                    DestinationProfileDetail(label: "Budget", value: "$$$"),
                    DestinationProfileDetail(label: "Visa", value: "Visa-free"),
                    DestinationProfileDetail(label: "Trip length", value: "4-7 days")
                ],
                stories: (1...8).map { index in
                    DestinationProfileStoryCard(
                        id: "story_\(index)",
                        category: "Dining",
                        title: "Story \(index)",
                        imageUrl: "https://example.test/story-\(index).jpg",
                        imageAccessibilityLabel: "Story \(index)"
                    )
                }
            )
        }

        func planTrip(_ input: PlanTripInput) async throws -> PlanTripResponse {
            PlanTripResponse(tripDraft: workspace.tripDraft, execution: workspace.execution)
        }

        func fetchTripWorkspace(tripDraftId: String) async throws -> TripWorkspaceView {
            workspace
        }

        func searchTripStays(tripDraftId: String, input: TripStaySearchInput) async throws -> TripStaySearchResult {
            lastSearchInput = input
            return searchResult
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
    }

    func testLoadAppliesPersistedSearchPreferences() async {
        let api = MockAPI()
        let viewModel = TripWorkspaceViewModel(
            tripDraftId: "trip_123",
            api: api,
            currentDate: Date(timeIntervalSince1970: 1_704_067_200)
        )

        await viewModel.loadIfNeeded()

        XCTAssertEqual(viewModel.travelMonth, "2026-05")
        XCTAssertEqual(viewModel.tripNights, 4)
        XCTAssertEqual(viewModel.adults, 2)
    }

    func testSearchAndSelectionFlowUpdatesWorkspaceState() async {
        let api = MockAPI()
        let viewModel = TripWorkspaceViewModel(
            tripDraftId: "trip_123",
            api: api,
            currentDate: Date(timeIntervalSince1970: 1_704_067_200)
        )

        await viewModel.loadIfNeeded()
        viewModel.travelMonth = "2026-06"
        viewModel.tripNights = 3
        viewModel.adults = 2

        await viewModel.search()

        XCTAssertEqual(api.lastSearchInput?.travelMonth, "2026-06")
        XCTAssertEqual(viewModel.searchResult?.offers.count, 1)

        if let offer = viewModel.searchResult?.offers.first {
            await viewModel.selectStay(offer)
        }

        XCTAssertEqual(viewModel.workspace?.selectedStay?.propertyId, "property_1")
    }
}
