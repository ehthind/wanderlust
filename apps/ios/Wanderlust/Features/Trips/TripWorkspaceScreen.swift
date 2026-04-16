import SwiftUI

struct TripWorkspaceScreen: View {
    @ObservedObject var appState: AppState
    @StateObject private var viewModel: TripWorkspaceViewModel

    init(tripDraftId: String, appState: AppState) {
        self.appState = appState
        _viewModel = StateObject(wrappedValue: TripWorkspaceViewModel(tripDraftId: tripDraftId, api: appState.api))
    }

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(red: 0.97, green: 0.95, blue: 0.9),
                    Color(red: 0.86, green: 0.92, blue: 0.97)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            if viewModel.isLoading, viewModel.workspace == nil {
                ProgressView("Loading trip workspace...")
            } else {
                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        heroCard
                        searchControlsCard

                        if let selectedStay = viewModel.workspace?.selectedStay {
                            selectedStayCard(selectedStay)
                                .accessibilityIdentifier("workspace.selectedStayTitle")
                        }

                        if let searchResult = viewModel.searchResult, !searchResult.offers.isEmpty {
                            searchResultsSection(searchResult)
                                .accessibilityIdentifier("workspace.resultsList")
                        } else if viewModel.workspace?.selectedStay == nil {
                            emptyResultsState
                        }

                        if let errorMessage = viewModel.errorMessage {
                            Text(errorMessage)
                                .font(.system(.footnote, design: .rounded))
                                .foregroundStyle(Color(red: 0.45, green: 0.12, blue: 0.12))
                                .padding(16)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(Color.white.opacity(0.72), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
                        }
                    }
                    .padding(24)
                }
            }
        }
        .navigationTitle("Trip Workspace")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await viewModel.loadIfNeeded()
        }
    }

    private var heroCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(displayDestination)
                .font(.system(size: 34, weight: .bold, design: .serif))
                .foregroundStyle(Color(red: 0.11, green: 0.18, blue: 0.25))

            HStack(spacing: 12) {
                summaryPill("Vibe", viewModel.workspace?.tripDraft.vibe.capitalized ?? "Romantic")
                summaryPill("Budget", viewModel.workspace?.tripDraft.budgetStyle.rawValue.capitalized ?? "Balanced")
                summaryPill("Travelers", "\(viewModel.workspace?.tripDraft.travelerCount ?? 2)")
            }

            if let execution = viewModel.workspace?.execution {
                Text("Planning workflow: \(execution.status.rawValue.capitalized)")
                    .font(.system(.footnote, design: .rounded).weight(.medium))
                    .foregroundStyle(.secondary)
            }
        }
        .padding(24)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 28, style: .continuous))
    }

    private var searchControlsCard: some View {
        VStack(alignment: .leading, spacing: 18) {
            Text("Stay Availability")
                .font(.system(.title2, design: .serif).weight(.bold))
                .foregroundStyle(Color(red: 0.11, green: 0.18, blue: 0.25))

            Picker("Month", selection: $viewModel.travelMonth) {
                ForEach(viewModel.monthOptions) { option in
                    Text(option.title).tag(option.id)
                }
            }
            .pickerStyle(.menu)

            Stepper("Nights: \(viewModel.tripNights)", value: $viewModel.tripNights, in: 1 ... 14)
            Stepper("Adults: \(viewModel.adults)", value: $viewModel.adults, in: 1 ... 6)

            Button {
                Task {
                    await viewModel.search()
                }
            } label: {
                HStack {
                    Text(viewModel.isSearching ? "Searching..." : "Check Live Stays")
                        .font(.system(.headline, design: .rounded).weight(.bold))
                    Spacer()
                    Image(systemName: "bed.double.circle.fill")
                }
                .foregroundStyle(.white)
                .padding(16)
                .background(Color(red: 0.1, green: 0.28, blue: 0.41), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
            }
            .disabled(viewModel.isSearching)
            .accessibilityIdentifier("workspace.searchButton")
        }
        .padding(24)
        .background(Color.white.opacity(0.85), in: RoundedRectangle(cornerRadius: 28, style: .continuous))
    }

    private func selectedStayCard(_ stay: TripSelectedStay) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Selected Stay")
                .font(.system(.title2, design: .serif).weight(.bold))
                .foregroundStyle(Color(red: 0.12, green: 0.21, blue: 0.31))
                .accessibilityIdentifier("workspace.selectedStayTitle")

            Text(stay.propertyName)
                .font(.system(.title3, design: .rounded).weight(.bold))

            Text("\(stay.windowLabel) • \(formattedPrice(stay.totalPrice, currency: stay.currency)) total")
                .font(.system(.body, design: .rounded))
                .foregroundStyle(.secondary)

            Text(stay.cancellationSummary)
                .font(.system(.footnote, design: .rounded))
                .foregroundStyle(Color(red: 0.17, green: 0.32, blue: 0.25))

            Text("Checkout and booking confirmation come later. This slice ends at stay selection.")
                .font(.system(.footnote, design: .rounded))
                .foregroundStyle(.secondary)
        }
        .padding(24)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            LinearGradient(
                colors: [
                    Color(red: 0.95, green: 0.97, blue: 0.92),
                    Color.white
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            ),
            in: RoundedRectangle(cornerRadius: 28, style: .continuous)
        )
        .background(alignment: .topLeading) {
            Color.clear
                .frame(width: 1, height: 1)
                .allowsHitTesting(false)
                .accessibilityElement()
                .accessibilityIdentifier("workspace.selectedStayTitle")
        }
    }

    private func searchResultsSection(_ result: TripStaySearchResult) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Available Now")
                .font(.system(.title2, design: .serif).weight(.bold))
                .foregroundStyle(Color(red: 0.12, green: 0.21, blue: 0.31))

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    ForEach(result.candidateWindows) { window in
                        Text(window.label)
                            .font(.system(.caption, design: .rounded).weight(.semibold))
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(Color.white.opacity(0.9), in: Capsule())
                    }
                }
            }

            LazyVStack(spacing: 14) {
                ForEach(result.offers) { offer in
                    VStack(alignment: .leading, spacing: 12) {
                        HStack(alignment: .top) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(offer.propertyName)
                                    .font(.system(.headline, design: .rounded).weight(.bold))
                                Text(offer.windowLabel)
                                    .font(.system(.subheadline, design: .rounded))
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            Text(formattedPrice(offer.totalPrice, currency: offer.currency))
                                .font(.system(.headline, design: .rounded).weight(.bold))
                        }

                        Text(offer.roomName)
                            .font(.system(.subheadline, design: .rounded))

                        Text(offer.cancellationSummary)
                            .font(.system(.footnote, design: .rounded))
                            .foregroundStyle(.secondary)

                        Button {
                            Task {
                                await viewModel.selectStay(offer)
                            }
                        } label: {
                            Text(viewModel.isSelecting ? "Saving..." : "Select Stay")
                                .font(.system(.headline, design: .rounded).weight(.bold))
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(Color(red: 0.94, green: 0.39, blue: 0.26))
                        .disabled(viewModel.isSelecting)
                        .accessibilityIdentifier("workspace.selectStay.\(offer.propertyId)")
                    }
                    .padding(20)
                    .background(Color.white.opacity(0.9), in: RoundedRectangle(cornerRadius: 24, style: .continuous))
                }
            }
        }
    }

    private var emptyResultsState: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Pick a month and search to blend the best flexible windows.")
                .font(.system(.body, design: .rounded).weight(.medium))
            Text("Weekend-biased windows come back as one ranked list so selection feels like a single choice, not four separate searches.")
                .font(.system(.footnote, design: .rounded))
                .foregroundStyle(.secondary)
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white.opacity(0.72), in: RoundedRectangle(cornerRadius: 22, style: .continuous))
    }

    private var displayDestination: String {
        let rawValue = viewModel.workspace?.tripDraft.destinationId ?? "trip_workspace"
        return rawValue
            .replacingOccurrences(of: "dest_", with: "")
            .replacingOccurrences(of: "_", with: " ")
            .capitalized
    }

    private func formattedPrice(_ amount: Double, currency: String) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = currency
        formatter.maximumFractionDigits = 0
        return formatter.string(from: NSNumber(value: amount)) ?? "\(currency) \(Int(amount))"
    }

    private func summaryPill(_ label: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label.uppercased())
                .font(.system(.caption2, design: .rounded).weight(.bold))
                .foregroundStyle(.secondary)
            Text(value)
                .font(.system(.footnote, design: .rounded).weight(.semibold))
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(Color.white.opacity(0.8), in: Capsule())
    }
}
