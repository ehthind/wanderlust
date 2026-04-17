import Foundation

@MainActor
final class FixtureAPIService: WanderlustAPI {
    private let processInfo = ProcessInfo.processInfo

    private let destinations: [DestinationSummary] = [
        DestinationSummary(
            id: "dest_paris",
            slug: "paris",
            city: "Paris",
            country: "France",
            thesis: "Go for the late-night glow, layered history, and beauty as part of daily life.",
            bestSeason: "Apr-Oct",
            budget: "$$$",
            visa: "Visa-free",
            idealTripLength: "4-7 days",
            heroImageUrl: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1600&q=80",
            heroImageAccessibilityLabel: "Eiffel Tower and Paris rooftops in the evening light"
        ),
        DestinationSummary(
            id: "dest_kyoto",
            slug: "kyoto",
            city: "Kyoto",
            country: "Japan",
            thesis: "Go for temple mornings, quiet lanes, and a city that rewards moving slower than your itinerary.",
            bestSeason: "Mar-May",
            budget: "$$-$$$",
            visa: "Visa-free",
            idealTripLength: "4-6 days",
            heroImageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1600&q=80",
            heroImageAccessibilityLabel: "Kyoto street with lanterns and traditional wooden buildings"
        ),
        DestinationSummary(
            id: "dest_mexico_city",
            slug: "mexico-city",
            city: "Mexico City",
            country: "Mexico",
            thesis: "Go for design energy, serious food, and neighborhoods that make a long weekend feel much larger.",
            bestSeason: "Oct-Apr",
            budget: "$$",
            visa: "Visa-free",
            idealTripLength: "4-5 days",
            heroImageUrl: "https://images.unsplash.com/photo-1512813195386-6cf811ad3542?auto=format&fit=crop&w=1600&q=80",
            heroImageAccessibilityLabel: "Mexico City skyline at golden hour with mountains in the distance"
        )
    ]

    private lazy var feed = DiscoverFeedView(
        cards: destinations.map { destination in
            FeaturedDiscoverCard(
                destination: destination,
                chips: [
                    FeaturedDiscoverChip(label: "Best season", value: destination.bestSeason),
                    FeaturedDiscoverChip(label: "Budget", value: destination.budget),
                    FeaturedDiscoverChip(label: "Visa", value: destination.visa),
                    FeaturedDiscoverChip(label: "Trip length", value: destination.idealTripLength)
                ],
                cues: FeaturedDiscoverCues(
                    primaryAction: "Plan Trip",
                    secondaryAction: "Save",
                    gestureHint: "Swipe for next destination"
                )
            )
        }
    )

