import { describe, expect, it } from "vitest";

import {
  computeFailureFingerprint,
  createInitialPrState,
  getRequiredCheckStatus,
  reconcilePrState,
} from "./policy.mjs";

const workflow = {
  github: {
    sameRepoOnly: true,
    optOutLabel: "codex-disabled",
  },
  checks: {
    allowed: ["delivery-gate", "observability-contract"],
    rerunOnlyPatterns: ["timed out"],
    manualPatterns: ["bad credentials"],
  },
  limits: {
    maxAttempts: 2,
  },
};

const buildPr = (overrides = {}) => {
  const { head: headOverrides = {}, base: baseOverrides = {}, ...restOverrides } = overrides;

  return {
    number: 42,
    labels: [],
    head: {
      sha: "head-sha",
      repo: {
        full_name: "ehthind/wanderlust",
      },
      ...headOverrides,
    },
    base: {
      ref: "main",
      repo: {
        full_name: "ehthind/wanderlust",
        owner: { login: "ehthind" },
        name: "wanderlust",
      },
      ...baseOverrides,
    },
    ...restOverrides,
  };
};

describe("getRequiredCheckStatus", () => {
  it("groups required checks into failed, passed, pending, and missing buckets", () => {
    const status = getRequiredCheckStatus({
      checkRuns: [
        { name: "delivery-gate", status: "completed", conclusion: "failure" },
        { name: "observability-contract", status: "completed", conclusion: "success" },
      ],
      requiredCheckNames: workflow.checks.allowed,
    });

    expect(status.failed.map((check) => check.name)).toEqual(["delivery-gate"]);
    expect(status.passed.map((check) => check.name)).toEqual(["observability-contract"]);
    expect(status.pending).toHaveLength(0);
    expect(status.missing).toHaveLength(0);
  });
});

describe("reconcilePrState", () => {
  it("starts a repair run when a required check fails", () => {
    const result = reconcilePrState({
      workflow,
      pr: buildPr(),
      prState: createInitialPrState({
        owner: "ehthind",
        repo: "wanderlust",
        prNumber: 42,
      }),
      checkRuns: [
        {
          name: "delivery-gate",
          status: "completed",
          conclusion: "failure",
          output: { summary: "lint failure" },
        },
        {
          name: "observability-contract",
          status: "completed",
          conclusion: "success",
        },
      ],
    });

    expect(result.action.type).toBe("start-repair");
    expect(result.nextState.latestFailedChecks).toEqual(["delivery-gate"]);
    expect(result.nextState.attemptCount).toBe(1);
  });

  it("cancels and supersedes the active run when the head SHA changes", () => {
    const result = reconcilePrState({
      workflow,
      pr: buildPr({
        head: {
          sha: "new-head",
        },
      }),
      prState: {
        ...createInitialPrState({
          owner: "ehthind",
          repo: "wanderlust",
          prNumber: 42,
        }),
        activeRunId: "run-1",
        activeProcessId: 1234,
        headSha: "old-head",
      },
      checkRuns: [
        {
          name: "delivery-gate",
          status: "completed",
          conclusion: "failure",
          output: { summary: "lint failure" },
        },
      ],
    });

    expect(result.cancelActiveRun).toBe(true);
    expect(result.action.type).toBe("start-repair");
  });

  it("does not burn retry budget while a run is already active on the same SHA", () => {
    const result = reconcilePrState({
      workflow,
      pr: buildPr(),
      prState: {
        ...createInitialPrState({
          owner: "ehthind",
          repo: "wanderlust",
          prNumber: 42,
        }),
        activeRunId: "run-1",
        headSha: "head-sha",
        attemptCount: 1,
      },
      checkRuns: [
        {
          name: "delivery-gate",
          status: "completed",
          conclusion: "failure",
          output: { summary: "lint failure" },
        },
      ],
    });

    expect(result.action.type).toBe("noop-active-run");
    expect(result.nextState.attemptCount).toBe(1);
  });

  it("blocks the PR after the same failure fingerprint exceeds the retry budget", () => {
    const failedCheckRun = {
      name: "delivery-gate",
      status: "completed",
      conclusion: "failure",
      output: { summary: "same fingerprint" },
    };
    const fingerprint = computeFailureFingerprint({
      failedCheckRuns: [failedCheckRun],
      excerpts: [failedCheckRun.output.summary],
    });
    const result = reconcilePrState({
      workflow,
      pr: buildPr(),
      prState: {
        ...createInitialPrState({
          owner: "ehthind",
          repo: "wanderlust",
          prNumber: 42,
        }),
        fingerprintCounts: {
          [fingerprint]: 2,
        },
      },
      checkRuns: [failedCheckRun],
    });

    expect(result.action.type).toBe("block-loop");
    expect(result.nextState.status).toBe("blocked");
  });

  it("skips opted-out pull requests", () => {
    const result = reconcilePrState({
      workflow,
      pr: buildPr({
        labels: [{ name: "codex-disabled" }],
      }),
      prState: createInitialPrState({
        owner: "ehthind",
        repo: "wanderlust",
        prNumber: 42,
      }),
      checkRuns: [],
    });

    expect(result.action.type).toBe("skip");
    expect(result.nextState.status).toBe("opted-out");
  });
});
