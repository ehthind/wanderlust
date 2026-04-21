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
          "mapTour": {
            "title": "Paris In Motion",
            "summary": "A cinematic map tour.",
            "autoplay": true,
            "stops": [
              {
                "id": "paris-stop-1",
                "title": "Stop 1",
                "subtitle": "First stop",
                "coordinate": {
                  "latitude": 48.8584,
                  "longitude": 2.2945
                },
                "lookAroundCoordinate": {
                  "latitude": 48.8584,
                  "longitude": 2.2945
                },
                "keyframes": [
                  {
                    "centerCoordinate": {
                      "latitude": 48.8584,
                      "longitude": 2.2945
                    },
                    "distanceMeters": 6000,
                    "pitchDegrees": 48,
                    "headingDegrees": 20,
                    "durationSeconds": 1.2
                  },
                  {
                    "centerCoordinate": {
                      "latitude": 48.859,
                      "longitude": 2.295
                    },
                    "distanceMeters": 2200,
                    "pitchDegrees": 62,
                    "headingDegrees": 50,
                    "durationSeconds": 1.3
                  },
                  {
                    "centerCoordinate": {
                      "latitude": 48.8584,
                      "longitude": 2.2945
                    },
                    "distanceMeters": 900,
                    "pitchDegrees": 72,
                    "headingDegrees": 110,
                    "durationSeconds": 1.1
                  }
                ]
              },
              {
                "id": "paris-stop-2",
                "title": "Stop 2",
                "subtitle": "Second stop",
                "coordinate": {
                  "latitude": 48.8534,
                  "longitude": 2.3332
                },
                "keyframes": [
                  {
                    "centerCoordinate": {
                      "latitude": 48.8534,
                      "longitude": 2.3332
                    },
                    "distanceMeters": 5200,
                    "pitchDegrees": 46,
                    "headingDegrees": 298,
                    "durationSeconds": 1.2
                  },
                  {
                    "centerCoordinate": {
                      "latitude": 48.8541,
                      "longitude": 2.3346
                    },
                    "distanceMeters": 1800,
                    "pitchDegrees": 60,
                    "headingDegrees": 328,
                    "durationSeconds": 1.4
                  },
                  {
                    "centerCoordinate": {
                      "latitude": 48.8537,
                      "longitude": 2.3339
                    },
                    "distanceMeters": 780,
                    "pitchDegrees": 74,
                    "headingDegrees": 12,
                    "durationSeconds": 1.2
                  }
                ]
              },
              {
                "id": "paris-stop-3",
                "title": "Stop 3",
                "subtitle": "Third stop",
                "coordinate": {
                  "latitude": 48.8867,
                  "longitude": 2.3431
                },
                "keyframes": [
                  {
                    "centerCoordinate": {
                      "latitude": 48.8867,
                      "longitude": 2.3431
                    },
                    "distanceMeters": 6000,
                    "pitchDegrees": 50,
                    "headingDegrees": 200,
                    "durationSeconds": 1.3
                  },
                  {
                    "centerCoordinate": {
                      "latitude": 48.8862,
                      "longitude": 2.3442
                    },
                    "distanceMeters": 2100,
                    "pitchDegrees": 66,
                    "headingDegrees": 222,
                    "durationSeconds": 1.5
                  },
                  {
                    "centerCoordinate": {
                      "latitude": 48.8867,
                      "longitude": 2.3431
                    },
                    "distanceMeters": 900,
                    "pitchDegrees": 78,
                    "headingDegrees": 258,
                    "durationSeconds": 1.2
                  }
                ]
              }
            ]
          },
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
        XCTAssertEqual(profile.mapTour?.stops.count, 3)
        XCTAssertEqual(profile.mapTour?.stops[0].keyframes.count, 3)
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
