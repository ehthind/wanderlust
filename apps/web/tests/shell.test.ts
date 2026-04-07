import { describe, expect, it } from "vitest";

import * as destinations from "@wanderlust/domains/destinations";

describe("discover shell", () => {
  it("returns the featured Paris card", () => {
    const card = destinations.getDiscoverCardView();

    expect(card.destination.city).toBe("Paris");
    expect(card.chips).toHaveLength(4);
  });
});