    private lazy var profiles: [String: DestinationProfileView] = {
        let paris = destinations[0]
        let kyoto = destinations[1]
        let mexicoCity = destinations[2]

        return [
            paris.id: DestinationProfileView(
                destination: paris,
                details: details(for: paris),
                stories: [
                    story(
                        id: "paris-story-1",
                        category: "Neighborhood",
                        title: "Walk Saint-Germain before the city fully wakes up.",
                        imageUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80",
                        imageAccessibilityLabel: "Morning light on a Parisian street near Saint-Germain-des-Pres"
                    ),
                    story(
                        id: "paris-story-2",
                        category: "Dining",
                        title: "Book one long dinner and leave the rest for terraces.",
                        imageUrl: "https://images.unsplash.com/photo-1522093007474-d86e9bf7ba6f?auto=format&fit=crop&w=1200&q=80",
                        imageAccessibilityLabel: "Paris cafe tables set outside along a narrow street"
                    ),
                    story(
                        id: "paris-story-3",
                        category: "Museum",
                        title: "Use one museum as an anchor, not your whole itinerary.",
                        imageUrl: "https://images.unsplash.com/photo-1569949381669-ecf31ae8e613?auto=format&fit=crop&w=1200&q=80",
                        imageAccessibilityLabel: "Interior gallery space in a Paris museum"
                    ),
                    story(
                        id: "paris-story-4",
                        category: "Hotel",
                        title: "Stay Left Bank if you want the trip to feel cinematic fast.",
                        imageUrl: "https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=1200&q=80",
                        imageAccessibilityLabel: "Elegant Paris hotel room with balcony doors"
                    ),
                    story(
                        id: "paris-story-5",
                        category: "Late Night",
                        title: "The river is better after dinner than at noon.",
                        imageUrl: "https://images.unsplash.com/photo-1431274172761-fca41d930114?auto=format&fit=crop&w=1200&q=80",
                        imageAccessibilityLabel: "Night view of the Seine with illuminated bridges"
                    ),
                    story(
                        id: "paris-story-6",
                        category: "Style",
                        title: "Pack for cafes, not landmarks, and the city makes more sense.",
                        imageUrl: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=1200&q=80",
                        imageAccessibilityLabel: "Fashionable pedestrian crossing a Paris street"
                    ),
                    story(
                        id: "paris-story-7",
                        category: "Market",
                        title: "Pick one market morning and let lunch happen there.",
                        imageUrl: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1200&q=80",
                        imageAccessibilityLabel: "Fresh produce and flowers at an outdoor Paris market"
                    ),
                    story(
                        id: "paris-story-8",
                        category: "View",
                        title: "Save the skyline moment for your last afternoon.",
                        imageUrl: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1200&q=80",
                        imageAccessibilityLabel: "Paris skyline with the Eiffel Tower in the distance"
                    )
                ]
            ),
            kyoto.id: DestinationProfileView(
                destination: kyoto,
                details: details(for: kyoto),
                stories: [
                    story(
                        id: "kyoto-story-1",
                        category: "Temple",
                        title: "Get to Kiyomizu before breakfast and keep the rest of the day light.",
                        imageUrl: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1200&q=80",
                        imageAccessibilityLabel: "Kyoto temple walkway in soft morning light"
                    ),
                    story(
                        id: "kyoto-story-2",
                        category: "Tea",
                        title: "One proper tea stop changes the pace of the whole trip.",
                        imageUrl: "https://images.unsplash.com/photo-1513407030348-c983a97b98d8?auto=format&fit=crop&w=1200&q=80",
                        imageAccessibilityLabel: "Tea service in a traditional Kyoto room"
                    ),
                    story(
                        id: "kyoto-story-3",
                        category: "Walk",
                        title: "The side streets in Higashiyama are the real itinerary.",
                        imageUrl: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=1200&q=80",
                        imageAccessibilityLabel: "Narrow Kyoto lane lined with wooden townhouses"
                    ),
                    story(
                        id: "kyoto-story-4",
                        category: "Stay",
                        title: "A ryokan night earns its price if the rest of the trip stays simple.",
                        imageUrl: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80",
                        imageAccessibilityLabel: "Traditional Japanese inn room with tatami mats"
                    ),
                    story(
                        id: "kyoto-story-5",
                        category: "Craft",
                        title: "Kyoto shopping is strongest when it feels collected, not exhaustive.",
                        imageUrl: "https://images.unsplash.com/photo-1526483360412-f4dbaf036963?auto=format&fit=crop&w=1200&q=80",
                        imageAccessibilityLabel: "Japanese ceramics and handcrafted tableware on display"
                    ),
                    story(
                        id: "kyoto-story-6",
                        category: "Garden",
                        title: "Trade one crowded highlight for a quieter garden in the afternoon.",
                        imageUrl: "https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&fit=crop&w=1200&q=80",
                        imageAccessibilityLabel: "Peaceful Kyoto garden with stone path and greenery"
                    ),
                    story(
                        id: "kyoto-story-7",
                        category: "Dining",
                        title: "Keep dinner near Gion and let the walk back do the work.",
                        imageUrl: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1200&q=80",
                        imageAccessibilityLabel: "Lantern-lit Kyoto dining street at dusk"
                    ),
                    story(
                        id: "kyoto-story-8",
                        category: "Season",
                        title: "Kyoto feels most persuasive when the weather asks you to linger.",
                        imageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80",
                        imageAccessibilityLabel: "Traditional Kyoto street with lanterns and evening light"
                    )
                ]
            ),
            mexicoCity.id: DestinationProfileView(
                destination: mexicoCity,
                details: details(for: mexicoCity),
                stories: [
                    story(
                        id: "mexico-city-story-1",
                        category: "Neighborhood",
                        title: "Base the trip in Roma or Condesa and let the blocks carry the mood.",
                        imageUrl: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80",
                        imageAccessibilityLabel: "Tree-lined street in Mexico City's Roma neighborhood"
                    ),
                    story(
                        id: "mexico-city-story-2",
                        category: "Dining",
                        title: "Use one reservation for ambition and leave the rest to tacos.",
                        imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
                        imageAccessibilityLabel: "Modern plated meal in a Mexico City restaurant"
                    ),
                    story(
                        id: "mexico-city-story-3",
                        category: "Design",
                        title: "The city feels most itself where concrete, greenery, and color meet.",
                        imageUrl: "https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=1200&q=80",
                        imageAccessibilityLabel: "Modern Mexico City architecture with bold geometric lines"
                    ),
                    story(
                        id: "mexico-city-story-4",
                        category: "Market",
                        title: "Give a market lunch enough time to turn into the afternoon.",
                        imageUrl: "https://images.unsplash.com/photo-1526318896980-cf78c088247c?auto=format&fit=crop&w=1200&q=80",
                        imageAccessibilityLabel: "Busy Mexico City food market with colorful stalls"
                    ),
                    story(
                        id: "mexico-city-story-5",
                        category: "Museum",
                        title: "Pair one museum morning with a park-heavy afternoon.",
                        imageUrl: "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?auto=format&fit=crop&w=1200&q=80",
                        imageAccessibilityLabel: "Museum gallery interior with contemporary art"
                    ),
                    story(
                        id: "mexico-city-story-6",
                        category: "Stay",
                        title: "A design hotel works here because you will actually use it between outings.",
                        imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
                        imageAccessibilityLabel: "Boutique hotel room with warm wood and leather details"
                    ),
                    story(
                        id: "mexico-city-story-7",
                        category: "Night",
                        title: "The city stays generous after dark without forcing the pace.",
                        imageUrl: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80",
                        imageAccessibilityLabel: "Mexico City avenue lit at night with traffic and streetlights"
                    ),
                    story(
                        id: "mexico-city-story-8",
                        category: "Weekend",
                        title: "Four days is enough if you keep the radius tight and the meals long.",
                        imageUrl: "https://images.unsplash.com/photo-1512813195386-6cf811ad3542?auto=format&fit=crop&w=1200&q=80",
                        imageAccessibilityLabel: "Mexico City skyline with mountains in the distance"
                    )
                ]
            )
        ]
    }()

