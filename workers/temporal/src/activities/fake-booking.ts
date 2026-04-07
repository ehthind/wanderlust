import { createFakeBookingProvider } from "@wanderlust/providers/booking";
import { createLogger } from "@wanderlust/shared-logging";
import { buildMetricEvent } from "@wanderlust/shared-observability";

const bookingProvider = createFakeBookingProvider();
const logger = createLogger("temporal.activity.fake-booking", {
  includeTrace: true,
});

export const previewDestinationBooking = async (destinationId: string) => {
  logger.info("Previewing destination booking", {
    destinationId,
    metric: buildMetricEvent("temporal.activity.preview_booking", 1, "count"),
  });

  return bookingProvider.createReservation(destinationId);
};
