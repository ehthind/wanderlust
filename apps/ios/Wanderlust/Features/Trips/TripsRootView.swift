import SwiftUI

struct TripsRootView: View {
    @ObservedObject var appState: AppState

    var body: some View {
        NavigationStack {
            if let tripDraftId = appState.activeTripDraftId {
                TripWorkspaceScreen(tripDraftId: tripDraftId, appState: appState)
                    .id(tripDraftId)
            } else {
                PlaceholderScreen(
                    title: "Your Active Trip Will Reopen Here",
                    subtitle: "The guest flow stores the latest trip on device so you can step back into the workspace without account setup.",
                    symbol: "suitcase.rolling"
                )
            }
        }
    }
}
