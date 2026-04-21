import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDestinationProfileView } = vi.hoisted(() => ({
  getDestinationProfileView: vi.fn(),
}));

vi.mock("@wanderlust/domains/destinations", () => ({
  getDestinationProfileView,
}));

describe("GET /api/destinations/[destinationId]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns the destination profile payload", async () => {
    getDestinationProfileView.mockReturnValue({
      destination: {
        id: "dest_paris",
        slug: "paris",
        city: "Paris",
        country: "France",
        thesis: "Glow",
        bestSeason: "Apr-Oct",
        budget: "$$$",
        visa: "Visa-free",
        idealTripLength: "4-7 days",
        heroImageUrl: "https://example.test/paris.jpg",
        heroImageAccessibilityLabel: "Paris skyline",
      },
      details: [
        { label: "Best season", value: "Apr-Oct" },
        { label: "Budget", value: "$$$" },
        { label: "Visa", value: "Visa-free" },
        { label: "Trip length", value: "4-7 days" },
      ],
      stories: Array.from({ length: 8 }, (_, index) => ({
        id: `story_${index}`,
        category: "Dining",
        title: `Story ${index}`,
        imageUrl: `https://example.test/story-${index}.jpg`,
        imageAccessibilityLabel: `Story ${index} image`,
      })),
      mapTour: {
        title: "Paris In Motion",
        summary: "A cinematic map tour.",
        autoplay: true,
        stops: Array.from({ length: 3 }, (_, index) => ({
          id: `stop_${index}`,
          title: `Stop ${index}`,
          subtitle: `Subtitle ${index}`,
          coordinate: {
            latitude: 48.85 + index * 0.01,
            longitude: 2.29 + index * 0.01,
          },
          lookAroundCoordinate: {
            latitude: 48.85 + index * 0.01,
            longitude: 2.29 + index * 0.01,
          },
          keyframes: Array.from({ length: 3 }, (_, keyframeIndex) => ({
            centerCoordinate: {
              latitude: 48.85 + index * 0.01,
              longitude: 2.29 + index * 0.01,
            },
            distanceMeters: 1000 + keyframeIndex * 500,
            pitchDegrees: 45 + keyframeIndex * 5,
            headingDegrees: keyframeIndex * 30,
            durationSeconds: 1.2,
          })),
        })),
      },
    });

    const { GET } = await import("../src/app/api/destinations/[destinationId]/route");
    const response = await GET(new Request("https://example.test/api/destinations/dest_paris"), {
      params: Promise.resolve({ destinationId: "dest_paris" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toSatisfy((payload) => {
      expect(payload.destination.city).toBe("Paris");
      expect(payload.details).toHaveLength(4);
      expect(payload.details[0]).toMatchObject({ label: "Best season" });
      expect(payload.stories).toHaveLength(8);
      expect(payload.stories[0]).toMatchObject({ id: "story_0" });
      expect(payload.mapTour.stops).toHaveLength(3);
      expect(payload.mapTour.stops[0]).toMatchObject({ id: "stop_0" });
      return true;
    });
  });

  it("returns 404 for an unknown destination profile", async () => {
    getDestinationProfileView.mockReturnValue(null);

    const { GET } = await import("../src/app/api/destinations/[destinationId]/route");
    const response = await GET(new Request("https://example.test/api/destinations/dest_unknown"), {
      params: Promise.resolve({ destinationId: "dest_unknown" }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Destination dest_unknown was not found.",
    });
  });
});
