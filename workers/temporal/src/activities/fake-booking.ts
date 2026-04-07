import { createFakeBookingProvider } from "@wanderlust/providers/booking";

const bookingProvider = createFakeBookingProvider();

export const previewDestinationBooking = async (destinationId: string) =>
  bookingProvider.createReservation(destinationId);
