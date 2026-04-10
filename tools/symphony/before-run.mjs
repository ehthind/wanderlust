import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { listRequiredChecks } from "../checks/required-checks.mjs";
import { assertDopplerReadySync } from "../doppler/secrets.mjs";
import {
  ensureSymphonyDir,
  getWorkspaceContext,
  updateRunArtifact,
  writeArtifact,
} from "./_shared.mjs";

const required = [
  "AGENTS.md",
  "ARCHITECTURE.md",
  "PLANS.md",
  "WORKFLOW.md",
  "docs/runbooks/delivery-loop.md",
  "docs/runbooks/observability.md",
];

const ctx = getWorkspaceContext();

assertDopplerReadySync(process.env);

for (const file of required) {
  if (!fs.existsSync(path.join(process.cwd(), file))) {
    process.stderr.write(
      `Missing ${file}. Fix the repo map before starting an implementation run.\n`,
    );
    process.exit(1);
  }
}

ensureSymphonyDir(ctx);

updateRunArtifact(ctx, {
  run: {
    stage: "before-run",
    status: "ready",
  },
});

writeArtifact(ctx, "checks.json", {
  generatedAt: new Date().toISOString(),
  required: listRequiredChecks().map(({ command }) => command),
  results: [],
  passed: false,
});

const observabilityPrep = spawnSync("node", ["tools/symphony/prepare-observability.mjs"], {
  cwd: process.cwd(),
  encoding: "utf8",
});

if (observabilityPrep.stdout) {
  process.stdout.write(observabilityPrep.stdout);
}

if (observabilityPrep.status !== 0) {
  process.stderr.write(observabilityPrep.stderr);
  process.exit(observabilityPrep.status ?? 1);
}

process.stdout.write("workspace preflight passed\n");
