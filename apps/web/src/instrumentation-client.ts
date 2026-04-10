import * as Sentry from "@sentry/nextjs";

import { buildWebSentryOptions } from "./sentry.shared";

const options = buildWebSentryOptions("browser", process.env);

if (options) {
  Sentry.init(options as unknown as Parameters<typeof Sentry.init>[0]);
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
