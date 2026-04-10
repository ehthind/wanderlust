import { afterEach, describe, expect, it } from "vitest";

import { buildWorkerSentryOptions, initWorkerSentry, resetWorkerSentryForTest } from "./sentry";

afterEach(async () => {
  await resetWorkerSentryForTest();
});

describe("worker sentry config", () => {
  it("is a no-op when the DSN is absent", () => {
    expect(initWorkerSentry({ SERVICE_NAME: "wanderlust-temporal-worker" })).toBe(false);
    expect(buildWorkerSentryOptions({ SERVICE_NAME: "wanderlust-temporal-worker" })).toBeNull();
  });

  it("maps railway dev to the preview sentry environment", () => {
    expect(
      buildWorkerSentryOptions({
        SERVICE_NAME: "wanderlust-temporal-worker",
        SENTRY_DSN: "https://example.ingest.sentry.io/1",
        RAILWAY_ENVIRONMENT: "dev",
      }),
    ).toMatchObject({
      environment: "preview",
      tracesSampleRate: 0.1,
    });
  });
});
