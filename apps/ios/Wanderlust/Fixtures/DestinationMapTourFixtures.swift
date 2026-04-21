import Foundation

private func coordinate(_ latitude: Double, _ longitude: Double) -> DestinationMapCoordinate {
    DestinationMapCoordinate(latitude: latitude, longitude: longitude)
}

func destinationMapTourFixture(for destinationId: String) -> DestinationMapTourView? {
    destinationMapTourFixtures[destinationId]
}

private let destinationMapTourFixtures: [String: DestinationMapTourView] = [
    "dest_paris": DestinationMapTourView(
        title: "Paris Arrondissement Tour",
        summary: "Move through the historic core, the Left Bank, and Montmartre so Paris reads as a sequence of districts instead of isolated landmarks.",
        autoplay: true,
        stops: [
            DestinationMapTourStop(
                id: "paris-core-1st-4th",
                title: "1st And 4th: Seine Core",
                subtitle: "Open on the historic center so the Louvre, river crossings, and island edge read as one dense district.",
                coordinate: coordinate(48.85876, 2.34231),
                lookAroundCoordinate: coordinate(48.86027, 2.33712),
                keyframes: [
                    DestinationMapCameraKeyframe(
                        centerCoordinate: coordinate(48.85876, 2.34231),
                        distanceMeters: 7400,
                        pitchDegrees: 40,
                        headingDegrees: 304,
                        durationSeconds: 1.8
                    ),
                    DestinationMapCameraKeyframe(
                        centerCoordinate: coordinate(48.85903, 2.34195),
                        distanceMeters: 5000,
                        pitchDegrees: 46,
                        headingDegrees: 312,
                        durationSeconds: 1.9
                    ),
                    DestinationMapCameraKeyframe(
                        centerCoordinate: coordinate(48.85938, 2.34108),
                        distanceMeters: 3000,
                        pitchDegrees: 54,
                        headingDegrees: 320,
                        durationSeconds: 1.8
                    ),
                    DestinationMapCameraKeyframe(
                        centerCoordinate: coordinate(48.85968, 2.34042),
                        distanceMeters: 1800,
                        pitchDegrees: 60,
                        headingDegrees: 326,
                        durationSeconds: 1.6
                    )
                ]
            ),
            DestinationMapTourStop(
                id: "paris-left-bank-6th-7th",
                title: "6th And 7th: Left Bank",
                subtitle: "Drift west through Saint-Germain and the 7th so the boulevard rhythm feels lived in, not monumental.",
                coordinate: coordinate(48.85408, 2.33184),
                lookAroundCoordinate: coordinate(48.85472, 2.33384),
                keyframes: [
                    DestinationMapCameraKeyframe(
                        centerCoordinate: coordinate(48.85408, 2.33184),
                        distanceMeters: 7000,
                        pitchDegrees: 40,
                        headingDegrees: 320,
                        durationSeconds: 1.7
                    ),
                    DestinationMapCameraKeyframe(
                        centerCoordinate: coordinate(48.85428, 2.3314),
                        distanceMeters: 4800,
                        pitchDegrees: 46,
                        headingDegrees: 328,
                        durationSeconds: 1.8
                    ),
                    DestinationMapCameraKeyframe(
                        centerCoordinate: coordinate(48.85456, 2.3308),
                        distanceMeters: 2800,
                        pitchDegrees: 54,
                        headingDegrees: 336,
                        durationSeconds: 1.7
                    ),
                    DestinationMapCameraKeyframe(
                        centerCoordinate: coordinate(48.8548, 2.33018),
                        distanceMeters: 1700,
                        pitchDegrees: 60,
                        headingDegrees: 342,
                        durationSeconds: 1.5
                    )
                ]
            ),
            DestinationMapTourStop(
                id: "paris-montmartre-18th",
                title: "18th: Montmartre Heights",
                subtitle: "Finish in the 18th so the hill and street grain give Paris a final sense of elevation and texture.",
                coordinate: coordinate(48.886706, 2.343104),
                lookAroundCoordinate: coordinate(48.886704, 2.343094),
                keyframes: [
                    DestinationMapCameraKeyframe(
                        centerCoordinate: coordinate(48.88694, 2.34408),
                        distanceMeters: 7600,
                        pitchDegrees: 42,
                        headingDegrees: 42,
                        durationSeconds: 1.8
                    ),
                    DestinationMapCameraKeyframe(
                        centerCoordinate: coordinate(48.88704, 2.34374),
                        distanceMeters: 5200,
                        pitchDegrees: 48,
                        headingDegrees: 50,
                        durationSeconds: 2
                    ),
                    DestinationMapCameraKeyframe(
                        centerCoordinate: coordinate(48.88696, 2.34336),
                        distanceMeters: 3000,
                        pitchDegrees: 56,
                        headingDegrees: 58,
                        durationSeconds: 1.8
                    ),
                    DestinationMapCameraKeyframe(
                        centerCoordinate: coordinate(48.88682, 2.3431),
                        distanceMeters: 1750,
                        pitchDegrees: 62,
                        headingDegrees: 66,
                        durationSeconds: 1.6
                    )
                ]
            )
        ]
    ),
    "dest_kyoto": DestinationMapTourView(
        title: "Kyoto In Motion",
        summary: "Move from temple hills to Gion and then out to Arashiyama so the city feels slower, greener, and more spatially distinct.",
        autoplay: true,
        stops: [
            DestinationMapTourStop(
                id: "kyoto-higashiyama",
                title: "Higashiyama Morning",
                subtitle: "Start in the temple district where Kyoto makes the strongest first impression.",
                coordinate: coordinate(34.994857, 135.785046),
                lookAroundCoordinate: coordinate(34.995102, 135.784991),
                keyframes: [
                    DestinationMapCameraKeyframe(
                        centerCoordinate: coordinate(34.994857, 135.785046),
                        distanceMeters: 5200,
                        pitchDegrees: 44,
                        headingDegrees: 28,
                        durationSeconds: 1.5
                    ),
                    DestinationMapCameraKeyframe(
                        centerCoordinate: coordinate(34.995321, 135.78412),
                        distanceMeters: 1700,
                        pitchDegrees: 60,
                        headingDegrees: 52,
                        durationSeconds: 1.8
                    ),
                    DestinationMapCameraKeyframe(
                        centerCoordinate: coordinate(34.994857, 135.785046),
                        distanceMeters: 760,
                        pitchDegrees: 74,
                        headingDegrees: 94,
                        durationSeconds: 1.4
                    )
                ]
            ),
            DestinationMapTourStop(
                id: "kyoto-gion-kamo",
                title: "Gion And The Kamo",
                subtitle: "Shift west to the lanes and river edge that define the city's evening rhythm.",
                coordinate: coordinate(35.003708, 135.776531),
                lookAroundCoordinate: coordinate(35.003676, 135.775491),
                keyframes: [
                    DestinationMapCameraKeyframe(
                        centerCoordinate: coordinate(35.003708, 135.776531),
                        distanceMeters: 4800,
                        pitchDegrees: 42,
                        headingDegrees: 180,
                        durationSeconds: 1.4
                    ),
                    DestinationMapCameraKeyframe(
                        centerCoordinate: coordinate(35.004132, 135.77558),
                        distanceMeters: 1500,
                        pitchDegrees: 58,
                        headingDegrees: 214,
                        durationSeconds: 1.7
                    ),
                    DestinationMapCameraKeyframe(
                        centerCoordinate: coordinate(35.003708, 135.776531),
                        distanceMeters: 720,
                        pitchDegrees: 72,
                        headingDegrees: 248,
                        durationSeconds: 1.4
                    )
                ]
            ),
            DestinationMapTourStop(
                id: "kyoto-arashiyama",
                title: "Arashiyama Edge",
                subtitle: "End at the greener western edge so Kyoto reads as more than temples alone.",
                coordinate: coordinate(35.01704, 135.67777),
                lookAroundCoordinate: coordinate(35.017151, 135.676992),
                keyframes: [
                    DestinationMapCameraKeyframe(
                        centerCoordinate: coordinate(35.01704, 135.67777),
                        distanceMeters: 6400,
                        pitchDegrees: 50,
                        headingDegrees: 96,
                        durationSeconds: 1.6
                    ),
                    DestinationMapCameraKeyframe(
                        centerCoordinate: coordinate(35.01662, 135.67895),
                        distanceMeters: 2300,
                        pitchDegrees: 64,
                        headingDegrees: 124,
                        durationSeconds: 1.8
                    ),
                    DestinationMapCameraKeyframe(
                        centerCoordinate: coordinate(35.01704, 135.67777),
                        distanceMeters: 980,
                        pitchDegrees: 78,
                        headingDegrees: 164,
                        durationSeconds: 1.5
                    )
                ]
            )
        ]
    ),
    "dest_mexico_city": DestinationMapTourView(
        title: "Mexico City In Motion",
        summary: "Cut between Chapultepec, Roma-Condesa, and the historic center so the city feels broad, green, and densely alive.",
        autoplay: true,
        stops: [
            DestinationMapTourStop(
                id: "mexico-city-chapultepec",
                title: "Chapultepec Sweep",
                subtitle: "Open over the park and castle to show scale, greenery, and altitude fast.",
                coordinate: coordinate(19.42042, -99.18162),
                lookAroundCoordinate: coordinate(19.420406, -99.181933),
                keyframes: [
                    DestinationMapCameraKeyframe(
                        centerCoordinate: coordinate(19.42042, -99.18162),
                        distanceMeters: 7200,
                        pitchDegrees: 46,
                        headingDegrees: 20,
                        durationSeconds: 1.5
                    ),
                    DestinationMapCameraKeyframe(
                        centerCoordinate: coordinate(19.42003, -99.18026),
                        distanceMeters: 2400,
                        pitchDegrees: 62,
                        headingDegrees: 56,
                        durationSeconds: 1.8
                    ),
                    DestinationMapCameraKeyframe(
                        centerCoordinate: coordinate(19.42042, -99.18162),
                        distanceMeters: 980,
                        pitchDegrees: 76,
                        headingDegrees: 102,
                        durationSeconds: 1.5
                    )
                ]
            ),
            DestinationMapTourStop(
                id: "mexico-city-roma-condesa",
                title: "Roma-Condesa Grid",
                subtitle: "Bring the camera down into the tree-lined grid where the trip usually lives day to day.",
                coordinate: coordinate(19.41253, -99.16964),
                lookAroundCoordinate: coordinate(19.412962, -99.169363),
                keyframes: [
                    DestinationMapCameraKeyframe(
                        centerCoordinate: coordinate(19.41253, -99.16964),
                        distanceMeters: 5400,
                        pitchDegrees: 42,
                        headingDegrees: 312,
                        durationSeconds: 1.4
                    ),
                    DestinationMapCameraKeyframe(
                        centerCoordinate: coordinate(19.41324, -99.16852),
                        distanceMeters: 1700,
                        pitchDegrees: 58,
                        headingDegrees: 338,
                        durationSeconds: 1.7
                    ),
                    DestinationMapCameraKeyframe(
                        centerCoordinate: coordinate(19.41253, -99.16964),
                        distanceMeters: 820,
                        pitchDegrees: 72,
                        headingDegrees: 12,
                        durationSeconds: 1.4
                    )
                ]
            ),
            DestinationMapTourStop(
                id: "mexico-city-centro",
                title: "Centro Historico",
                subtitle: "Finish in the monumental core so the historic center feels like its own city chapter.",
                coordinate: coordinate(19.43261, -99.13321),
                lookAroundCoordinate: coordinate(19.432608, -99.133209),
                keyframes: [
                    DestinationMapCameraKeyframe(
                        centerCoordinate: coordinate(19.43261, -99.13321),
                        distanceMeters: 6200,
                        pitchDegrees: 48,
                        headingDegrees: 182,
                        durationSeconds: 1.6
                    ),
                    DestinationMapCameraKeyframe(
                        centerCoordinate: coordinate(19.43224, -99.13213),
                        distanceMeters: 2100,
                        pitchDegrees: 64,
                        headingDegrees: 214,
                        durationSeconds: 1.8
                    ),
                    DestinationMapCameraKeyframe(
                        centerCoordinate: coordinate(19.43261, -99.13321),
                        distanceMeters: 900,
                        pitchDegrees: 78,
                        headingDegrees: 252,
                        durationSeconds: 1.5
                    )
                ]
            )
        ]
    )
]
