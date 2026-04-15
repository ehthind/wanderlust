import XCTest
@testable import Wanderlust

final class ContractDecodingTests: XCTestCase {
    func testDecodesFeaturedDiscoverCard() throws {
        let json = """
        {
          "destination": {
            "id": "dest_paris",
            "slug": "paris",
            "city": "Paris",
            "country": "France",
            "thesis": "Glow",
            "bestSeason": "Apr-Oct",
            "budget": "$$$",
            "visa": "Visa-free",
            "idealTripLength": "4-7 days",
            "heroImageUrl": "https://example.test/paris.jpg",
            "heroImageAccessibilityLabel": "Paris skyline"
          },
          "chips": [
            { "label": "Best season", "value": "Apr-Oct" }
          ],
          "cues": {
            "primaryAction": "Plan Trip",
            "secondaryAction": "Save",
            "gestureHint": "Swipe left"
          }
        }
        """.data(using: .utf8)!

        let card = try JSONDecoder().decode(FeaturedDiscoverCard.self, from: json)
        XCTAssertEqual(card.destination.city, "Paris")
        XCTAssertEqual(card.chips.first?.value, "Apr-Oct")
        XCTAssertEqual(card.destination.heroImageAccessibilityLabel, "Paris skyline")
    }

    func testDecodesDiscoverFeedView() throws {
        let json = """
        {
          "cards": [
            {
              "destination": {
                "id": "dest_paris",
                "slug": "paris",
                "city": "Paris",
                "country": "France",
                "thesis": "Glow",
                "bestSeason": "Apr-Oct",
                "budget": "$$$",
                "visa": "Visa-free",
                "idealTripLength": "4-7 days",
                "heroImageUrl": "https://example.test/paris.jpg",
                "heroImageAccessibilityLabel": "Paris skyline"
              },
              "chips": [
                { "label": "Best season", "value": "Apr-Oct" }
              ],
              "cues": {
                "primaryAction": "Plan Trip",
                "secondaryAction": "Save",
                "gestureHint": "Swipe for next destination"
              }
            }
          ]
        }
        """.data(using: .utf8)!

        let feed = try JSONDecoder().decode(DiscoverFeedView.self, from: json)
        XCTAssertEqual(feed.cards.count, 1)
        XCTAssertEqual(feed.cards[0].destination.id, "dest_paris")
    }

    func testDecodesDestinationProfileView() throws {
        let json = """
        {
          "destination": {
            "id": "dest_paris",
            "slug": "paris",
            "city": "Paris",
            "country": "France",
            "thesis": "Glow",
            "bestSeason": "Apr-Oct",
            "budget": "$$$",
            "visa": "Visa-free",
            "idealTripLength": "4-7 days",
            "heroImageUrl": "https://example.test/paris.jpg",
            "heroImageAccessibilityLabel": "Paris skyline"
          },
          "details": [
            { "label": "Best season", "value": "Apr-Oct" },
            { "label": "Budget", "value": "$$$" },
            { "label": "Visa", "value": "Visa-free" },
            { "label": "Trip length", "value": "4-7 days" }
          ],
          "stories": [
            {
              "id": "paris-story-1",
              "category": "Dining",
              "title": "Book one long dinner.",
              "imageUrl": "https://example.test/story-1.jpg",
              "imageAccessibilityLabel": "Dinner table"
            },
            {
              "id": "paris-story-2",
              "category": "View",
              "title": "Save the skyline moment.",
              "imageUrl": "https://example.test/story-2.jpg",
              "imageAccessibilityLabel": "Paris skyline"
            },
            {
              "id": "paris-story-3",
              "category": "Hotel",
              "title": "Stay Left Bank.",
              "imageUrl": "https://example.test/story-3.jpg",
              "imageAccessibilityLabel": "Hotel room"
            },
            {
              "id": "paris-story-4",
              "category": "Walk",
              "title": "Walk the river late.",
              "imageUrl": "https://example.test/story-4.jpg",
              "imageAccessibilityLabel": "Seine at night"
            },
            {
              "id": "paris-story-5",
              "category": "Market",
              "title": "Make a market lunch your plan.",
              "imageUrl": "https://example.test/story-5.jpg",
              "imageAccessibilityLabel": "Market stall"
            },
            {
              "id": "paris-story-6",
              "category": "Museum",
              "title": "Choose one anchor museum.",
              "imageUrl": "https://example.test/story-6.jpg",
              "imageAccessibilityLabel": "Museum gallery"
            },
            {
              "id": "paris-story-7",
              "category": "Style",
              "title": "Dress for cafes.",
              "imageUrl": "https://example.test/story-7.jpg",
              "imageAccessibilityLabel": "Street style"
            },
            {
              "id": "paris-story-8",
              "category": "Neighborhood",
              "title": "Start in Saint-Germain.",
              "imageUrl": "https://example.test/story-8.jpg",
              "imageAccessibilityLabel": "Paris street"
            }
          ]
        }
        """.data(using: .utf8)!

        let profile = try JSONDecoder().decode(DestinationProfileView.self, from: json)
        XCTAssertEqual(profile.destination.id, "dest_paris")
        XCTAssertEqual(profile.details.count, 4)
        XCTAssertEqual(profile.stories.count, 8)
        XCTAssertEqual(profile.stories[0].category, "Dining")
    }

    func testDecodesTripWorkspaceView() throws {
        let json = """
        {
          "tripDraft": {
            "id": "trip_123",
            "destinationId": "dest_paris",
            "travelerCount": 2,
            "vibe": "romantic",
            "budgetStyle": "balanced",
            "status": "planning",
            "workflowId": "wf_123",
            "workflowRunId": "run_123",
            "workflowStatus": "running",
            "planSummary": null,
            "travelMonth": "2026-05",
            "tripNights": 3,
            "adults": 2
          },
          "execution": {
            "workflowId": "wf_123",
            "runId": "run_123",
            "status": "running"
          },
          "staySearch": {
            "travelMonth": "2026-05",
            "tripNights": 3,
            "adults": 2
          },
          "selectedStay": null
        }
        """.data(using: .utf8)!

        let workspace = try JSONDecoder().decode(TripWorkspaceView.self, from: json)
        XCTAssertEqual(workspace.tripDraft.id, "trip_123")
        XCTAssertEqual(workspace.staySearch.travelMonth, "2026-05")
    }
}
