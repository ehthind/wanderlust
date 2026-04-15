import { describe, expect, it } from "vitest";

import { buildSentryContext, formatLogEvent, sanitizeObservabilityValue } from "./index";

describe("shared observability", () => {
  it("redacts secret-like metadata keys", () => {
    expect(
      sanitizeObservabilityValue({
        apiKey: "123",
        nested: {
          authorization: "Bearer token",
          safe: "ok",
        },
      }),
    ).toEqual({
      apiKey: "[REDACTED]",
      nested: {
        authorization: "[REDACTED]",
        safe: "ok",
      },
    });
  });

  it("formats log events with redacted metadata", () => {
    expect(
      JSON.parse(
        formatLogEvent({
          level: "error",
          scope: "unit",
          message: "test",
          metadata: {
            sentryDsn: "https://example",
          },
        }),
      ),
    ).toMatchObject({
      metadata: {
        sentryDsn: "[REDACTED]",
      },
    });
  });

  it("builds sentry tags without placeholder labels", () => {
    const context = buildSentryContext({
      runtime: "browser",
      source: {
        SERVICE_NAME: "wanderlust-web",
        WORKSPACE_NAME: "local",
        SYMPHONY_ISSUE_IDENTIFIER: "local",
        SYMPHONY_RUN_ID: "manual",
      },
      extraTags: {
        route: "/api/trips/plan",
      },
      metadata: {
        accessToken: "secret",
      },
    });

    expect(context.tags).toEqual({
      runtime: "browser",
      service: "wanderlust-web",
      route: "/api/trips/plan",
    });
    expect(context.extras).toMatchObject({
      runtime: "browser",
      labels: {
        service: "wanderlust-web",
      },
      metadata: {
        accessToken: "[REDACTED]",
      },
    });
  });
});
