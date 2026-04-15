import { NextResponse } from "next/server";

import { getDiscoverFeedView } from "@wanderlust/domains/destinations";

export async function GET() {
  return NextResponse.json(getDiscoverFeedView());
}
