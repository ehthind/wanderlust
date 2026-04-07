export type AgentRuntime = {
  invoke(graph: string, input: Record<string, unknown>): Promise<{ status: "ok" }>;
};

export const createNoopAgentRuntime = (): AgentRuntime => ({
  async invoke() {
    return { status: "ok" };
  },
});
