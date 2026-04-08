import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { downloadSecretsSync } from "../doppler/secrets.mjs";

const [, , dopplerConfig = "dev"] = process.argv;
const repoRoot = fileURLToPath(new URL("../../", import.meta.url));
const sharedScope = fileURLToPath(new URL("../../../", import.meta.url));

const source = {
  ...process.env,
  DOPPLER_PROJECT: process.env.DOPPLER_PROJECT ?? "wanderlust",
  DOPPLER_CONFIG: dopplerConfig,
  DOPPLER_SCOPE: process.env.DOPPLER_SCOPE ?? sharedScope,
};

const secrets = downloadSecretsSync(source);
const password = secrets.SUPABASE_DB_PASSWORD;

if (typeof password !== "string" || password.length === 0) {
  process.stderr.write(
    `Missing SUPABASE_DB_PASSWORD in Doppler ${source.DOPPLER_PROJECT}/${dopplerConfig}.\n`,
  );
  process.exit(1);
}

const result = spawnSync(
  "./node_modules/supabase/bin/supabase",
  ["db", "push", "--linked", "--include-seed", "--password", password, "--yes"],
  {
    cwd: repoRoot,
    stdio: "inherit",
    env: process.env,
  },
);

process.exit(result.status ?? 0);
