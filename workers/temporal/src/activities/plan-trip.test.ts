import { beforeEach, describe, expect, it, vi } from "vitest";

const updateTripWorkspace = vi.fn();
const captureTerminalWorkflowFailure = vi.fn();
const loadTripWorkspaceById = vi.fn();

vi.mock("@wanderlust/domains/trips", () => ({
  loadTripWorkspaceById,
  updateTripWorkspace,
}));

vi.mock("../sentry.js", () => ({
  captureTerminalWorkflowFailure,
}));

describe("plan trip activities", () => {
  beforeEach(() => {
    vi.resetModules();
    updateTripWorkspace.mockReset();
    captureTerminalWorkflowFailure.mockReset();
    loadTripWorkspaceById.mockReset();
  });

  it("captures and persists the terminal workflow failure once", async () => {
    updateTripWorkspace.mockResolvedValue({
      id: "trip_test",
      workflowStatus: "failed",
      planSummary: "workflow blew up",
    });

    const { failPlanTrip } = await import("./plan-trip");

    const tripDraft = await failPlanTrip({
      tripDraftId: "trip_test",
      failure: {
        workflowId: "workflow_test",
        runId: "run_test",
        workflow: "planTripWorkflow",
        activity: "failPlanTrip",
        tripDraftId: "trip_test",
        message: "workflow blew up",
        name: "WorkflowExecutionFailedError",
      },
    });

    expect(captureTerminalWorkflowFailure).toHaveBeenCalledTimes(1);
    expect(captureTerminalWorkflowFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        workflowId: "workflow_test",
        runId: "run_test",
      }),
    );
    expect(updateTripWorkspace).toHaveBeenCalledWith("trip_test", {
      status: "failed",
      workflowStatus: "failed",
      planSummary: "workflow blew up",
    });
    expect(tripDraft).toMatchObject({
      id: "trip_test",
      workflowStatus: "failed",
      planSummary: "workflow blew up",
    });
  });
});
