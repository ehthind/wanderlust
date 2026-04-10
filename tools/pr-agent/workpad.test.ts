import { describe, expect, it } from "vitest";

import { buildWorkpadBody, findExistingWorkpadComment } from "./workpad.mjs";

const workflow = {
  workpad: {
    marker: "<!-- codex-ci-workpad -->",
    heading: "## Codex CI Workpad",
  },
  limits: {
    maxAttempts: 3,
  },
};

const pr = {
  head: {
    sha: "abc1234",
  },
};

describe("findExistingWorkpadComment", () => {
  it("finds the latest comment containing the workpad marker", () => {
    const comment = findExistingWorkpadComment(
      [
        { id: 1, body: "hello" },
        { id: 2, body: "<!-- codex-ci-workpad -->\nold" },
        { id: 3, body: "<!-- codex-ci-workpad -->\nlatest" },
      ],
      workflow.workpad.marker,
    );

    expect(comment?.id).toBe(3);
  });
});

describe("buildWorkpadBody", () => {
  it("renders the core workpad sections", () => {
    const body = buildWorkpadBody({
      workflow,
      pr,
      runState: {
        runId: "run-1",
        attemptCount: 1,
        status: "repairing",
      },
      failedChecks: ["delivery-gate"],
      diagnosis: ["Investigating the failed check."],
      actionsTaken: ["Prepared the workspace."],
      validation: ["delivery-gate: passed"],
      blocker: null,
      updatedAt: "2026-04-10T10:00:00.000Z",
    });

    expect(body).toContain("## Codex CI Workpad");
    expect(body).toContain("status: repairing");
    expect(body).toContain("#### Failing Checks");
    expect(body).toContain("`delivery-gate`");
    expect(body).toContain("Prepared the workspace.");
  });
});