    private var workspace = TripWorkspaceView(
        tripDraft: TripDraft(
            id: "trip_fixture_paris",
            destinationId: "dest_paris",
            travelerCount: 2,
            vibe: "romantic",
            budgetStyle: .balanced,
            status: .planning,
            workflowId: "wf_fixture_paris",
            workflowRunId: "run_fixture_paris",
            workflowStatus: .running,
            planSummary: "A Paris long-weekend escape anchored around Saint-Germain and the Left Bank.",
            travelMonth: "2026-05",
            tripNights: 3,
            adults: 2
        ),
        execution: TripExecutionSummary(
            workflowId: "wf_fixture_paris",
            runId: "run_fixture_paris",
            status: .running
        ),
        staySearch: TripStaySearchPreferences(
            travelMonth: "2026-05",
            tripNights: 3,
            adults: 2
        ),
        selectedStay: nil
    )

    private let fixtureWindows = [
        CandidateDateWindow(
            id: "2026-05-01_2026-05-04",
            label: "Fri, May 1 - Mon, May 4",
            checkin: "2026-05-01",
            checkout: "2026-05-04",
            nights: 3
        ),
        CandidateDateWindow(
            id: "2026-05-08_2026-05-11",
            label: "Fri, May 8 - Mon, May 11",
            checkin: "2026-05-08",
            checkout: "2026-05-11",
            nights: 3
        )
    ]

    func fetchDiscoverFeed() async throws -> DiscoverFeedView {
        feed
    }

    func fetchFeaturedDiscoverCard() async throws -> FeaturedDiscoverCard {
        feed.cards[0]
    }

    func fetchDestinationProfile(destinationId: String) async throws -> DestinationProfileView {
        if let delay = profileDelayNanoseconds {
            try await Task.sleep(nanoseconds: delay)
        }

        if failedProfileDestinationId == destinationId {
            throw APIClientError.server(
                statusCode: 503,
                message: "Destination guide fixtures are unavailable for \(destinationId)."
            )
        }

        guard let profile = profiles[destinationId] else {
            throw APIClientError.server(statusCode: 404, message: "Destination \(destinationId) was not found.")
        }

        return profile
    }

    func planTrip(_ input: PlanTripInput) async throws -> PlanTripResponse {
        let summary = planSummary(for: input.destinationId)
        let slug = slug(for: input.destinationId)

        workspace = TripWorkspaceView(
            tripDraft: TripDraft(
                id: "trip_fixture_\(slug)",
                destinationId: input.destinationId,
                travelerCount: input.travelerCount,
                vibe: input.vibe,
                budgetStyle: input.budgetStyle,
                status: .planning,
                workflowId: "wf_fixture_\(slug)",
                workflowRunId: "run_fixture_\(slug)",
                workflowStatus: .running,
                planSummary: summary,
                travelMonth: workspace.staySearch.travelMonth,
                tripNights: workspace.staySearch.tripNights,
                adults: workspace.staySearch.adults
            ),
            execution: TripExecutionSummary(
                workflowId: "wf_fixture_\(slug)",
                runId: "run_fixture_\(slug)",
                status: .running
            ),
            staySearch: workspace.staySearch,
            selectedStay: nil
        )

        return PlanTripResponse(
            tripDraft: workspace.tripDraft,
            execution: workspace.execution
        )
    }

