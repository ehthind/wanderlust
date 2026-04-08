import { describe, expect, it } from "vitest";

import { buildPlanTripSummary } from "./activities/plan-trip";

describe("buildPlanTripSummary", () => {
  it("returns a summary for the trip draft", async () => {
    await expect(
      buildPlanTripSummary({
        tripDraftId: "trip_test",
        destinationId: "dest_paris",
        travelerCount: 2,
        vibe: "romantic",
        budgetStyle: "balanced",
      }),
    ).resolves.toContain("dest_paris");
  });
});
