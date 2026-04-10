import { listRequiredChecks, runRequiredCheck } from "../checks/required-checks.mjs";
import { getWorkspaceContext, updateRunArtifact, writeArtifact } from "./_shared.mjs";

const ctx = getWorkspaceContext();
const commands = listRequiredChecks();
const results = commands.map(({ name }) =>
  runRequiredCheck({
    repoRoot: ctx.repoRoot,
    checkName: name,
    surface: "workspace",
    appendStepSummary: false,
  }),
);
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
