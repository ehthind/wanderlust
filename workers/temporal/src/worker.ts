import { NativeConnection, Worker } from "@temporalio/worker";

import { getAppEnv } from "@wanderlust/shared-config";
import { createLogger } from "@wanderlust/shared-logging";

import * as activities from "./activities/fake-booking.js";

const logger = createLogger("temporal-worker");

const run = async () => {
  const env = getAppEnv();
  const connection = await NativeConnection.connect({
    address: env.TEMPORAL_ADDRESS,
  });

  const worker = await Worker.create({
    connection,
    namespace: env.TEMPORAL_NAMESPACE,
    taskQueue: "wanderlust",
    workflowsPath: new URL("./workflows/sample.ts", import.meta.url).pathname,
    activities,
  });

  logger.info("Temporal worker started", {
    taskQueue: "wanderlust",
    address: env.TEMPORAL_ADDRESS,
  });

  await worker.run();
};

run().catch((error) => {
  logger.error("Temporal worker failed", {
    message: error instanceof Error ? error.message : String(error),
  });
  process.exitCode = 1;
});
