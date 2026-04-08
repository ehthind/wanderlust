import { Client, Connection, WorkflowNotFoundError } from "@temporalio/client";

import { type AppEnv, loadAppEnv } from "@wanderlust/shared-config";
import type { PlanTripInput } from "@wanderlust/shared-schemas";

export const planTripWorkflowName = "planTripWorkflow";

export type PlanTripExecutionStatus = "running" | "completed" | "failed" | "unknown";

export type PlanTripExecution = {
  workflowId: string;
  runId: string | null;
  status: PlanTripExecutionStatus;
};

export type PlanTripWorkflowInput = PlanTripInput & {
  tripDraftId: string;
};

export type WorkflowRuntime = {
  startPlanTrip(input: PlanTripWorkflowInput): Promise<PlanTripExecution>;
  describePlanTrip(input: {
    workflowId: string;
    runId?: string;
  }): Promise<PlanTripExecution | null>;
  checkConnection(): Promise<"reachable" | "unreachable">;
};

let cachedClientPromise: Promise<Client> | null = null;

const mapTemporalStatus = (statusName?: string): PlanTripExecutionStatus => {
  switch (statusName) {
    case "RUNNING":
      return "running";
    case "COMPLETED":
      return "completed";
    case "FAILED":
    case "TERMINATED":
    case "TIMED_OUT":
    case "CANCELLED":
      return "failed";
    default:
      return "unknown";
  }
};

const createConnection = async (env: AppEnv) =>
  Connection.connect({
    address: env.TEMPORAL_ADDRESS,
    ...(env.TEMPORAL_API_KEY ? { apiKey: env.TEMPORAL_API_KEY, tls: true } : {}),
  });

const getClient = async () => {
  if (!cachedClientPromise) {
    cachedClientPromise = (async () => {
      const env = await loadAppEnv();
      const connection = await createConnection(env);
      return new Client({
        connection,
        namespace: env.TEMPORAL_NAMESPACE,
      });
    })();
  }

  return cachedClientPromise;
};

export const createTemporalWorkflowRuntime = (): WorkflowRuntime => ({
  async startPlanTrip(input) {
    const env = await loadAppEnv();
    const client = await getClient();
    const workflowId = `plan-trip-${input.tripDraftId}`;
    const handle = await client.workflow.start(planTripWorkflowName, {
      args: [input],
      taskQueue: env.TEMPORAL_TASK_QUEUE,
      workflowId,
    });

    return {
      workflowId: handle.workflowId,
      runId: handle.firstExecutionRunId ?? null,
      status: "running",
    };
  },
  async describePlanTrip({ workflowId, runId }) {
    const client = await getClient();

    try {
      const description = await client.workflow.getHandle(workflowId, runId).describe();
      return {
        workflowId: description.workflowId,
        runId: description.runId,
        status: mapTemporalStatus(description.status.name),
      };
    } catch (error) {
      if (error instanceof WorkflowNotFoundError) {
        return null;
      }

      throw error;
    }
  },
  async checkConnection() {
    try {
      const env = await loadAppEnv();
      const connection = await createConnection(env);
      await connection.ensureConnected();
      return "reachable";
    } catch {
      return "unreachable";
    }
  },
});