    func fetchTripWorkspace(tripDraftId: String) async throws -> TripWorkspaceView {
        workspace
    }

    func searchTripStays(tripDraftId: String, input: TripStaySearchInput) async throws -> TripStaySearchResult {
        workspace.staySearch = TripStaySearchPreferences(
            travelMonth: input.travelMonth,
            tripNights: input.tripNights,
            adults: input.adults
        )

        return TripStaySearchResult(
            candidateWindows: fixtureWindows,
            offers: fixtureOffers(for: workspace.tripDraft.destinationId)
        )
    }

    func selectTripStay(tripDraftId: String, offer: LodgingOfferSummary) async throws -> TripSelectedStay {
        let selectedStay = TripSelectedStay(
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

        workspace.selectedStay = selectedStay
        return selectedStay
    }

    private func slug(for destinationId: String) -> String {
        feed.cards.first(where: { $0.destination.id == destinationId })?.destination.slug ?? "paris"
    }

    private var profileDelayNanoseconds: UInt64? {
        guard
            let rawValue = processInfo.environment["WANDERLUST_PROFILE_DELAY_MS"],
            let milliseconds = UInt64(rawValue),
            milliseconds > 0
        else {
            return nil
        }

        return milliseconds * 1_000_000
    }

    private var failedProfileDestinationId: String? {
        processInfo.environment["WANDERLUST_FAIL_PROFILE_DESTINATION_ID"]
    }

    private func planSummary(for destinationId: String) -> String {
        switch destinationId {
        case "dest_kyoto":
            return "A Kyoto long weekend shaped around early temple visits, Gion dinners, and slower afternoons."
        case "dest_mexico_city":
            return "A Mexico City escape centered on Roma and Condesa, market lunches, and a design-forward hotel stay."
        default:
            return "A Paris long-weekend escape anchored around Saint-Germain and the Left Bank."
        }
    }

    private func details(for destination: DestinationSummary) -> [DestinationProfileDetail] {
        [
            DestinationProfileDetail(label: "Best season", value: destination.bestSeason),
            DestinationProfileDetail(label: "Budget", value: destination.budget),
            DestinationProfileDetail(label: "Visa", value: destination.visa),
            DestinationProfileDetail(label: "Trip length", value: destination.idealTripLength)
        ]
    }

    private func story(
        id: String,
        category: String,
        title: String,
        imageUrl: String,
        imageAccessibilityLabel: String
    ) -> DestinationProfileStoryCard {
        DestinationProfileStoryCard(
            id: id,
            category: category,
            title: title,
            imageUrl: imageUrl,
            imageAccessibilityLabel: imageAccessibilityLabel
        )
    }

    private func fixtureOffers(for destinationId: String) -> [LodgingOfferSummary] {
        switch destinationId {
        case "dest_kyoto":
            return [
                LodgingOfferSummary(
                    provider: "expedia-rapid",
                    windowId: fixtureWindows[0].id,
                    windowLabel: fixtureWindows[0].label,
                    checkin: fixtureWindows[0].checkin,
                    checkout: fixtureWindows[0].checkout,
                    nights: fixtureWindows[0].nights,
                    propertyId: "fixture_property_kyoto_1",
                    roomId: "fixture_room_kyoto_1",
                    rateId: "fixture_rate_kyoto_1",
                    propertyName: "Higashiyama House",
                    roomName: "Garden King Room",
                    imageUrl: nil,
                    addressLine1: "7 Gionmachi",
                    city: "Kyoto",
                    countryCode: "JP",
                    starRating: 5.0,
                    reviewScore: 9.4,
                    totalPrice: 245,
                    nightlyPrice: 81.67,
                    currency: "USD",
                    cancellationSummary: "Free cancellation",
                    currentRefundability: .refundable,
                    amenities: ["Breakfast", "Garden"]
                ),
                LodgingOfferSummary(
                    provider: "expedia-rapid",
                    windowId: fixtureWindows[1].id,
                    windowLabel: fixtureWindows[1].label,
                    checkin: fixtureWindows[1].checkin,
                    checkout: fixtureWindows[1].checkout,
                    nights: fixtureWindows[1].nights,
                    propertyId: "fixture_property_kyoto_2",
                    roomId: "fixture_room_kyoto_2",
                    rateId: "fixture_rate_kyoto_2",
                    propertyName: "Arashiyama Retreat",
                    roomName: "Tatami Suite",
                    imageUrl: nil,
                    addressLine1: "18 Saga Tenryuji",
                    city: "Kyoto",
                    countryCode: "JP",
                    starRating: 4.0,
                    reviewScore: 8.9,
                    totalPrice: 218,
                    nightlyPrice: 72.67,
                    currency: "USD",
                    cancellationSummary: "Partially refundable",
                    currentRefundability: .partiallyRefundable,
                    amenities: ["Onsen", "Tea service"]
                )
            ]
        case "dest_mexico_city":
            return [
                LodgingOfferSummary(
                    provider: "expedia-rapid",
                    windowId: fixtureWindows[0].id,
                    windowLabel: fixtureWindows[0].label,
                    checkin: fixtureWindows[0].checkin,
                    checkout: fixtureWindows[0].checkout,
                    nights: fixtureWindows[0].nights,
                    propertyId: "fixture_property_mexico_city_1",
                    roomId: "fixture_room_mexico_city_1",
                    rateId: "fixture_rate_mexico_city_1",
                    propertyName: "Roma Norte Casa",
                    roomName: "Terrace King",
                    imageUrl: nil,
                    addressLine1: "14 Colima",
                    city: "Mexico City",
                    countryCode: "MX",
                    starRating: 5.0,
                    reviewScore: 9.1,
                    totalPrice: 205,
                    nightlyPrice: 68.33,
                    currency: "USD",
                    cancellationSummary: "Free cancellation",
                    currentRefundability: .refundable,
                    amenities: ["Rooftop", "Breakfast"]
                ),
                LodgingOfferSummary(
                    provider: "expedia-rapid",
                    windowId: fixtureWindows[1].id,
                    windowLabel: fixtureWindows[1].label,
                    checkin: fixtureWindows[1].checkin,
                    checkout: fixtureWindows[1].checkout,
                    nights: fixtureWindows[1].nights,
                    propertyId: "fixture_property_mexico_city_2",
                    roomId: "fixture_room_mexico_city_2",
                    rateId: "fixture_rate_mexico_city_2",
                    propertyName: "Condesa Courtyard",
                    roomName: "Courtyard Studio",
                    imageUrl: nil,
                    addressLine1: "28 Avenida Veracruz",
                    city: "Mexico City",
                    countryCode: "MX",
                    starRating: 4.0,
                    reviewScore: 8.8,
                    totalPrice: 188,
                    nightlyPrice: 62.67,
                    currency: "USD",
                    cancellationSummary: "Partially refundable",
                    currentRefundability: .partiallyRefundable,
                    amenities: ["Wi-Fi", "Late checkout"]
                )
            ]
        default:
            return [
                LodgingOfferSummary(
                    provider: "expedia-rapid",
                    windowId: fixtureWindows[0].id,
                    windowLabel: fixtureWindows[0].label,
                    checkin: fixtureWindows[0].checkin,
                    checkout: fixtureWindows[0].checkout,
                    nights: fixtureWindows[0].nights,
                    propertyId: "fixture_property_1",
                    roomId: "fixture_room_1",
                    rateId: "fixture_rate_1",
                    propertyName: "Maison Rive",
                    roomName: "River Suite",
                    imageUrl: nil,
                    addressLine1: "2 Saint Germain",
                    city: "Paris",
                    countryCode: "FR",
                    starRating: 5.0,
                    reviewScore: 9.3,
                    totalPrice: 230,
                    nightlyPrice: 76.67,
                    currency: "USD",
                    cancellationSummary: "Partially refundable",
                    currentRefundability: .partiallyRefundable,
                    amenities: ["Spa", "Breakfast"]
                ),
                LodgingOfferSummary(
                    provider: "expedia-rapid",
                    windowId: fixtureWindows[1].id,
                    windowLabel: fixtureWindows[1].label,
                    checkin: fixtureWindows[1].checkin,
                    checkout: fixtureWindows[1].checkout,
                    nights: fixtureWindows[1].nights,
                    propertyId: "fixture_property_2",
                    roomId: "fixture_room_2",
                    rateId: "fixture_rate_2",
                    propertyName: "Hotel Marais",
                    roomName: "Cosy Courtyard Room",
                    imageUrl: nil,
                    addressLine1: "11 Rue Vieille",
                    city: "Paris",
                    countryCode: "FR",
                    starRating: 4.0,
                    reviewScore: 8.7,
                    totalPrice: 210,
                    nightlyPrice: 70,
                    currency: "USD",
                    cancellationSummary: "Free cancellation",
                    currentRefundability: .refundable,
                    amenities: ["Wi-Fi", "Late checkout"]
                )
            ]
        }
    }
}
