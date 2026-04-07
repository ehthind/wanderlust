export type PaymentProvider = {
  refund(bookingId: string): Promise<{ bookingId: string; status: "refunded" }>;
};

export const createFakePaymentProvider = (): PaymentProvider => ({
  async refund(bookingId) {
    return { bookingId, status: "refunded" };
  },
});
