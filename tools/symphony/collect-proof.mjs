import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const summary = {
  generatedAt: new Date().toISOString(),
  checks: ["corepack pnpm check", "corepack pnpm typecheck", "corepack pnpm test"],
  docs: ["AGENTS.md", "ARCHITECTURE.md", "PLANS.md", "WORKFLOW.md"],
};

const outputDir = path.join(repoRoot, ".symphony");
const outputPath = path.join(outputDir, "proof.json");

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));
process.stdout.write(`proof written to ${outputPath}\n`);
