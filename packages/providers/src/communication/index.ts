export type CommunicationProvider = {
  sendEmail(input: { to: string; subject: string; body: string }): Promise<{ queued: true }>;
};

export const createFakeCommunicationProvider = (): CommunicationProvider => ({
  async sendEmail() {
    return { queued: true };
  },
});
