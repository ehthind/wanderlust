import { spawnSync } from "node:child_process";

import { downloadSecretsSync } from "../doppler/secrets.mjs";
import { getRailwayBaseEntries } from "../runtime/hosted-env.mjs";

const [, , label] = process.argv;

if (!label) {
  process.stderr.write("Usage: node tools/railway/sync-env.mjs <label>\n");
  process.exit(1);
}

const service = process.env.RAILWAY_SERVICE ?? "temporal-worker";
const environment = process.env.RAILWAY_ENVIRONMENT ?? label;
const secrets = downloadSecretsSync(process.env);
const entries = [
  ...getRailwayBaseEntries(),
  ["TEMPORAL_ADDRESS", secrets.TEMPORAL_ADDRESS],
  ["TEMPORAL_NAMESPACE", secrets.TEMPORAL_NAMESPACE],
  ["TEMPORAL_TASK_QUEUE", secrets.TEMPORAL_TASK_QUEUE],
  ["TEMPORAL_API_KEY", secrets.TEMPORAL_API_KEY],
  ["SUPABASE_URL", secrets.SUPABASE_URL],
  ["SUPABASE_SERVICE_ROLE_KEY", secrets.SUPABASE_SERVICE_ROLE_KEY],
  ["OPENAI_API_KEY", secrets.OPENAI_API_KEY],
  ["SENTRY_DSN", secrets.SENTRY_DSN],
  ["POSTHOG_HOST", secrets.POSTHOG_HOST],
  ["POSTHOG_KEY", secrets.POSTHOG_KEY],
].filter(([, value]) => value !== undefined && value !== null && String(value).length > 0);

if (entries.length === 0) {
  process.stdout.write("No Railway variables needed from the current Doppler config.\n");
  process.exit(0);
}

const result = spawnSync(
  "railway",
  [
    "variables",
    "set",
    "--service",
    service,
    "--environment",
    environment,
    ...entries.map(([key, value]) => `${key}=${String(value)}`),
  ],
  {
    stdio: "inherit",
    env: process.env,
  },
);

process.exitCode = result.status ?? 0;
