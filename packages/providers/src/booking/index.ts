import type { BookingIntent, DestinationSummary } from "@wanderlust/shared-schemas";

export type BookingProvider = {
  checkInventory(destinationId: string): Promise<DestinationSummary[]>;
  createReservation(destinationId: string): Promise<BookingIntent>;
  cancelReservation(bookingId: string): Promise<BookingIntent>;
};

export const createFakeBookingProvider = (): BookingProvider => ({
  async checkInventory(destinationId) {
    return [
      {
        id: destinationId,
        slug: "paris",
        city: "Paris",
        country: "France",
        thesis: "Go for the late-night glow, layered history, and beauty as part of daily life.",
        bestSeason: "Apr-Jun",
        budget: "$$$",
        visa: "Usually not required",
        idealTripLength: "5-7 days",
      },
    ];
  },
  async createReservation(destinationId) {
    return {
      id: `booking_${destinationId}`,
      destinationId,
      status: "confirmed",
    };
  },
  async cancelReservation(bookingId) {
    return {
      id: bookingId,
      destinationId: "dest_paris",
      status: "cancelled",
    };
  },
});
