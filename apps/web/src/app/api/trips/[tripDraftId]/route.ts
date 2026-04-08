import { NextResponse } from "next/server";

import { createTripWorkspaceService } from "@wanderlust/domains/trips";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      tripDraftId: string;
    }>;
  },
) {
  const { tripDraftId } = await context.params;
  const service = createTripWorkspaceService();
  const tripDraft = await service.loadTripWorkspace(tripDraftId);

  if (!tripDraft) {
    return NextResponse.json(
      {
        ok: false,
        error: `Trip draft ${tripDraftId} was not found.`,
      },
      { status: 404 },
    );
  }

  const execution = await service.loadTripExecution(tripDraftId);

  return NextResponse.json({
    ok: true,
    tripDraft,
    execution,
  });
}
