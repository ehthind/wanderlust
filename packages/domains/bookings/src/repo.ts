import { bookingRail } from "./config";
import type { BookingPreview } from "./types";

export const getBookingPreview = (): BookingPreview & { rail: string } => ({
  id: "booking_preview_paris",
  destinationId: "dest_paris",
  status: "priced",
  rail: bookingRail,
});
