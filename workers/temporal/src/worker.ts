import { loadAppEnv } from "@wanderlust/shared-config";

import { initWorkerSentry } from "./sentry.js";

const env = await loadAppEnv();

initWorkerSentry(env);

await import("./worker-main.js");
