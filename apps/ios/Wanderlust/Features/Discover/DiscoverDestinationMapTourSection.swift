import MapKit
import SwiftUI

struct WanderlustMapTourPlaybackConfiguration {
    let allowsAutoplay: Bool
    let durationScale: Double

    static func resolve(
        environment: [String: String] = ProcessInfo.processInfo.environment
    ) -> WanderlustMapTourPlaybackConfiguration {
        let allowsAutoplay = environment["WANDERLUST_DISABLE_MAP_TOUR_AUTOPLAY"] != "1"
        let durationScale = environment["WANDERLUST_MAP_TOUR_DURATION_SCALE"]
            .flatMap(Double.init)
            .map { max(0.05, $0) } ?? 1

        return WanderlustMapTourPlaybackConfiguration(
            allowsAutoplay: allowsAutoplay,
            durationScale: durationScale
        )
    }
}

private struct WanderlustMapTourPlaybackConfigurationKey: EnvironmentKey {
    static let defaultValue = WanderlustMapTourPlaybackConfiguration.resolve()
}

extension EnvironmentValues {
    var wanderlustMapTourPlaybackConfiguration: WanderlustMapTourPlaybackConfiguration {
        get { self[WanderlustMapTourPlaybackConfigurationKey.self] }
        set { self[WanderlustMapTourPlaybackConfigurationKey.self] = newValue }
    }
}

private enum DiscoverDestinationMapTourLayout {
    static let mapHeight: CGFloat = 260
    static let previewHeight: CGFloat = 178
    static let contentSpacing: CGFloat = 16
    static let buttonSpacing: CGFloat = 10
    static let chipSpacing: CGFloat = 10
    static let buttonCornerRadius: CGFloat = 16
    static let previewCornerRadius: CGFloat = 22
}

private enum DiscoverDestinationMapTourPlaybackMode {
    case idle
    case playing
    case paused
}

private struct DiscoverDestinationMapTourPlaybackSequence {
    let keyframes: [DestinationMapCameraKeyframe]
    let segmentDurations: [Double]
}

struct DiscoverDestinationMapTourSection: View {
    let destinationId: String
    let tour: DestinationMapTourView

