export type WorkflowRuntime = {
  start(name: string, payload: Record<string, unknown>): Promise<{ workflowId: string }>;
};

export const createNoopWorkflowRuntime = (): WorkflowRuntime => ({
  async start(name) {
    return { workflowId: `wf_${name}` };
  },
});
