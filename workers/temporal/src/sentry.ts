import * as Sentry from "@sentry/node";

import type { AppEnv } from "@wanderlust/shared-config";
import { buildSentryContext } from "@wanderlust/shared-observability";

type WorkerSentrySource = Record<string, string | number | undefined>;

export type WorkflowFailureCapture = {
  workflowId: string;
  runId: string | null;
  workflow: string;
  activity: string;
  tripDraftId: string;
  message: string;
  name?: string;
  metadata?: Record<string, unknown>;
};

let isWorkerSentryInitialized = false;
let workerSentrySource: WorkerSentrySource = process.env;

const workerServiceName = "wanderlust-temporal-worker";

const getWorkerSentryEnvironment = (source: WorkerSentrySource) => {
  const railwayEnvironment = source.RAILWAY_ENVIRONMENT;

  if (railwayEnvironment === "dev") {
    return "preview";
  }

  return String(railwayEnvironment ?? source.NODE_ENV ?? "development");
};

const getWorkerSentryRelease = (source: WorkerSentrySource) => {
  const release = source.RAILWAY_GIT_COMMIT_SHA ?? source.SOURCE_VERSION ?? source.GITHUB_SHA;
  return release ? String(release) : undefined;
};

export const buildWorkerSentryOptions = (source: WorkerSentrySource = process.env) => {
  const dsn = source.SENTRY_DSN;

  if (!dsn) {
    return null;
  }

  const context = buildSentryContext({
    runtime: "worker",
    source: {
      ...source,
      SERVICE_NAME: String(source.SERVICE_NAME ?? workerServiceName),
    },
  });

  return {
    dsn: String(dsn),
    enabled: true,
    environment: getWorkerSentryEnvironment(source),
    ...(getWorkerSentryRelease(source) ? { release: getWorkerSentryRelease(source) } : {}),
    sendDefaultPii: false,
    tracesSampleRate: 0.1,
    initialScope: {
      tags: context.tags,
      extras: context.extras,
    },
  };
};

export const initWorkerSentry = (env: AppEnv | WorkerSentrySource = process.env) => {
  const options = buildWorkerSentryOptions(env);

  if (!options || isWorkerSentryInitialized) {
    return false;
  }

  workerSentrySource = env;
  Sentry.init(options);
  isWorkerSentryInitialized = true;
  return true;
};

export const captureTerminalWorkflowFailure = (failure: WorkflowFailureCapture) => {
  if (!Sentry.isEnabled()) {
    return null;
  }

  const context = buildSentryContext({
    runtime: "worker",
    source: {
      ...workerSentrySource,
      SERVICE_NAME: String(workerSentrySource.SERVICE_NAME ?? workerServiceName),
    },
    scope: "temporal.workflow.failure",
    extraTags: {
      workflow: failure.workflow,
      activity: failure.activity,
    },
    metadata: {
      workflowId: failure.workflowId,
      runId: failure.runId ?? "",
      tripDraftId: failure.tripDraftId,
      ...(failure.metadata ? { details: failure.metadata } : {}),
    },
  });

  const error = new Error(failure.message);
  if (failure.name) {
    error.name = failure.name;
  }

  return Sentry.withScope((scope) => {
    scope.setLevel("error");
    scope.setTags(context.tags);
    scope.setExtras(context.extras);
    scope.setFingerprint(["temporal", failure.workflow, failure.activity, failure.name ?? "Error"]);

    return Sentry.captureException(error);
  });
};

export const resetWorkerSentryForTest = async () => {
  isWorkerSentryInitialized = false;
  workerSentrySource = process.env;
  await Sentry.close(0);
};
