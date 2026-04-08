import { NextResponse } from "next/server";

import { loadAppEnv } from "@wanderlust/shared-config";
import { createLogger } from "@wanderlust/shared-logging";
import { buildObservabilityLabels, getManagedSinkStatus } from "@wanderlust/shared-observability";

const logger = createLogger("web.health", {
  includeTrace: true,
});

export async function GET() {
  const env = await loadAppEnv();
  const labels = buildObservabilityLabels(env);
  const managed = getManagedSinkStatus(env);

  logger.info("Health check requested", {
    labels,
  });

  return NextResponse.json({
    ok: true,
    app: env.APP_NAME,
    service: env.SERVICE_NAME,
    temporalAddress: env.TEMPORAL_ADDRESS,
    temporalNamespace: env.TEMPORAL_NAMESPACE,
    temporalTaskQueue: env.TEMPORAL_TASK_QUEUE,
    temporalUiUrl: env.TEMPORAL_UI_URL,
    secrets: env.WANDERLUST_SECRETS_MODE,
    labels,
    managed,
  });
}
