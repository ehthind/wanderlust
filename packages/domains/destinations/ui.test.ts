import { describe, expect, it } from "vitest";

import { getDestinationProfileView, getDiscoverCardView, getDiscoverFeedView } from "./src/ui";

describe("discover feed view", () => {
  it("returns three discover cards in editorial order", () => {
    const feed = getDiscoverFeedView();

    expect(feed.cards).toHaveLength(3);
    expect(feed.cards.map((card) => card.destination.city)).toEqual([
      "Paris",
      "Kyoto",
      "Mexico City",
    ]);
  });

  it("includes hero imagery on every card", () => {
    const feed = getDiscoverFeedView();

    expect(
      feed.cards.every(
        (card) =>
          card.destination.heroImageUrl.startsWith("https://") &&
          card.destination.heroImageAccessibilityLabel.length > 0,
      ),
    ).toBe(true);
  });

  it("keeps the featured card compatibility wrapper pinned to Paris", () => {
    const card = getDiscoverCardView();

    expect(card.destination.id).toBe("dest_paris");
  });

  it("returns a full profile for every discover destination", () => {
    for (const destinationId of ["dest_paris", "dest_kyoto", "dest_mexico_city"]) {
      const profile = getDestinationProfileView(destinationId);

      expect(profile?.details).toHaveLength(4);
      expect(profile?.stories).toHaveLength(8);
      expect(profile?.destination.id).toBe(destinationId);
    }
  });

  it("returns null for an unknown destination profile", () => {
    expect(getDestinationProfileView("dest_unknown")).toBeNull();
  });
});
