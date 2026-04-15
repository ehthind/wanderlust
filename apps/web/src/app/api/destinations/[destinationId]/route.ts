import { NextResponse } from "next/server";

import { getDestinationProfileView } from "@wanderlust/domains/destinations";
import { destinationProfileViewSchema } from "@wanderlust/shared-schemas";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      destinationId: string;
    }>;
  },
) {
  const { destinationId } = await context.params;
  const profile = getDestinationProfileView(destinationId);

  if (!profile) {
    return NextResponse.json(
      {
        ok: false,
        error: `Destination ${destinationId} was not found.`,
      },
      { status: 404 },
    );
  }

  return NextResponse.json(destinationProfileViewSchema.parse(profile));
}
