import { NextResponse } from "next/server";

import { getDiscoverCardView } from "@wanderlust/domains/destinations";

export async function GET() {
  return NextResponse.json(getDiscoverCardView());
}
