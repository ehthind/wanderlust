import { describe, expect, it } from "vitest";

import { getDiscoverCardView } from "@wanderlust/domains/destinations";

describe("discover shell", () => {
  it("returns the featured Paris card", () => {
    const card = getDiscoverCardView();

    expect(card.destination.city).toBe("Paris");
    expect(card.chips).toHaveLength(4);
  });
});
