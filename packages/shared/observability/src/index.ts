import crypto from "node:crypto";

export type AppLogLevel = "debug" | "info" | "warn" | "error";

export type TraceContext = {
  traceId: string;
  spanId: string;
  service: string;
  workspace: string;
  issue: string;
  runId: string;
};

export type MetricEvent = {
  name: string;
  value: number;
  unit: "count" | "ms";
  service: string;
  workspace: string;
  issue: string;
};

export type AppLogEvent = {
  level: AppLogLevel;
  message: string;
  scope: string;
  trace?: TraceContext;
  metadata?: Record<string, unknown>;
};

type ContextSource = Record<string, string | undefined>;

export const formatLogEvent = (event: AppLogEvent): string =>
  JSON.stringify({
    ts: new Date().toISOString(),
    ...event,
  });

export const buildTraceContext = (
  scope: string,
  source: ContextSource = process.env,
): TraceContext => ({
  traceId: crypto.randomUUID(),
  spanId: crypto.randomUUID().slice(0, 16),
  service: source.SERVICE_NAME ?? "wanderlust",
  workspace: source.WORKSPACE_NAME ?? "local",
  issue: source.SYMPHONY_ISSUE_IDENTIFIER ?? "local",
  runId: source.SYMPHONY_RUN_ID ?? `${scope}-manual`,
});

export const buildMetricEvent = (
  name: string,
  value: number,
  unit: MetricEvent["unit"],
  source: ContextSource = process.env,
): MetricEvent => ({
  name,
  value,
  unit,
  service: source.SERVICE_NAME ?? "wanderlust",
  workspace: source.WORKSPACE_NAME ?? "local",
  issue: source.SYMPHONY_ISSUE_IDENTIFIER ?? "local",
});

export const getManagedSinkStatus = (source: ContextSource = process.env) => ({
  sentry: {
    enabled: Boolean(source.SENTRY_DSN),
  },
  posthog: {
    enabled: Boolean(source.POSTHOG_KEY && source.POSTHOG_HOST),
    host: source.POSTHOG_HOST ?? "",
  },
});

export const buildObservabilityLabels = (source: ContextSource = process.env) => ({
  service: source.SERVICE_NAME ?? "wanderlust",
  workspace: source.WORKSPACE_NAME ?? "local",
  issue: source.SYMPHONY_ISSUE_IDENTIFIER ?? "local",
  runId: source.SYMPHONY_RUN_ID ?? "manual",
});
