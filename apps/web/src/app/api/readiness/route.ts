import { NextResponse } from "next/server";

import { loadAppEnv } from "@wanderlust/shared-config";
import { createLogger } from "@wanderlust/shared-logging";
import { buildObservabilityLabels, getManagedSinkStatus } from "@wanderlust/shared-observability";

const logger = createLogger("web.readiness", {
  includeTrace: true,
});

export async function GET() {
  const env = await loadAppEnv();
  const labels = buildObservabilityLabels(env);
  const managed = getManagedSinkStatus(env);
  const readiness = {
    app: "ready",
    temporal: env.TEMPORAL_ADDRESS ? "configured" : "missing",
    supabase: env.SUPABASE_URL ? "configured" : "missing",
    observability: env.OTEL_EXPORTER_OTLP_ENDPOINT ? "configured" : "local-only",
    secrets: env.WANDERLUST_SECRETS_MODE === "doppler" ? "runtime" : "env",
  };

  logger.info("Readiness check requested", {
    readiness,
    labels,
  });

  return NextResponse.json({
    ok: Object.values(readiness).every((value) => value !== "missing"),
    readiness,
    labels,
    managed,
  });
}
