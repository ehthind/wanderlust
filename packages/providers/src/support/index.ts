export type SupportProvider = {
  openThread(subject: string): Promise<{ threadId: string }>;
};

export const createFakeSupportProvider = (): SupportProvider => ({
  async openThread(subject) {
    return { threadId: `thread_${subject.toLowerCase().replace(/\s+/g, "_")}` };
  },
});
