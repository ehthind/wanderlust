import {
  type WorkflowRuntime,
  createTemporalWorkflowRuntime,
} from "@wanderlust/providers/workflow";

import { createDraftTripWorkspace, loadTripWorkspaceById, updateTripWorkspace } from "./repo";
import type { CreateTripDraftInput } from "./types";

const toPersistedWorkflowStatus = (
  status: "running" | "completed" | "failed" | "unknown",
): "running" | "completed" | "failed" => (status === "unknown" ? "failed" : status);

export const createTripWorkspaceService = (
  workflowRuntime: WorkflowRuntime = createTemporalWorkflowRuntime(),
) => ({
  async startPlanTrip(input: CreateTripDraftInput) {
    const tripDraft = await createDraftTripWorkspace(input);
    const execution = await workflowRuntime.startPlanTrip({
      tripDraftId: tripDraft.id,
      destinationId: tripDraft.destinationId,
      travelerCount: tripDraft.travelerCount,
      vibe: tripDraft.vibe,
      budgetStyle: tripDraft.budgetStyle,
    });

    const updatedTrip = await updateTripWorkspace(tripDraft.id, {
      status: "planning",
      workflowId: execution.workflowId,
      workflowRunId: execution.runId,
      workflowStatus: toPersistedWorkflowStatus(execution.status),
    });

    return {
      tripDraft: updatedTrip,
      execution,
    };
  },
  async loadTripWorkspace(id: string) {
    return loadTripWorkspaceById(id);
  },
  async loadTripExecution(id: string) {
    const tripDraft = await loadTripWorkspaceById(id);
    if (!tripDraft?.workflowId) {
      return null;
    }

    return workflowRuntime.describePlanTrip({
      workflowId: tripDraft.workflowId,
      ...(tripDraft.workflowRunId ? { runId: tripDraft.workflowRunId } : {}),
    });
  },
});