    @Environment(\.accessibilityReduceMotion) private var accessibilityReduceMotion
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.wanderlustMapTourPlaybackConfiguration) private var playbackConfiguration

    @State private var cameraPosition: MapCameraPosition
    @State private var activeKeyframes: [DestinationMapCameraKeyframe]
    @State private var activeStopIndex: Int
    @State private var playbackMode: DiscoverDestinationMapTourPlaybackMode = .idle
    @State private var playbackTrigger = 0
    @State private var hasResolvedInitialPlayback = false
    @State private var lastCamera: MapCamera?
    @State private var lookAroundScene: MKLookAroundScene?
    @State private var isLookAroundViewerPresented = false
    @State private var playbackTask: Task<Void, Never>?
    @State private var lookAroundTask: Task<Void, Never>?
    @State private var uiTestStateLabel: String

    init(destinationId: String, tour: DestinationMapTourView) {
        self.destinationId = destinationId
        self.tour = tour

        let initialStop = tour.stops[0]
        let initialCamera = DiscoverDestinationMapTourSection.camera(for: initialStop.keyframes[0])
        _cameraPosition = State(initialValue: .camera(initialCamera))
        _activeKeyframes = State(initialValue: initialStop.keyframes)
        _activeStopIndex = State(initialValue: 0)
        _uiTestStateLabel = State(initialValue: "\(initialStop.id)|idle")
    }

    var body: some View {
        DiscoverDestinationDetailSectionCard {
            VStack(alignment: .leading, spacing: DiscoverDestinationMapTourLayout.contentSpacing) {
                header
                mapSurface
                currentStopSummary
                stopRail
                controls
                lookAroundPreviewSection
                playbackStateProbe
            }
        }
        .lookAroundViewer(
            isPresented: $isLookAroundViewerPresented,
            initialScene: lookAroundScene,
            allowsNavigation: true,
            showsRoadLabels: true
        )
        .task(id: activeStop.id) {
            await loadLookAroundScene(for: activeStop)
        }
        .onAppear {
            guard !hasResolvedInitialPlayback else { return }
            hasResolvedInitialPlayback = true
            resolveInitialPlayback()
        }
        .onDisappear {
            playbackTask?.cancel()
            lookAroundTask?.cancel()
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 10) {
            DiscoverDestinationDetailSectionHeader(
                title: "Map Tour",
                accentColor: DiscoverDestinationDetailLayout.accentColor
            )

            Text(tour.title)
                .font(.system(.title3, design: .serif).weight(.semibold))
                .foregroundStyle(.primary)

            Text(tour.summary)
                .font(.system(.subheadline, design: .rounded))
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier("discover.detail.mapTour.header.\(destinationId)")
    }

    private var mapSurface: some View {
        Map(
            position: $cameraPosition,
            bounds: cameraBounds,
            interactionModes: [.pan, .zoom, .pitch, .rotate]
        ) {
            ForEach(Array(tour.stops.enumerated()), id: \.element.id) { index, stop in
                Marker(stop.title, coordinate: stop.coordinate.clLocationCoordinate2D)
                    .tint(index == activeStopIndex ? DiscoverDestinationDetailLayout.accentColor : .white)
            }
        }
        .mapStyle(.imagery(elevation: .realistic))
        .mapControlVisibility(.hidden)
        .frame(maxWidth: .infinity)
        .frame(height: DiscoverDestinationMapTourLayout.mapHeight)
        .clipShape(
            RoundedRectangle(
                cornerRadius: DiscoverDestinationMapTourLayout.previewCornerRadius,
                style: .continuous
            )
        )
        .overlay(alignment: .topLeading) {
            currentStopBadge
                .padding(14)
        }
        .overlay {
            RoundedRectangle(
                cornerRadius: DiscoverDestinationMapTourLayout.previewCornerRadius,
                style: .continuous
            )
            .strokeBorder(cardBorderColor, lineWidth: DiscoverDestinationDetailLayout.borderWidth)
        }
        .mapCameraKeyframeAnimator(trigger: playbackTrigger) { camera in
            KeyframeTrack(\MapCamera.centerCoordinate) {
                MoveKeyframe(camera.centerCoordinate)
                for keyframe in activeKeyframes {
                    LinearKeyframe(
                        keyframe.centerCoordinate.clLocationCoordinate2D,
                        duration: scaledDuration(keyframe.durationSeconds)
                    )
                }
            }

            KeyframeTrack(\MapCamera.distance) {
                MoveKeyframe(camera.distance)
                for keyframe in activeKeyframes {
                    LinearKeyframe(
                        keyframe.distanceMeters,
                        duration: scaledDuration(keyframe.durationSeconds)
                    )
                }
            }

            KeyframeTrack(\MapCamera.heading) {
                MoveKeyframe(camera.heading)
                for keyframe in activeKeyframes {
                    LinearKeyframe(
                        keyframe.headingDegrees,
                        duration: scaledDuration(keyframe.durationSeconds)
                    )
                }
            }

            KeyframeTrack(\MapCamera.pitch) {
                MoveKeyframe(camera.pitch)
                for keyframe in activeKeyframes {
                    LinearKeyframe(
                        keyframe.pitchDegrees,
                        duration: scaledDuration(keyframe.durationSeconds)
                    )
                }
            }
        }
        .onMapCameraChange(frequency: .continuous) { context in
            lastCamera = context.camera

            if cameraPosition.positionedByUser, playbackMode == .playing {
                pausePlayback()
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Cinematic map tour")
        .accessibilityValue("\(activeStop.title). Stop \(activeStopIndex + 1) of \(tour.stops.count)")
        .accessibilityIdentifier("discover.detail.mapTour.map.\(destinationId)")
    }

    private var currentStopBadge: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("STOP \(activeStopIndex + 1) OF \(tour.stops.count)")
                .font(.system(.caption2, design: .monospaced).weight(.semibold))
                .tracking(0.8)

            Text(activeStop.title)
                .font(.system(.caption, design: .rounded).weight(.semibold))
                .lineLimit(2)
        }
        .foregroundStyle(.white)
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(Color.black.opacity(0.48), in: Capsule())
    }

    private var currentStopSummary: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(activeStop.title)
                .font(.system(.headline, design: .serif).weight(.semibold))
                .foregroundStyle(.primary)

            Text(activeStop.subtitle)
                .font(.system(.subheadline, design: .rounded))
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier("discover.detail.mapTour.currentStop.\(destinationId)")
        .accessibilityLabel(activeStop.title)
        .accessibilityValue(activeStop.id)
    }

    private var stopRail: some View {
        ScrollView(.horizontal) {
            HStack(spacing: DiscoverDestinationMapTourLayout.chipSpacing) {
                ForEach(Array(tour.stops.enumerated()), id: \.element.id) { index, stop in
                    Button {
                        playStop(at: index)
                    } label: {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Stop \(index + 1)")
                                .font(.system(.caption2, design: .monospaced).weight(.semibold))
                                .foregroundStyle(index == activeStopIndex ? .primary : .secondary)

                            Text(stop.title)
                                .font(.system(.subheadline, design: .rounded).weight(.semibold))
                                .multilineTextAlignment(.leading)
                                .foregroundStyle(.primary)
                        }
                        .padding(.horizontal, 14)
                        .padding(.vertical, 12)
                        .frame(width: 170, alignment: .leading)
                        .background(
                            index == activeStopIndex
                            ? Color.white.opacity(colorScheme == .dark ? 0.14 : 0.94)
                            : Color.white.opacity(colorScheme == .dark ? 0.06 : 0.62),
                            in: RoundedRectangle(cornerRadius: 18, style: .continuous)
                        )
                        .overlay {
                            RoundedRectangle(cornerRadius: 18, style: .continuous)
                                .strokeBorder(
                                    index == activeStopIndex
                                    ? DiscoverDestinationDetailLayout.accentColor.opacity(0.75)
                                    : cardBorderColor,
                                    lineWidth: DiscoverDestinationDetailLayout.borderWidth
                                )
                        }
                    }
                    .buttonStyle(.plain)
                    .accessibilityIdentifier("discover.detail.mapTour.stop.\(stop.id)")
                    .accessibilityValue(index == activeStopIndex ? "current stop" : "inactive stop")
                }
            }
            .padding(.vertical, 2)
        }
        .scrollIndicators(.hidden)
        .accessibilityIdentifier("discover.detail.mapTour.stopRail.\(destinationId)")
    }

    private var controls: some View {
        HStack(spacing: DiscoverDestinationMapTourLayout.buttonSpacing) {
            Button(action: togglePlayback) {
                Label(
                    playbackMode == .playing ? "Pause" : "Play",
                    systemImage: playbackMode == .playing ? "pause.fill" : "play.fill"
                )
                .font(.system(.subheadline, design: .rounded).weight(.semibold))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
            }
            .buttonStyle(.plain)
            .foregroundStyle(.white)
            .background(
                DiscoverDestinationDetailLayout.accentColor,
                in: RoundedRectangle(
                    cornerRadius: DiscoverDestinationMapTourLayout.buttonCornerRadius,
                    style: .continuous
                )
            )
            .accessibilityIdentifier("discover.detail.mapTour.playButton.\(destinationId)")
            .accessibilityLabel(playbackMode == .playing ? "Pause" : "Play")
            .accessibilityValue(playbackMode == .playing ? "playing" : "paused")

            Button(action: replayTour) {
                Label("Replay", systemImage: "arrow.counterclockwise")
                    .font(.system(.subheadline, design: .rounded).weight(.semibold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
            }
            .buttonStyle(.plain)
            .foregroundStyle(.primary)
            .background(
                Color.white.opacity(colorScheme == .dark ? 0.08 : 0.84),
                in: RoundedRectangle(
                    cornerRadius: DiscoverDestinationMapTourLayout.buttonCornerRadius,
                    style: .continuous
                )
            )
            .overlay {
                RoundedRectangle(
                    cornerRadius: DiscoverDestinationMapTourLayout.buttonCornerRadius,
                    style: .continuous
                )
                .strokeBorder(cardBorderColor, lineWidth: DiscoverDestinationDetailLayout.borderWidth)
            }
            .accessibilityIdentifier("discover.detail.mapTour.replayButton.\(destinationId)")
        }
    }

    @ViewBuilder
    private var lookAroundPreviewSection: some View {
        if lookAroundScene != nil {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Text("Street-Level Preview")
                        .font(.system(.headline, design: .rounded).weight(.semibold))
                        .foregroundStyle(.primary)

                    Spacer()

                    Button("Open Look Around") {
                        isLookAroundViewerPresented = true
                    }
                    .font(.system(.subheadline, design: .rounded).weight(.semibold))
                    .buttonStyle(.plain)
                    .foregroundStyle(DiscoverDestinationDetailLayout.accentColor)
                    .accessibilityIdentifier("discover.detail.mapTour.lookAroundButton.\(destinationId)")
                }

                LookAroundPreview(
                    initialScene: lookAroundScene,
                    allowsNavigation: false,
                    showsRoadLabels: true,
                    badgePosition: .bottomTrailing
                )
                .frame(height: DiscoverDestinationMapTourLayout.previewHeight)
                .clipShape(
                    RoundedRectangle(
                        cornerRadius: DiscoverDestinationMapTourLayout.previewCornerRadius,
                        style: .continuous
                    )
                )
                .overlay {
                    RoundedRectangle(
                        cornerRadius: DiscoverDestinationMapTourLayout.previewCornerRadius,
                        style: .continuous
                    )
                    .strokeBorder(cardBorderColor, lineWidth: DiscoverDestinationDetailLayout.borderWidth)
                }
            }
            .transition(.opacity)
            .accessibilityIdentifier("discover.detail.mapTour.lookAround.\(destinationId)")
        }
    }

    private var activeStop: DestinationMapTourStop {
        tour.stops[activeStopIndex]
    }

    private var playbackStateProbe: some View {
        Text(uiTestStateLabel)
            .font(.system(size: 1))
            .foregroundStyle(.clear)
            .frame(width: 1, height: 1)
            .clipped()
            .allowsHitTesting(false)
            .id(uiTestStateLabel)
            .accessibilityIdentifier("discover.detail.mapTour.state.\(destinationId)")
    }

    private var cardBorderColor: Color {
        colorScheme == .dark ? Color.white.opacity(0.08) : Color.black.opacity(0.08)
    }

    private var cameraBounds: MapCameraBounds {
        let unionRect = tour.stops.reduce(MKMapRect.null) { partialResult, stop in
            let point = MKMapPoint(stop.coordinate.clLocationCoordinate2D)
            let rect = MKMapRect(
                x: point.x - 1_500,
                y: point.y - 1_500,
                width: 3_000,
                height: 3_000
            )
            return partialResult.union(rect)
        }

        return MapCameraBounds(
            centerCoordinateBounds: unionRect,
            minimumDistance: 300,
            maximumDistance: 12_000
        )
    }

    private func resolveInitialPlayback() {
        lastCamera = Self.camera(for: activeStop.keyframes[0])

        guard playbackConfiguration.allowsAutoplay, tour.autoplay, !accessibilityReduceMotion else {
            playbackMode = .paused
            updateUITestState(mode: .paused)
            return
        }

        replayTour()
    }

    private func togglePlayback() {
        if playbackMode == .playing {
            pausePlayback()
        } else {
            playStop(at: activeStopIndex)
        }
    }

    private func replayTour() {
        guard !tour.stops.isEmpty else { return }

        let sequence = replaySequence()
        playbackTask?.cancel()
        activeStopIndex = 0
        activeKeyframes = sequence.keyframes
        playbackMode = .playing
        updateUITestState(stopIndex: 0, mode: .playing)
        playbackTrigger += 1
        startPlaybackTask(
            stopIndices: Array(tour.stops.indices),
            segmentDurations: sequence.segmentDurations,
            finishAt: tour.stops.count - 1
        )
    }

    private func playStop(at index: Int) {
        guard tour.stops.indices.contains(index) else { return }

        playbackTask?.cancel()
        activeStopIndex = index
        activeKeyframes = stabilizedKeyframes(for: tour.stops[index].keyframes, maxStepDegrees: 16)
        playbackMode = .playing
        updateUITestState(stopIndex: index, mode: .playing)
        playbackTrigger += 1
        startPlaybackTask(
            stopIndices: [index],
            segmentDurations: [scaledDuration(for: tour.stops[index].keyframes)],
            finishAt: index
        )
    }

    private func pausePlayback() {
        playbackTask?.cancel()
        playbackMode = .paused
        updateUITestState(mode: .paused)

        if let lastCamera {
            cameraPosition = .camera(lastCamera)
        }
    }

    private func startPlaybackTask(
        stopIndices: [Int],
        segmentDurations: [Double],
        finishAt finishIndex: Int
    ) {
        playbackTask = Task {
            guard !stopIndices.isEmpty, stopIndices.count == segmentDurations.count else { return }

            for (offset, stopIndex) in stopIndices.enumerated() {
                await MainActor.run {
                    activeStopIndex = stopIndex
                    updateUITestState(stopIndex: stopIndex, mode: .playing)
                }

                let duration = segmentDurations[offset]
                try? await Task.sleep(nanoseconds: Self.nanoseconds(for: duration))

                if Task.isCancelled {
                    return
                }
            }

            await MainActor.run {
                activeStopIndex = finishIndex
                playbackMode = .paused
                updateUITestState(stopIndex: finishIndex, mode: .paused)
            }
        }
    }

    @MainActor
    private func loadLookAroundScene(for stop: DestinationMapTourStop) async {
        lookAroundTask?.cancel()
        lookAroundScene = nil

        let coordinate = stop.lookAroundCoordinate ?? stop.coordinate
        let requestCoordinate = coordinate.clLocationCoordinate2D

        lookAroundTask = Task {
            let request = MKLookAroundSceneRequest(coordinate: requestCoordinate)
            let scene = try? await request.scene

            guard !Task.isCancelled else { return }

            await MainActor.run {
                lookAroundScene = scene
            }
        }

        await lookAroundTask?.value
    }

    private func scaledDuration(for keyframes: [DestinationMapCameraKeyframe]) -> Double {
        keyframes.reduce(0) { partialResult, keyframe in
            partialResult + scaledDuration(keyframe.durationSeconds)
        }
    }

    private func replaySequence() -> DiscoverDestinationMapTourPlaybackSequence {
        guard !tour.stops.isEmpty else {
            return DiscoverDestinationMapTourPlaybackSequence(keyframes: [], segmentDurations: [])
        }

        var combinedKeyframes: [DestinationMapCameraKeyframe] = []
        var segmentDurations: [Double] = []

        for index in tour.stops.indices {
            let stop = tour.stops[index]
            combinedKeyframes.append(contentsOf: stop.keyframes)

            var segmentDuration = scaledDuration(for: stop.keyframes)
            if tour.stops.indices.contains(index + 1) {
                let bridgeKeyframes = transitionKeyframes(from: stop, to: tour.stops[index + 1])
                combinedKeyframes.append(contentsOf: bridgeKeyframes)
                segmentDuration += scaledDuration(for: bridgeKeyframes)
            }

            segmentDurations.append(segmentDuration)
        }

        return DiscoverDestinationMapTourPlaybackSequence(
            keyframes: stabilizedKeyframes(for: combinedKeyframes, maxStepDegrees: 18),
            segmentDurations: segmentDurations
        )
    }

    private func transitionKeyframes(
        from currentStop: DestinationMapTourStop,
        to nextStop: DestinationMapTourStop
    ) -> [DestinationMapCameraKeyframe] {
        let currentKeyframe = currentStop.keyframes.last ?? currentStop.keyframes[0]
        let nextKeyframe = nextStop.keyframes[0]
        let transitHeading = bearing(
            from: currentKeyframe.centerCoordinate.clLocationCoordinate2D,
            to: nextKeyframe.centerCoordinate.clLocationCoordinate2D
        )
        let easedHeading = currentKeyframe.headingDegrees
            + shortestAngleDelta(from: currentKeyframe.headingDegrees, to: transitHeading) * 0.45
        let pullbackDistance = clamp(
            max(currentKeyframe.distanceMeters, nextKeyframe.distanceMeters) * 1.22,
            lower: 5_800,
            upper: 8_800
        )
        let midpoint = midpointCoordinate(
            currentKeyframe.centerCoordinate,
            nextKeyframe.centerCoordinate
        )
        let transitDistance = clamp(
            coordinateDistance(
                currentKeyframe.centerCoordinate.clLocationCoordinate2D,
                nextKeyframe.centerCoordinate.clLocationCoordinate2D
            ) * 1.45,
            lower: 7_600,
            upper: 11_000
        )

        return [
            DestinationMapCameraKeyframe(
                centerCoordinate: currentKeyframe.centerCoordinate,
                distanceMeters: pullbackDistance,
                pitchDegrees: min(currentKeyframe.pitchDegrees, 42),
                headingDegrees: easedHeading,
                durationSeconds: 1.2
            ),
            DestinationMapCameraKeyframe(
                centerCoordinate: midpoint,
                distanceMeters: transitDistance,
                pitchDegrees: 32,
                headingDegrees: transitHeading,
                durationSeconds: 1.8
            ),
        ]
    }

    private func scaledDuration(_ durationSeconds: Double) -> Double {
        max(0.05, durationSeconds * playbackConfiguration.durationScale)
    }

    private func stabilizedKeyframes(
        for keyframes: [DestinationMapCameraKeyframe],
        maxStepDegrees: Double
    ) -> [DestinationMapCameraKeyframe] {
        guard !keyframes.isEmpty else {
            return []
        }

        var previousHeading = lastCamera?.heading ?? keyframes[0].headingDegrees

        return keyframes.map { keyframe in
            let stabilizedHeading = constrainedHeading(
                to: keyframe.headingDegrees,
                relativeTo: previousHeading,
                maxStepDegrees: maxStepDegrees
            )
            previousHeading = stabilizedHeading

            return DestinationMapCameraKeyframe(
                centerCoordinate: keyframe.centerCoordinate,
                distanceMeters: keyframe.distanceMeters,
                pitchDegrees: keyframe.pitchDegrees,
                headingDegrees: stabilizedHeading,
                durationSeconds: keyframe.durationSeconds
            )
        }
    }

    private func constrainedHeading(
        to target: Double,
        relativeTo previous: Double,
        maxStepDegrees: Double
    ) -> Double {
        let closest = closestHeading(to: target, relativeTo: previous)
        let delta = closest - previous

        if abs(delta) <= maxStepDegrees {
            return closest
        }

        return previous + (delta > 0 ? maxStepDegrees : -maxStepDegrees)
    }

    private func closestHeading(
        to target: Double,
        relativeTo previous: Double
    ) -> Double {
        let normalizedTarget = normalizedHeading(target)
        let normalizedPrevious = normalizedHeading(previous)
        let delta = normalizedTarget - normalizedPrevious

        switch delta {
        case ..<(-180):
            return previous + delta + 360
        case 180...:
            return previous + delta - 360
        default:
            return previous + delta
        }
    }

    private func normalizedHeading(_ heading: Double) -> Double {
        var value = heading.truncatingRemainder(dividingBy: 360)
        if value < 0 {
            value += 360
        }

        return value
    }

    private func midpointCoordinate(
        _ lhs: DestinationMapCoordinate,
        _ rhs: DestinationMapCoordinate
    ) -> DestinationMapCoordinate {
        DestinationMapCoordinate(
            latitude: (lhs.latitude + rhs.latitude) / 2,
            longitude: (lhs.longitude + rhs.longitude) / 2
        )
    }

    private func coordinateDistance(
        _ lhs: CLLocationCoordinate2D,
        _ rhs: CLLocationCoordinate2D
    ) -> CLLocationDistance {
        CLLocation(latitude: lhs.latitude, longitude: lhs.longitude)
            .distance(from: CLLocation(latitude: rhs.latitude, longitude: rhs.longitude))
    }

    private func bearing(
        from start: CLLocationCoordinate2D,
        to end: CLLocationCoordinate2D
    ) -> Double {
        let startLatitude = start.latitude.radians
        let startLongitude = start.longitude.radians
        let endLatitude = end.latitude.radians
        let endLongitude = end.longitude.radians

        let deltaLongitude = endLongitude - startLongitude
        let y = sin(deltaLongitude) * cos(endLatitude)
        let x = cos(startLatitude) * sin(endLatitude)
            - sin(startLatitude) * cos(endLatitude) * cos(deltaLongitude)

        let heading = atan2(y, x).degrees
        return heading >= 0 ? heading : heading + 360
    }

    private func shortestAngleDelta(from start: Double, to end: Double) -> Double {
        let delta = (end - start).truncatingRemainder(dividingBy: 360)

        switch delta {
        case ..<(-180):
            return delta + 360
        case 180...:
            return delta - 360
        default:
            return delta
        }
    }

    private func clamp(_ value: Double, lower: Double, upper: Double) -> Double {
        min(max(value, lower), upper)
    }

    private static func nanoseconds(for seconds: Double) -> UInt64 {
        UInt64((seconds * 1_000_000_000).rounded())
    }

    private static func camera(for keyframe: DestinationMapCameraKeyframe) -> MapCamera {
        MapCamera(
            centerCoordinate: keyframe.centerCoordinate.clLocationCoordinate2D,
            distance: keyframe.distanceMeters,
            heading: keyframe.headingDegrees,
            pitch: keyframe.pitchDegrees
        )
    }

    private func updateUITestState(
        stopIndex: Int? = nil,
        mode: DiscoverDestinationMapTourPlaybackMode? = nil
    ) {
        let resolvedStopIndex = stopIndex ?? activeStopIndex
        let resolvedMode = mode ?? playbackMode
        uiTestStateLabel = "\(tour.stops[resolvedStopIndex].id)|\(resolvedMode.accessibilityValue)"
    }
}

private extension DestinationMapCoordinate {
    var clLocationCoordinate2D: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }
}

private extension DiscoverDestinationMapTourPlaybackMode {
    var accessibilityValue: String {
        switch self {
        case .idle:
            "idle"
        case .playing:
            "playing"
        case .paused:
            "paused"
        }
    }
}

private extension Double {
    var radians: Double { self * .pi / 180 }
    var degrees: Double { self * 180 / .pi }
}
