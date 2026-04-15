import { proxyActivities, workflowInfo } from "@temporalio/workflow";

import type { PlanTripWorkflowInput } from "@wanderlust/providers/workflow";

import type * as activities from "../activities/plan-trip.js";

const { buildPlanTripSummary, completePlanTrip, failPlanTrip } = proxyActivities<typeof activities>(
  {
    startToCloseTimeout: "1 minute",
    retry: {
      maximumAttempts: 3,
    },
  },
);

const getFailedActivityName = (error: unknown): string => {
  if (!error || typeof error !== "object") {
    return "unknown";
  }

  const record = error as Record<string, unknown>;

  if (typeof record.activityType === "string") {
    return record.activityType;
  }

  if (record.cause && typeof record.cause === "object") {
    const cause = record.cause as Record<string, unknown>;

    if (typeof cause.activityType === "string") {
      return cause.activityType;
    }
  }

  return "unknown";
};

export const planTripWorkflow = async (input: PlanTripWorkflowInput) => {
  try {
    const summary = await buildPlanTripSummary(input);
    const tripDraft = await completePlanTrip({
      tripDraftId: input.tripDraftId,
      summary,
    });

    return {
      tripDraftId: tripDraft.id,
      workflowStatus: tripDraft.workflowStatus,
      planSummary: tripDraft.planSummary,
    };
  } catch (error) {
    const info = workflowInfo();
    const message = error instanceof Error ? error.message : String(error);
    await failPlanTrip({
      tripDraftId: input.tripDraftId,
      failure: {
        workflowId: info.workflowId,
        runId: info.runId,
        workflow: info.workflowType,
        activity: getFailedActivityName(error),
        tripDraftId: input.tripDraftId,
        message,
        ...(error instanceof Error && error.name ? { name: error.name } : {}),
      },
    });
    throw error;
  }
};
