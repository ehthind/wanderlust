import { proxyActivities } from "@temporalio/workflow";

const activities = proxyActivities<{
  previewDestinationBooking(destinationId: string): Promise<{
    id: string;
    destinationId: string;
    status: string;
  }>;
}>({
  startToCloseTimeout: "1 minute",
});

export const sampleBookingWorkflow = async (destinationId: string) =>
  activities.previewDestinationBooking(destinationId);
