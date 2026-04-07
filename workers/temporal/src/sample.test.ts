import { describe, expect, it } from "vitest";

import { previewDestinationBooking } from "./activities/fake-booking";

describe("previewDestinationBooking", () => {
  it("returns a confirmed booking from the fake provider", async () => {
    await expect(previewDestinationBooking("dest_paris")).resolves.toMatchObject({
      destinationId: "dest_paris",
      status: "confirmed",
    });
  });
});
