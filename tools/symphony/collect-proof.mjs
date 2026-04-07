import {
  artifactPath,
  currentGitState,
  getWorkspaceContext,
  readArtifact,
  updateRunArtifact,
  writeArtifact,
} from "./_shared.mjs";

const ctx = getWorkspaceContext();
const checks = readArtifact(ctx, "checks.json");
const observability = readArtifact(ctx, "observability.json");
const run = updateRunArtifact(ctx, {
  run: {
    stage: "after-run",
    status: checks?.passed ? "validated" : "blocked",
    completedAt: new Date().toISOString(),
  },
});

const git = currentGitState(ctx);
const summary = {
  generatedAt: new Date().toISOString(),
  issue: run.issue,
  workspace: run.workspace,
  delivery: run.delivery,
  run: run.run,
  git,
  artifacts: {
    run: artifactPath(ctx, "run.json"),
    checks: artifactPath(ctx, "checks.json"),
    observability: artifactPath(ctx, "observability.json"),
  },
  summary: {
    localValidationGate: checks?.passed ? "passed" : "failed",
    requiredDocs: [
      "AGENTS.md",
      "ARCHITECTURE.md",
      "PLANS.md",
      "WORKFLOW.md",
      "docs/runbooks/delivery-loop.md",
      "docs/runbooks/observability.md",
    ],
    requiredChecks: checks?.required ?? [],
    observabilityMode: observability?.local?.mode ?? "metadata-only",
  },
};

writeArtifact(ctx, "proof.json", summary);
process.stdout.write(`proof written to ${artifactPath(ctx, "proof.json")}\n`);
