import Foundation

enum APIClientError: LocalizedError {
    case invalidResponse
    case server(statusCode: Int, message: String)

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "The Wanderlust API returned an invalid response."
        case let .server(statusCode, message):
            return "Request failed (\(statusCode)): \(message)"
        }
    }
}

@MainActor
final class APIClient: WanderlustAPI {
    private struct ErrorEnvelope: Decodable {
        let error: String
    }

    private let environment: AppEnvironment
    private let session: URLSession

    init(environment: AppEnvironment, session: URLSession = .shared) {
        self.environment = environment
        self.session = session
    }

    func fetchDiscoverFeed() async throws -> DiscoverFeedView {
        try await send(path: "/api/discover/feed", method: "GET", body: Optional<Data>.none, as: DiscoverFeedView.self)
    }

    func fetchFeaturedDiscoverCard() async throws -> FeaturedDiscoverCard {
        try await send(path: "/api/discover/featured", method: "GET", body: Optional<Data>.none, as: FeaturedDiscoverCard.self)
    }

    func fetchDestinationProfile(destinationId: String) async throws -> DestinationProfileView {
        try await send(
            path: "/api/destinations/\(destinationId)",
            method: "GET",
            body: Optional<Data>.none,
            as: DestinationProfileView.self
        )
    }

    func planTrip(_ input: PlanTripInput) async throws -> PlanTripResponse {
        try await send(path: "/api/trips/plan", method: "POST", body: input, as: PlanTripResponse.self)
    }

    func fetchTripWorkspace(tripDraftId: String) async throws -> TripWorkspaceView {
        try await send(path: "/api/trips/\(tripDraftId)", method: "GET", body: Optional<Data>.none, as: TripWorkspaceView.self)
    }

    func searchTripStays(tripDraftId: String, input: TripStaySearchInput) async throws -> TripStaySearchResult {
        try await send(
            path: "/api/trips/\(tripDraftId)/stays/search",
            method: "POST",
            body: input,
            as: TripStaySearchResult.self
        )
    }

    func selectTripStay(tripDraftId: String, offer: LodgingOfferSummary) async throws -> TripSelectedStay {
        try await send(
            path: "/api/trips/\(tripDraftId)/stays/select",
            method: "POST",
            body: offer,
            as: TripSelectedStay.self
        )
    }

    private func send<Response: Decodable>(
        path: String,
        method: String,
        body: Data?,
        as responseType: Response.Type
    ) async throws -> Response {
        let request = try makeRequest(path: path, method: method, body: body)
        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIClientError.invalidResponse
        }

        if (200 ..< 300).contains(httpResponse.statusCode) {
            return try JSONDecoder().decode(Response.self, from: data)
        }

        let message = (try? JSONDecoder().decode(ErrorEnvelope.self, from: data).error) ?? "Unknown error"
        throw APIClientError.server(statusCode: httpResponse.statusCode, message: message)
    }

    private func send<RequestBody: Encodable, Response: Decodable>(
        path: String,
        method: String,
        body: RequestBody,
        as responseType: Response.Type
    ) async throws -> Response {
        let encoder = JSONEncoder()
        return try await send(path: path, method: method, body: try encoder.encode(body), as: responseType)
    }

    private func makeRequest(path: String, method: String, body: Data?) throws -> URLRequest {
        guard let url = URL(string: path, relativeTo: environment.baseURL) else {
            throw APIClientError.invalidResponse
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if let body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = body
        }
        return request
    }
}
