import { NextResponse } from "next/server";

import { BookingServiceError, createBookingService } from "@wanderlust/domains/bookings";
import { tripStaySearchInputSchema } from "@wanderlust/shared-schemas";

const mapBookingErrorToStatus = (error: BookingServiceError) => {
  switch (error.code) {
    case "trip_not_found":
    case "destination_not_found":
      return 404;
    case "missing_region_mapping":
      return 409;
    case "availability_upstream_failure":
      return 502;
    default:
      return 500;
  }
};

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      tripDraftId: string;
    }>;
  },
) {
  const parsed = tripStaySearchInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid stay search input.",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const { tripDraftId } = await context.params;
  const service = createBookingService();

  try {
    return NextResponse.json(await service.searchTripStays(tripDraftId, parsed.data));
  } catch (error) {
    if (error instanceof BookingServiceError) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
        },
        { status: mapBookingErrorToStatus(error) },
      );
    }

    throw error;
  }
}
