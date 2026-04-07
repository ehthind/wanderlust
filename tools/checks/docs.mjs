import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "../..");

const requiredFiles = [
  "AGENTS.md",
  "ARCHITECTURE.md",
  "DESIGN.md",
  "PRODUCT_SENSE.md",
  "QUALITY_SCORE.md",
  "RELIABILITY.md",
  "SECURITY.md",
  "PLANS.md",
  "WORKFLOW.md",
  "docs/architecture/index.md",
  "docs/product/index.md",
  "docs/runbooks/worktree-dev.md",
  "docs/runbooks/symphony.md",
];

const plansIndex = fs.readFileSync(path.join(repoRoot, "PLANS.md"), "utf8");
const architectureIndex = fs.readFileSync(
  path.join(repoRoot, "docs/architecture/index.md"),
  "utf8",
);

for (const relativePath of requiredFiles) {
  if (!fs.existsSync(path.join(repoRoot, relativePath))) {
    process.stderr.write(
      `Missing required doc ${relativePath}. Keep the repo map explicit for future agent runs.\n`,
    );
    process.exitCode = 1;
  }
}

if (!plansIndex.includes("plans/active/0001-repo-scaffold.md")) {
  process.stderr.write(
    "PLANS.md must index the active scaffold plan so Symphony and Codex can find it.\n",
  );
  process.exitCode = 1;
}

if (!architectureIndex.includes("Harness patterns")) {
  process.stderr.write("docs/architecture/index.md must link to the harness patterns doc.\n");
  process.exitCode = 1;
}

if (!process.exitCode) {
  process.stdout.write("docs checks passed\n");
}
