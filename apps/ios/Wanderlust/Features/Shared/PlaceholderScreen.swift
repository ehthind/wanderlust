import SwiftUI

struct PlaceholderScreen: View {
    let title: String
    let subtitle: String
    let symbol: String

    @Environment(\.wanderlustBottomShellMetrics) private var bottomShellMetrics

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(red: 0.95, green: 0.92, blue: 0.83),
                    Color(red: 0.85, green: 0.91, blue: 0.96)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            VStack(spacing: 20) {
                Image(systemName: symbol)
                    .font(.system(size: 52, weight: .semibold))
                    .foregroundStyle(Color(red: 0.08, green: 0.2, blue: 0.34))

                Text(title)
                    .font(.system(.title, design: .serif).weight(.bold))
                    .multilineTextAlignment(.center)
                    .foregroundStyle(Color(red: 0.08, green: 0.2, blue: 0.34))

                Text(subtitle)
                    .font(.system(.body, design: .rounded))
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 20)
            }
            .padding(28)
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 28, style: .continuous))
            .padding(24)
            .padding(.top, bottomShellMetrics.topContentInset)
            .padding(.bottom, bottomShellMetrics.contentInset)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
