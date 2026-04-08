import { proxyActivities } from "@temporalio/workflow";

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
    const message = error instanceof Error ? error.message : String(error);
    await failPlanTrip({
      tripDraftId: input.tripDraftId,
      message,
    });
    throw error;
  }
};
