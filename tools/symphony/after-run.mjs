import { spawnSync } from "node:child_process";

const checkResult = spawnSync("node", ["tools/symphony/run-checks.mjs"], {
  cwd: process.cwd(),
  encoding: "utf8",
});

if (checkResult.stdout) {
  process.stdout.write(checkResult.stdout);
}

const proofResult = spawnSync("node", ["tools/symphony/collect-proof.mjs"], {
  cwd: process.cwd(),
  encoding: "utf8",
});

if (proofResult.stdout) {
  process.stdout.write(proofResult.stdout);
}

if (checkResult.status !== 0) {
  process.stderr.write(checkResult.stderr);
  process.exit(checkResult.status ?? 1);
}

if (proofResult.status !== 0) {
  process.stderr.write(proofResult.stderr);
  process.exit(proofResult.status ?? 1);
}
