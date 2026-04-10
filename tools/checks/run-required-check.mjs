import path from "node:path";

import { runRequiredCheck } from "./required-checks.mjs";

const args = process.argv.slice(2);
const checkName = args[0];

if (!checkName) {
  process.stderr.write("Usage: node tools/checks/run-required-check.mjs <check-name> [surface]\n");
  process.exit(1);
}

const surface = args[1] ?? "ci";

try {
  const result = runRequiredCheck({
    repoRoot: path.resolve(process.cwd()),
    checkName,
    surface,
  });

  if (result.status !== "passed") {
    process.exit(result.exitCode);
  }
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}
