import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDiscoverCardView } = vi.hoisted(() => ({
  getDiscoverCardView: vi.fn(),
}));

vi.mock("@wanderlust/domains/destinations", () => ({
  getDiscoverCardView,
}));

describe("GET /api/discover/featured", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns the featured discover card payload", async () => {
    getDiscoverCardView.mockReturnValue({
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
      chips: [{ label: "Best season", value: "Apr-Oct" }],
      cues: {
        primaryAction: "Plan Trip",
        secondaryAction: "Save",
        gestureHint: "Swipe left",
      },
    });

    const { GET } = await import("../src/app/api/discover/featured/route");
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      destination: {
        city: "Paris",
      },
      cues: {
        primaryAction: "Plan Trip",
      },
    });
  });
});
