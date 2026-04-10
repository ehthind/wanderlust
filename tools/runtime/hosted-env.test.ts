import { describe, expect, it } from "vitest";

import {
  getRailwayBaseEntries,
  getVercelTargetEntries,
  hostedServiceNames,
} from "./hosted-env.mjs";

describe("hosted env contracts", () => {
  it("uses the web service name for all Vercel targets", () => {
    expect(getVercelTargetEntries()).toEqual([
      ["APP_NAME", "Wanderlust", false],
      ["SERVICE_NAME", hostedServiceNames.web, false],
      ["WANDERLUST_SECRETS_MODE", "env", false],
    ]);
  });

  it("uses the temporal worker service name for Railway", () => {
    expect(getRailwayBaseEntries()).toEqual([["SERVICE_NAME", hostedServiceNames.temporalWorker]]);
  });
});
