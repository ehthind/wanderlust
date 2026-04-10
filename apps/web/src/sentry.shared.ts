export type WebSentryRuntime = "browser" | "node" | "edge";

type WebSentrySource = Record<string, string | undefined>;

export const webServiceName = "wanderlust-web";
const defaultLabelValues = new Set(["local", "manual"]);

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getErrorName = (value: unknown) =>
  isObject(value) && typeof value.name === "string" ? value.name : undefined;

const getErrorMessage = (value: unknown) =>
  isObject(value) && typeof value.message === "string" ? value.message : undefined;

const getErrorCode = (value: unknown) =>
  isObject(value) && typeof value.code === "string" ? value.code : undefined;

const getErrorStatus = (value: unknown) => {
  if (!isObject(value)) {
    return undefined;
  }

  const status = value.status ?? value.statusCode;
  return typeof status === "number" ? status : undefined;
};

const getWebSentryEnvironment = (runtime: WebSentryRuntime, source: WebSentrySource) => {
  if (runtime === "browser") {
    return source.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? source.NODE_ENV ?? "development";
  }

  return source.VERCEL_ENV ?? source.NODE_ENV ?? "development";
};

const getWebSentryRelease = (runtime: WebSentryRuntime, source: WebSentrySource) => {
  const release =
    runtime === "browser"
      ? source.NEXT_PUBLIC_SENTRY_RELEASE
      : (source.VERCEL_GIT_COMMIT_SHA ?? source.GITHUB_SHA ?? source.SOURCE_VERSION);

  return release && release.length > 0 ? release : undefined;
};

const getContextSource = (runtime: WebSentryRuntime, source: WebSentrySource) =>
  runtime === "browser"
    ? {
        SERVICE_NAME: webServiceName,
        WORKSPACE_NAME: source.NEXT_PUBLIC_WORKSPACE_NAME,
        SYMPHONY_ISSUE_IDENTIFIER: source.NEXT_PUBLIC_SYMPHONY_ISSUE_IDENTIFIER,
        SYMPHONY_RUN_ID: source.NEXT_PUBLIC_SYMPHONY_RUN_ID,
      }
    : {
        ...source,
        SERVICE_NAME: source.SERVICE_NAME ?? webServiceName,
      };

const buildWebSentryContext = (runtime: WebSentryRuntime, source: WebSentrySource) => {
  const contextSource = getContextSource(runtime, source);
  const labels = {
    service: String(contextSource.SERVICE_NAME ?? webServiceName),
    workspace: contextSource.WORKSPACE_NAME,
    issue: contextSource.SYMPHONY_ISSUE_IDENTIFIER,
    runId: contextSource.SYMPHONY_RUN_ID,
  };
  const normalizedLabels = Object.fromEntries(
    Object.entries(labels).filter(([key, value]) => {
      if (key === "service") {
        return Boolean(value);
      }

      return Boolean(value) && !defaultLabelValues.has(String(value));
    }),
  );

  return {
    tags: {
      runtime,
      ...Object.fromEntries(
        Object.entries(normalizedLabels).map(([key, value]) => [key, String(value)]),
      ),
    },
    extras: {
      runtime,
      ...(Object.keys(normalizedLabels).length > 0 ? { labels: normalizedLabels } : {}),
    },
  };
};

export const isIgnoredWebPath = (value: string | undefined) =>
  value === "/api/health" || value === "/api/readiness";

const isZodError = (value: unknown) => getErrorName(value) === "ZodError";

const isAbortError = (value: unknown) => {
  const name = getErrorName(value);
  const message = getErrorMessage(value);
  const code = getErrorCode(value);

  return (
    name === "AbortError" ||
    code === "ABORT_ERR" ||
    code === "ERR_ABORTED" ||
    (message ? /aborted|abort/i.test(message) : false)
  );
};

const isExpectedClientError = (value: unknown) => {
  const status = getErrorStatus(value);
  return status !== undefined && status >= 400 && status < 500;
};

export const filterWebSentryEvent = (
  event: Record<string, unknown>,
  hint?: { originalException?: unknown },
) => {
  const originalException = hint?.originalException;
  const requestUrl =
    typeof event.request === "object" &&
    event.request !== null &&
    "url" in event.request &&
    typeof event.request.url === "string"
      ? event.request.url
      : undefined;
  const transaction = typeof event.transaction === "string" ? event.transaction : undefined;
  const requestPath = (() => {
    if (!requestUrl) {
      return undefined;
    }

    try {
      return new URL(requestUrl, "http://localhost").pathname;
    } catch {
      return requestUrl;
    }
  })();

  if (
    isZodError(originalException) ||
    isAbortError(originalException) ||
    isExpectedClientError(originalException) ||
    isIgnoredWebPath(requestPath) ||
    isIgnoredWebPath(transaction)
  ) {
    return null;
  }

  return event;
};

export const buildWebSentryOptions = (runtime: WebSentryRuntime, source: WebSentrySource) => {
  const dsn = runtime === "browser" ? source.NEXT_PUBLIC_SENTRY_DSN : source.SENTRY_DSN;
  const release = getWebSentryRelease(runtime, source);

  if (!dsn) {
    return null;
  }

  const context = buildWebSentryContext(runtime, source);

  return {
    dsn,
    enabled: true,
    environment: getWebSentryEnvironment(runtime, source),
    ...(release ? { release } : {}),
    sendDefaultPii: false,
    tracesSampleRate: runtime === "browser" ? 0.05 : 0.1,
    beforeSend: filterWebSentryEvent,
    initialScope: {
      tags: context.tags,
      extras: context.extras,
    },
  };
};
