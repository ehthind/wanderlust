import { loadTripWorkspaceById, updateTripWorkspace } from "@wanderlust/domains/trips";
import type { PlanTripWorkflowInput } from "@wanderlust/providers/workflow";
import { createLogger } from "@wanderlust/shared-logging";
import { buildMetricEvent, buildObservabilityLabels } from "@wanderlust/shared-observability";

const logger = createLogger("temporal.activities.plan-trip", {
  includeTrace: true,
});

export const buildPlanTripSummary = async (input: PlanTripWorkflowInput) => {
  const draft = await loadTripWorkspaceById(input.tripDraftId).catch(() => null);
  const destinationId = draft?.destinationId ?? input.destinationId;
  const travelerCount = draft?.travelerCount ?? input.travelerCount;
  const vibe = draft?.vibe ?? input.vibe;
  const budgetStyle = draft?.budgetStyle ?? input.budgetStyle;

  const summary = `${travelerCount} travelers planning a ${budgetStyle} ${vibe} trip to ${destinationId}.`;

  logger.info("Built plan trip summary", {
    tripDraftId: input.tripDraftId,
    destinationId,
    labels: buildObservabilityLabels(),
    metric: buildMetricEvent("temporal.activity.plan_trip_summary", 1, "count"),
  });

  return summary;
};

export const completePlanTrip = async ({
  tripDraftId,
  summary,
}: {
  tripDraftId: string;
  summary: string;
}) => {
  const tripDraft = await updateTripWorkspace(tripDraftId, {
    status: "ready",
    workflowStatus: "completed",
    planSummary: summary,
  });

  logger.info("Completed plan trip activity", {
    tripDraftId,
    labels: buildObservabilityLabels(),
    metric: buildMetricEvent("temporal.activity.plan_trip_completed", 1, "count"),
  });

  return tripDraft;
};

export const failPlanTrip = async ({
  tripDraftId,
  message,
}: {
  tripDraftId: string;
  message: string;
}) => {
  const tripDraft = await updateTripWorkspace(tripDraftId, {
    status: "failed",
    workflowStatus: "failed",
    planSummary: message,
  });

  logger.error("Plan trip activity failed", {
    tripDraftId,
    message,
    labels: buildObservabilityLabels(),
    metric: buildMetricEvent("temporal.activity.plan_trip_failed", 1, "count"),
  });

  return tripDraft;
};
