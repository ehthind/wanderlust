import { describe, expect, it } from "vitest";

import { buildWebSentryOptions, filterWebSentryEvent } from "../src/sentry.shared";

describe("web sentry config", () => {
  it("is a no-op when the browser DSN is absent", () => {
    expect(buildWebSentryOptions("browser", {})).toBeNull();
  });

  it("filters zod validation errors", () => {
    expect(
      filterWebSentryEvent(
        {
          request: {
            url: "https://wanderlust.test/api/trips/plan",
          },
        },
        {
          originalException: {
            name: "ZodError",
          },
        },
      ),
    ).toBeNull();
  });

  it("filters abort-like failures", () => {
    expect(
      filterWebSentryEvent(
        {
          request: {
            url: "https://wanderlust.test/api/trips/plan",
          },
        },
        {
          originalException: {
            name: "AbortError",
            message: "request aborted",
          },
        },
      ),
    ).toBeNull();
  });

  it("filters health and readiness probe noise", () => {
    expect(
      filterWebSentryEvent(
        {
          request: {
            url: "https://wanderlust.test/api/health",
          },
        },
        {},
      ),
    ).toBeNull();

    expect(
      filterWebSentryEvent(
        {
          transaction: "/api/readiness",
        },
        {},
      ),
    ).toBeNull();
  });
});
