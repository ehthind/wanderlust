import { describe, expect, it } from "vitest";

import { deriveTemporalLocalSettings } from "./temporal-local.mjs";

describe("deriveTemporalLocalSettings", () => {
  it("derives deterministic local Temporal settings for a workspace", () => {
    const settings = deriveTemporalLocalSettings({
      cwd: "/tmp/wanderlust-got-99",
      existingEnv: {
        DOPPLER_PROJECT: "wanderlust",
        DOPPLER_CONFIG: "local_main",
      },
    });

    expect(settings.namespace).toBe("wanderlust-got-99");
    expect(settings.taskQueue).toBe("wanderlust-wanderlust-got-99");
    expect(settings.address).toMatch(/^127\.0\.0\.1:\d+$/);
    expect(settings.uiUrl).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
    expect(settings.dopplerConfig).toBe("local_main");
  });
});
