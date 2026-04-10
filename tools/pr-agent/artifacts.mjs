import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const runGit = (repoRoot, args) => {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
  });
  return result.status === 0 ? result.stdout.trim() : "";
};

const writeJson = (filePath, value) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
};

export const writePrAgentArtifacts = ({
  repoRoot,
  workflow,
  pr,
  runState,
  checkResults = [],
  diagnosis = [],
  actionsTaken = [],
  blocker = null,
}) => {
  const symphonyDir = path.join(repoRoot, ".symphony");
  const git = {
    branchName: runGit(repoRoot, ["branch", "--show-current"]),
    commitSha: runGit(repoRoot, ["rev-parse", "HEAD"]),
    dirtyPaths: runGit(repoRoot, ["status", "--short"])
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
  };
  const passed =
    checkResults.length > 0 && checkResults.every((result) => result.status === "passed");

  const runArtifact = {
    pr: {
      number: pr.number,
      title: pr.title,
      url: pr.html_url,
      headRef: pr.head.ref,
      headSha: pr.head.sha,
      baseRef: pr.base.ref,
    },
    workflow: {
      repository: workflow.repository,
      allowedChecks: workflow.checks.allowed,
    },
    run: {
      id: runState.runId,
      status: runState.status,
      attemptCount: runState.attemptCount,
      fingerprint: runState.fingerprint,
      updatedAt: new Date().toISOString(),
    },
    blocker,
  };

  const checksArtifact = {
    generatedAt: new Date().toISOString(),
    required: workflow.checks.allowed,
    results: checkResults,
    passed,
  };

  const observabilityArtifact = {
    generatedAt: new Date().toISOString(),
    local: {
      mode: "metadata-only",
      status: "recorded",
    },
    diagnosis,
    actionsTaken,
  };

  const proofArtifact = {
    generatedAt: new Date().toISOString(),
    pr: runArtifact.pr,
    run: runArtifact.run,
    git,
    summary: {
      localValidationGate: passed ? "passed" : "failed",
      blocker,
    },
    artifacts: {
      run: path.join(symphonyDir, "run.json"),
      checks: path.join(symphonyDir, "checks.json"),
      observability: path.join(symphonyDir, "observability.json"),
    },
  };

  writeJson(path.join(symphonyDir, "run.json"), runArtifact);
  writeJson(path.join(symphonyDir, "checks.json"), checksArtifact);
  writeJson(path.join(symphonyDir, "observability.json"), observabilityArtifact);
  writeJson(path.join(symphonyDir, "proof.json"), proofArtifact);

  return {
    runArtifact,
    checksArtifact,
    observabilityArtifact,
    proofArtifact,
  };
};
