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

const secretKeyPattern = /(token|secret|key|dsn|authorization|cookie)/i;
const defaultLabelValues = new Set(["local", "manual"]);

export type SentryContext = {
  tags: Record<string, string>;
  extras: Record<string, unknown>;
};

export const sanitizeObservabilityValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sanitizeObservabilityValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [
        key,
        secretKeyPattern.test(key) ? "[REDACTED]" : sanitizeObservabilityValue(nested),
      ]),
    );
  }

  return value;
};

type ContextSource = Record<string, string | number | undefined>;
type ObservabilityRecord = Record<string, unknown>;

export const formatLogEvent = (event: AppLogEvent): string =>
  JSON.stringify({
    ts: new Date().toISOString(),
    ...event,
    ...(event.metadata ? { metadata: sanitizeObservabilityValue(event.metadata) } : {}),
  });

export const buildTraceContext = (
  scope: string,
  source: ContextSource = process.env,
): TraceContext => ({
  traceId: globalThis.crypto.randomUUID(),
  spanId: globalThis.crypto.randomUUID().slice(0, 16),
  service: String(source.SERVICE_NAME ?? "wanderlust"),
  workspace: String(source.WORKSPACE_NAME ?? "local"),
  issue: String(source.SYMPHONY_ISSUE_IDENTIFIER ?? "local"),
  runId: String(source.SYMPHONY_RUN_ID ?? `${scope}-manual`),
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
  service: String(source.SERVICE_NAME ?? "wanderlust"),
  workspace: String(source.WORKSPACE_NAME ?? "local"),
  issue: String(source.SYMPHONY_ISSUE_IDENTIFIER ?? "local"),
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
  service: String(source.SERVICE_NAME ?? "wanderlust"),
  workspace: String(source.WORKSPACE_NAME ?? "local"),
  issue: String(source.SYMPHONY_ISSUE_IDENTIFIER ?? "local"),
  runId: String(source.SYMPHONY_RUN_ID ?? "manual"),
});

type SentryContextOptions = {
  runtime: string;
  scope?: string;
  source?: ContextSource;
  metadata?: Record<string, unknown>;
  extraTags?: Record<string, string | number | boolean | undefined>;
  extraExtras?: Record<string, unknown>;
};

const buildAvailableLabels = (source: ContextSource) => {
  const labels = buildObservabilityLabels(source);

  return Object.fromEntries(
    Object.entries(labels).filter(([key, value]) => {
      if (key === "service") {
        return Boolean(value);
      }

      return value.length > 0 && !defaultLabelValues.has(value);
    }),
  );
};

export const buildSentryContext = ({
  runtime,
  scope,
  source = process.env,
  metadata,
  extraTags,
  extraExtras,
}: SentryContextOptions): SentryContext => {
  const labels = buildAvailableLabels(source);
  const tags = Object.fromEntries(
    Object.entries({
      runtime,
      ...labels,
      ...(scope ? { scope } : {}),
      ...Object.fromEntries(
        Object.entries(extraTags ?? {}).flatMap(([key, value]) =>
          value === undefined ? [] : [[key, String(value)]],
        ),
      ),
    }).filter(([, value]) => value.length > 0),
  );
  const sanitizedExtras = extraExtras
    ? (sanitizeObservabilityValue(extraExtras) as ObservabilityRecord)
    : undefined;

  return {
    tags,
    extras: {
      runtime,
      ...(Object.keys(labels).length > 0 ? { labels } : {}),
      ...(scope ? { scope } : {}),
      ...(metadata ? { metadata: sanitizeObservabilityValue(metadata) } : {}),
      ...(sanitizedExtras ?? {}),
    },
  };
};
