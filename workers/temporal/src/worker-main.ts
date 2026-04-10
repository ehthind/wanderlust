import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { NativeConnection, Worker } from "@temporalio/worker";

import { loadAppEnv } from "@wanderlust/shared-config";
import { createLogger } from "@wanderlust/shared-logging";
import { buildMetricEvent, buildObservabilityLabels } from "@wanderlust/shared-observability";

import * as activities from "./activities/plan-trip.js";

const logger = createLogger("temporal-worker", {
  includeTrace: true,
});

const resolveWorkflowPath = () => {
  const currentDirectory = dirname(fileURLToPath(import.meta.url));
  const compiledWorkflowPath = join(currentDirectory, "workflows", "plan-trip.js");

  if (existsSync(compiledWorkflowPath)) {
    return compiledWorkflowPath;
  }

  return join(currentDirectory, "workflows", "plan-trip.ts");
};

const run = async () => {
  const env = await loadAppEnv();
  const connection = await NativeConnection.connect({
    address: env.TEMPORAL_ADDRESS,
    ...(env.TEMPORAL_API_KEY ? { apiKey: env.TEMPORAL_API_KEY, tls: true } : {}),
  });

  const worker = await Worker.create({
    connection,
    namespace: env.TEMPORAL_NAMESPACE,
    taskQueue: env.TEMPORAL_TASK_QUEUE,
    workflowsPath: resolveWorkflowPath(),
    activities,
  });

  logger.info("Temporal worker started", {
    taskQueue: env.TEMPORAL_TASK_QUEUE,
    address: env.TEMPORAL_ADDRESS,
    namespace: env.TEMPORAL_NAMESPACE,
    labels: buildObservabilityLabels(env),
    metric: buildMetricEvent("temporal.worker.started", 1, "count", env),
  });

  await worker.run();
};

run().catch((error) => {
  logger.error("Temporal worker failed", {
    message: error instanceof Error ? error.message : String(error),
  });
  process.exitCode = 1;
});
