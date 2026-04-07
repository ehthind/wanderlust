import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const requiredFiles = [
  "docs/architecture/observability.md",
  "docs/runbooks/observability.md",
  "ops/observability/README.md",
  "ops/observability/compose.yml",
  "ops/observability/otel-collector-config.yml",
];

for (const relativePath of requiredFiles) {
  if (!fs.existsSync(path.join(repoRoot, relativePath))) {
    process.stderr.write(
      `Missing observability scaffold ${relativePath}. Keep the local debug surface explicit.\n`,
    );
    process.exitCode = 1;
  }
}

if (!process.exitCode) {
  process.stdout.write("observability checks passed\n");
}
