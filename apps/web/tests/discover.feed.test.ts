import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDiscoverFeedView } = vi.hoisted(() => ({
  getDiscoverFeedView: vi.fn(),
}));

vi.mock("@wanderlust/domains/destinations", () => ({
  getDiscoverFeedView,
}));

describe("GET /api/discover/feed", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns the discover feed payload", async () => {
    getDiscoverFeedView.mockReturnValue({
      cards: [
        {
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
            gestureHint: "Swipe for next destination",
          },
        },
      ],
    });

    const { GET } = await import("../src/app/api/discover/feed/route");
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      cards: [
        {
          destination: {
            city: "Paris",
            heroImageUrl: "https://example.test/paris.jpg",
          },
        },
      ],
    });
  });
});
