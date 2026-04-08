import { NextResponse } from "next/server";

import { createTripWorkspaceService } from "@wanderlust/domains/trips";
import { planTripInputSchema } from "@wanderlust/shared-schemas";

export async function POST(request: Request) {
  const payload = planTripInputSchema.parse(await request.json());
  const service = createTripWorkspaceService();
  const result = await service.startPlanTrip(payload);

  return NextResponse.json(result, {
    status: 201,
  });
}
