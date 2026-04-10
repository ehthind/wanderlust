import { describe, expect, it, vi } from "vitest";

import { runRepairCycle } from "./repair-runner.mjs";

const workflow = {
  checks: {
    allowed: ["delivery-gate", "observability-contract"],
    rerunOnlyPatterns: ["timed out"],
    manualPatterns: ["bad credentials"],
  },
  workpad: {
    marker: "<!-- codex-ci-workpad -->",
    heading: "## Codex CI Workpad",
  },
  limits: {
    maxAttempts: 3,
  },
};

const pr = {
  number: 42,
  title: "Fix the CI loop",
  html_url: "https://github.com/ehthind/wanderlust/pull/42",
  head: {
    ref: "feature/ci",
    sha: "abc123",
  },
  base: {
    ref: "main",
  },
};

const buildDeps = () => ({
  ensureWorkpad: vi.fn(async () => 99),
  updateState: vi.fn(async () => {}),
  ensureRemediationCheckRun: vi.fn(async () => 77),
  updateRemediationCheckRun: vi.fn(async () => {}),
  rerequestCheckRun: vi.fn(async () => {}),
  prepareWorkspace: vi.fn(async () => ({ workspacePath: "/tmp/workspace" })),
  runCodex: vi.fn(async () => ({ exitCode: 0, finalMessage: "Applied a fix." })),
  validateRequiredChecks: vi.fn(async () => [
    {
      name: "delivery-gate",
      status: "passed",
      durationMs: 12,
    },
    {
      name: "observability-contract",
      status: "passed",
      durationMs: 8,
    },
  ]),
  commitAndPush: vi.fn(async () => ({
    committed: true,
    commitSha: "deadbeef",
  })),
  writeArtifacts: vi.fn(async () => {}),
});

describe("runRepairCycle", () => {
  it("marks manual-only failures as blocked without preparing a workspace", async () => {
    const deps = buildDeps();
    const outcome = await runRepairCycle(
      {
        workflow,
        promptTemplate: "repair the PR",
        pr,
        runState: {
          runId: "run-1",
          attemptCount: 1,
          status: "repairing",
        },
        failedCheckRuns: [
          {
            id: 1,
            name: "delivery-gate",
            conclusion: "failure",
            output: { summary: "bad credentials" },
          },
        ],
      },
      deps,
    );

    expect(outcome.status).toBe("blocked");
    expect(deps.prepareWorkspace).not.toHaveBeenCalled();
    expect(deps.updateRemediationCheckRun).toHaveBeenCalledWith(
      77,
      expect.objectContaining({ conclusion: "neutral" }),
    );
  });

  it("requests a rerun for transient failures", async () => {
    const deps = buildDeps();
    const outcome = await runRepairCycle(
      {
        workflow,
        promptTemplate: "repair the PR",
        pr,
        runState: {
          runId: "run-1",
          attemptCount: 1,
          status: "repairing",
        },
        failedCheckRuns: [
          {
            id: 1,
            name: "delivery-gate",
            conclusion: "timed_out",
            output: { summary: "timed out while downloading packages" },
          },
        ],
      },
      deps,
    );

    expect(outcome.status).toBe("awaiting-ci");
    expect(deps.rerequestCheckRun).toHaveBeenCalledWith(1);
    expect(deps.prepareWorkspace).not.toHaveBeenCalled();
  });

  it("pushes a remediation commit after Codex and local validation succeed", async () => {
    const deps = buildDeps();
    const outcome = await runRepairCycle(
      {
        workflow,
        promptTemplate: "repair the PR",
        pr,
        runState: {
          runId: "run-1",
          attemptCount: 1,
          status: "repairing",
        },
        failedCheckRuns: [
          {
            id: 1,
            name: "delivery-gate",
            conclusion: "failure",
            output: { summary: "lint failure" },
          },
        ],
      },
      deps,
    );

    expect(outcome.status).toBe("awaiting-ci");
    expect(deps.prepareWorkspace).toHaveBeenCalled();
    expect(deps.runCodex).toHaveBeenCalled();
    expect(deps.commitAndPush).toHaveBeenCalled();
    expect(deps.updateRemediationCheckRun).toHaveBeenCalledWith(
      77,
      expect.objectContaining({ status: "in_progress" }),
    );
  });
});
