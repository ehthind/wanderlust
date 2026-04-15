import { NextResponse } from "next/server";

import { BookingServiceError, createBookingService } from "@wanderlust/domains/bookings";
import { lodgingOfferSummarySchema } from "@wanderlust/shared-schemas";

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      tripDraftId: string;
    }>;
  },
) {
  const parsed = lodgingOfferSummarySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid stay selection payload.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const { tripDraftId } = await context.params;
  const service = createBookingService();

  try {
    return NextResponse.json(await service.selectTripStay(tripDraftId, parsed.data));
  } catch (error) {
    if (error instanceof BookingServiceError) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
        },
        { status: error.code === "trip_not_found" ? 404 : 500 },
      );
    }

    throw error;
  }
}
