import { NextResponse } from "next/server";

import { getAppEnv } from "@wanderlust/shared-config";

export function GET() {
  const env = getAppEnv();

  return NextResponse.json({
    ok: true,
    app: env.APP_NAME,
    temporalAddress: env.TEMPORAL_ADDRESS,
  });
}
