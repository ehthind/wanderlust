import { getWorkspaceContext, runCommand, updateRunArtifact, writeArtifact } from "./_shared.mjs";

const ctx = getWorkspaceContext();
const commands = [
  { name: "lint", command: "corepack pnpm lint" },
  { name: "typecheck", command: "corepack pnpm typecheck" },
  { name: "check", command: "corepack pnpm check" },
  { name: "test", command: "corepack pnpm test" },
  { name: "playwright-smoke", command: "corepack pnpm playwright:smoke" },
];

const results = commands.map(({ name, command }) => runCommand(ctx, name, command));
const passed = results.every((result) => result.status === "passed");

writeArtifact(ctx, "checks.json", {
  generatedAt: new Date().toISOString(),
  required: commands.map(({ command }) => command),
  results,
  passed,
});

updateRunArtifact(ctx, {
  run: {
    stage: "validation",
    status: passed ? "validated" : "blocked",
  },
});

for (const result of results) {
  process.stdout.write(`${result.name}: ${result.status}\n`);
}

if (!passed) {
  process.stderr.write("one or more delivery checks failed\n");
  process.exit(1);
}
