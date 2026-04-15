import { NextResponse } from "next/server";

import { createBookingService } from "@wanderlust/domains/bookings";
import { createTripWorkspaceService } from "@wanderlust/domains/trips";
import { tripWorkspaceViewSchema } from "@wanderlust/shared-schemas";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      tripDraftId: string;
    }>;
  },
) {
  const { tripDraftId } = await context.params;
  const tripService = createTripWorkspaceService();
  const bookingService = createBookingService();
  const tripDraft = await tripService.loadTripWorkspace(tripDraftId);

  if (!tripDraft) {
    return NextResponse.json(
      {
        ok: false,
        error: `Trip draft ${tripDraftId} was not found.`,
      },
      { status: 404 },
    );
  }

  const execution = await tripService.loadTripExecution(tripDraftId);
  const selectedStay = await bookingService.loadSelectedStay(tripDraftId);

  return NextResponse.json(
    tripWorkspaceViewSchema.parse({
      tripDraft,
      execution,
      staySearch: {
        travelMonth: tripDraft.travelMonth,
        tripNights: tripDraft.tripNights,
        adults: tripDraft.adults,
      },
      selectedStay,
    }),
  );
}
