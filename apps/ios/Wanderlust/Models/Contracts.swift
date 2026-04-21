import Foundation

enum TripBudgetStyle: String, Codable, CaseIterable, Equatable {
    case lean
    case balanced
    case luxury
}

enum TripDraftStatus: String, Codable, Equatable {
    case draft
    case planning
    case ready
    case failed
}

enum TripWorkflowStatus: String, Codable, Equatable {
    case notStarted = "not_started"
    case running
    case completed
    case failed
}

enum TripExecutionStatus: String, Codable, Equatable {
    case running
    case completed
    case failed
    case unknown
}

enum CurrentRefundability: String, Codable, Equatable {
    case refundable
    case partiallyRefundable = "partially_refundable"
    case nonRefundable = "non_refundable"
    case unknown
}

struct DestinationSummary: Codable, Equatable, Identifiable {
    let id: String
    let slug: String
    let city: String
    let country: String
    let thesis: String
    let bestSeason: String
    let budget: String
    let visa: String
    let idealTripLength: String
    let heroImageUrl: String
    let heroImageAccessibilityLabel: String
}

struct FeaturedDiscoverChip: Codable, Equatable, Identifiable {
    var id: String { label }
    let label: String
    let value: String
}

struct FeaturedDiscoverCues: Codable, Equatable {
    let primaryAction: String
    let secondaryAction: String
    let gestureHint: String
}

struct FeaturedDiscoverCard: Codable, Equatable, Identifiable {
    var id: String { destination.id }

    let destination: DestinationSummary
    let chips: [FeaturedDiscoverChip]
    let cues: FeaturedDiscoverCues
}

struct DiscoverFeedView: Codable, Equatable {
    let cards: [FeaturedDiscoverCard]
}

struct DestinationProfileDetail: Codable, Equatable, Identifiable {
    var id: String { label }

    let label: String
    let value: String
}

struct DestinationMapCoordinate: Codable, Equatable {
    let latitude: Double
    let longitude: Double
}

struct DestinationMapCameraKeyframe: Codable, Equatable, Identifiable {
    var id: String {
        "\(centerCoordinate.latitude)-\(centerCoordinate.longitude)-\(distanceMeters)-\(headingDegrees)"
    }

    let centerCoordinate: DestinationMapCoordinate
    let distanceMeters: Double
    let pitchDegrees: Double
    let headingDegrees: Double
    let durationSeconds: Double
}

struct DestinationMapTourStop: Codable, Equatable, Identifiable {
    let id: String
    let title: String
    let subtitle: String
    let coordinate: DestinationMapCoordinate
    let lookAroundCoordinate: DestinationMapCoordinate?
    let keyframes: [DestinationMapCameraKeyframe]
}

struct DestinationMapTourView: Codable, Equatable {
    let title: String
    let summary: String
    let autoplay: Bool
    let stops: [DestinationMapTourStop]
}

struct DestinationProfileStoryCard: Codable, Equatable, Identifiable {
    let id: String
    let category: String
    let title: String
    let imageUrl: String
    let imageAccessibilityLabel: String
}

struct DestinationProfileView: Codable, Equatable {
    let destination: DestinationSummary
    let details: [DestinationProfileDetail]
    let stories: [DestinationProfileStoryCard]
    let mapTour: DestinationMapTourView?
}

struct PlanTripInput: Codable, Equatable {
    let destinationId: String
    let travelerCount: Int
    let vibe: String
    let budgetStyle: TripBudgetStyle
}

struct TripExecutionSummary: Codable, Equatable {
    let workflowId: String
    let runId: String?
    let status: TripExecutionStatus
}

struct TripDraft: Codable, Equatable, Identifiable {
    let id: String
    let destinationId: String
    let travelerCount: Int
    let vibe: String
    let budgetStyle: TripBudgetStyle
    let status: TripDraftStatus
    let workflowId: String?
    let workflowRunId: String?
    let workflowStatus: TripWorkflowStatus
    let planSummary: String?
    let travelMonth: String?
    let tripNights: Int?
    let adults: Int?
}

struct PlanTripResponse: Codable, Equatable {
    let tripDraft: TripDraft
    let execution: TripExecutionSummary?
}

struct TripStaySearchPreferences: Codable, Equatable {
    var travelMonth: String?
    var tripNights: Int?
    var adults: Int?
}

struct TripStaySearchInput: Codable, Equatable {
    let travelMonth: String
    let tripNights: Int
    let adults: Int
}

struct CandidateDateWindow: Codable, Equatable, Identifiable {
    let id: String
    let label: String
    let checkin: String
    let checkout: String
    let nights: Int
}

struct LodgingOfferSummary: Codable, Equatable, Identifiable {
    var id: String { "\(windowId)-\(propertyId)-\(rateId)" }

    let provider: String
    let windowId: String
    let windowLabel: String
    let checkin: String
    let checkout: String
    let nights: Int
    let propertyId: String
    let roomId: String
    let rateId: String
    let propertyName: String
    let roomName: String
    let imageUrl: String?
    let addressLine1: String?
    let city: String?
    let countryCode: String?
    let starRating: Double?
    let reviewScore: Double?
    let totalPrice: Double
    let nightlyPrice: Double?
    let currency: String
    let cancellationSummary: String
    let currentRefundability: CurrentRefundability
    let amenities: [String]
}

struct TripSelectedStay: Codable, Equatable {
    let provider: String
    let windowId: String
    let windowLabel: String
    let checkin: String
    let checkout: String
    let nights: Int
    let propertyId: String
    let roomId: String
    let rateId: String
    let propertyName: String
    let roomName: String
    let imageUrl: String?
    let addressLine1: String?
    let city: String?
    let countryCode: String?
    let starRating: Double?
    let reviewScore: Double?
    let totalPrice: Double
    let nightlyPrice: Double?
    let currency: String
    let cancellationSummary: String
    let currentRefundability: CurrentRefundability
    let amenities: [String]
    let selectedAt: String
}

struct TripStaySearchResult: Codable, Equatable {
    let candidateWindows: [CandidateDateWindow]
    let offers: [LodgingOfferSummary]
}

struct TripWorkspaceView: Codable, Equatable {
    let tripDraft: TripDraft
    let execution: TripExecutionSummary?
    var staySearch: TripStaySearchPreferences
    var selectedStay: TripSelectedStay?
}
