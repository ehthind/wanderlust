import { describe, expect, it, vi } from "vitest";

import { reportRepairRunFailure } from "./repair-run-support.mjs";

const workflow = {
  checks: {
    allowed: ["delivery-gate", "observability-contract"],
  },
  limits: {
    maxAttempts: 3,
  },
  workpad: {
    marker: "<!-- codex-ci-workpad -->",
    heading: "## Codex CI Workpad",
  },
  linear: {
    enabled: true,
    workpad: {
      heading: "## Codex Workpad",
      remediationHeading: "### CI Remediation",
    },
  },
};

const pr = {
  number: 7,
  head: {
    sha: "head-sha",
  },
};

describe("reportRepairRunFailure", () => {
  it("marks the active run as blocked and completes remediation status", async () => {
    let savedState = {
      owner: "ehthind",
      repo: "wanderlust",
      prNumber: 7,
      activeRunId: "run-1",
      activeProcessId: 999,
      attemptCount: 1,
      status: "repairing",
      latestFailedChecks: ["observability-contract"],
      remediationCheckRunId: "status:head-sha:codex-remediation",
      commentId: 101,
    };
    const stateStore = {
      loadPrState: vi.fn(() => savedState),
      savePrState: vi.fn((state) => {
        savedState = state;
        return state;
      }),
    };
    const github = {
      listIssueComments: vi.fn(async () => [
        {
          id: 101,
          body: "<!-- codex-ci-workpad -->\n## Codex CI Workpad",
        },
      ]),
      updateIssueComment: vi.fn(async () => ({ id: 101 })),
      createIssueComment: vi.fn(async () => ({ id: 202 })),
      updateCheckRun: vi.fn(async () => true),
      createCheckRun: vi.fn(async () => ({ id: 303 })),
    };

    const nextState = await reportRepairRunFailure({
      github,
      linear: null,
      workflow,
      stateStore,
      owner: "ehthind",
      repo: "wanderlust",
      pr,
      runId: "run-1",
      error: new Error("pnpm install timed out"),
      logger: {
        warn: vi.fn(),
      },
    });

    expect(github.updateIssueComment).toHaveBeenCalledTimes(1);
    expect(github.updateCheckRun).toHaveBeenCalledWith(
      "status:head-sha:codex-remediation",
      expect.objectContaining({
        status: "completed",
        conclusion: "failure",
      }),
    );
    expect(nextState).toMatchObject({
      status: "blocked",
      blockedReason: "pnpm install timed out",
      activeRunId: null,
      activeProcessId: null,
      commentId: 101,
    });
  });

  it("does nothing when the run id is no longer active", async () => {
    const stateStore = {
      loadPrState: vi.fn(() => ({
        owner: "ehthind",
        repo: "wanderlust",
        prNumber: 7,
        activeRunId: "run-2",
      })),
      savePrState: vi.fn(),
    };
    const github = {
      listIssueComments: vi.fn(),
      updateIssueComment: vi.fn(),
      createIssueComment: vi.fn(),
      updateCheckRun: vi.fn(),
      createCheckRun: vi.fn(),
    };

    const nextState = await reportRepairRunFailure({
      github,
      linear: null,
      workflow,
      stateStore,
      owner: "ehthind",
      repo: "wanderlust",
      pr,
      runId: "run-1",
      error: new Error("stale"),
    });

    expect(nextState).toBeNull();
    expect(github.updateIssueComment).not.toHaveBeenCalled();
    expect(stateStore.savePrState).not.toHaveBeenCalled();
  });
});
