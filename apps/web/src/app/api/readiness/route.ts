import { NextResponse } from "next/server";

import { getAppEnv } from "@wanderlust/shared-config";
import { createLogger } from "@wanderlust/shared-logging";
import { buildObservabilityLabels, getManagedSinkStatus } from "@wanderlust/shared-observability";

const logger = createLogger("web.readiness", {
  includeTrace: true,
});

export function GET() {
  const env = getAppEnv();
  const labels = buildObservabilityLabels();
  const managed = getManagedSinkStatus();
  const readiness = {
    app: "ready",
    temporal: env.TEMPORAL_ADDRESS ? "configured" : "missing",
    supabase: env.SUPABASE_URL ? "configured" : "missing",
    observability: env.OTEL_EXPORTER_OTLP_ENDPOINT ? "configured" : "local-only",
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
