import { spawnSync } from "node:child_process";

const result = spawnSync("node", ["tools/symphony/collect-proof.mjs"], {
  cwd: process.cwd(),
  encoding: "utf8",
});

if (result.stdout) {
  process.stdout.write(result.stdout);
}

if (result.status !== 0) {
  process.stderr.write(result.stderr);
  process.exit(result.status ?? 1);
}
