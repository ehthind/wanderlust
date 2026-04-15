import Foundation

struct MonthOption: Identifiable, Hashable {
    let id: String
    let title: String
}

@MainActor
final class TripWorkspaceViewModel: ObservableObject {
    @Published private(set) var monthOptions: [MonthOption]
    @Published private(set) var workspace: TripWorkspaceView?
    @Published private(set) var searchResult: TripStaySearchResult?
    @Published private(set) var isLoading = false
    @Published private(set) var isSearching = false
    @Published private(set) var isSelecting = false
    @Published var errorMessage: String?
    @Published var travelMonth: String
    @Published var tripNights: Int
    @Published var adults: Int

    let tripDraftId: String

    private let api: any WanderlustAPI
    private var hasLoaded = false

    init(tripDraftId: String, api: any WanderlustAPI, currentDate: Date = .now) {
        self.tripDraftId = tripDraftId
        self.api = api
        self.monthOptions = Self.makeMonthOptions(from: currentDate)
        self.travelMonth = Self.defaultTravelMonth(from: currentDate)
        self.tripNights = 3
        self.adults = 2
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
            let workspace = try await api.fetchTripWorkspace(tripDraftId: tripDraftId)
            self.workspace = workspace
            applySearchPreferences(workspace.staySearch)
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func search() async {
        isSearching = true
        defer { isSearching = false }

        do {
            let input = TripStaySearchInput(
                travelMonth: travelMonth,
                tripNights: tripNights,
                adults: adults
            )
            searchResult = try await api.searchTripStays(tripDraftId: tripDraftId, input: input)
            if var workspace {
                workspace.staySearch = TripStaySearchPreferences(
                    travelMonth: input.travelMonth,
                    tripNights: input.tripNights,
                    adults: input.adults
                )
                self.workspace = workspace
            }
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func selectStay(_ offer: LodgingOfferSummary) async {
        isSelecting = true
        defer { isSelecting = false }

        do {
            let selectedStay = try await api.selectTripStay(tripDraftId: tripDraftId, offer: offer)
            if var workspace {
                workspace.selectedStay = selectedStay
                self.workspace = workspace
            }
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func applySearchPreferences(_ preferences: TripStaySearchPreferences) {
        if let travelMonth = preferences.travelMonth {
            ensureMonthOption(travelMonth)
            self.travelMonth = travelMonth
        }

        if let tripNights = preferences.tripNights {
            self.tripNights = tripNights
        }

        if let adults = preferences.adults {
            self.adults = adults
        }
    }

    private static func defaultTravelMonth(from date: Date) -> String {
        let calendar = Calendar(identifier: .gregorian)
        let startOfMonth = calendar.date(from: calendar.dateComponents([.year, .month], from: date)) ?? date
        let nextMonth = calendar.date(byAdding: .month, value: 1, to: startOfMonth) ?? startOfMonth
        let formatter = DateFormatter()
        formatter.calendar = calendar
        formatter.dateFormat = "yyyy-MM"
        return formatter.string(from: nextMonth)
    }

    private static func makeMonthOptions(from date: Date) -> [MonthOption] {
        let calendar = Calendar(identifier: .gregorian)
        let startOfMonth = calendar.date(from: calendar.dateComponents([.year, .month], from: date)) ?? date
        let formatter = DateFormatter()
        formatter.calendar = calendar
        formatter.dateFormat = "LLLL yyyy"

        let idFormatter = DateFormatter()
        idFormatter.calendar = calendar
        idFormatter.dateFormat = "yyyy-MM"

        return (1 ... 12).compactMap { offset in
            guard let month = calendar.date(byAdding: .month, value: offset, to: startOfMonth) else {
                return nil
            }

            return MonthOption(
                id: idFormatter.string(from: month),
                title: formatter.string(from: month)
            )
        }
    }

    private func ensureMonthOption(_ monthId: String) {
        guard !monthOptions.contains(where: { $0.id == monthId }),
              let monthOption = Self.monthOption(from: monthId) else {
            return
        }

        monthOptions.append(monthOption)
        monthOptions.sort { $0.id < $1.id }
    }

    private static func monthOption(from monthId: String) -> MonthOption? {
        let parser = DateFormatter()
        parser.calendar = Calendar(identifier: .gregorian)
        parser.dateFormat = "yyyy-MM"

        guard let date = parser.date(from: monthId) else {
            return nil
        }

        let formatter = DateFormatter()
        formatter.calendar = parser.calendar
        formatter.dateFormat = "LLLL yyyy"

        return MonthOption(
            id: monthId,
            title: formatter.string(from: date)
        )
    }
}
