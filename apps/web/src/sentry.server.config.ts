import * as Sentry from "@sentry/nextjs";

import { buildWebSentryOptions } from "./sentry.shared";

const options = buildWebSentryOptions("node", process.env);

if (options) {
  Sentry.init(options as unknown as Parameters<typeof Sentry.init>[0]);
}
