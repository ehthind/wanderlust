import { describe, expect, it, vi } from "vitest";

import {
  buildLinearRemediationSection,
  collectLinearIssueIdentifiers,
  findExistingLinearWorkpadComment,
  syncLinearIssueWorkpad,
  upsertLinearRemediationSection,
} from "./linear.mjs";

const workflow = {
  limits: {
    maxAttempts: 3,
  },
  linear: {
    enabled: true,
    apiKeyEnv: "LINEAR_API_KEY",
    workpad: {
      heading: "## Codex Workpad",
      remediationHeading: "### CI Remediation",
    },
  },
};

const pr = {
  number: 42,
  title: "Fix branch drift for GOT-40",
  body: "Linked issue: https://linear.app/wanderlust/issue/GOT-40/fix-branch-drift",
  head: {
    ref: "feature/got-40-fix-ci",
    sha: "abc1234",
  },
};

describe("collectLinearIssueIdentifiers", () => {
  it("normalizes and de-duplicates identifiers from PR metadata", () => {
    const identifiers = collectLinearIssueIdentifiers({
      pr,
      state: {
        linearIssueIdentifier: "got-40",
      },
    });

    expect(identifiers).toEqual(["GOT-40"]);
  });
});

describe("findExistingLinearWorkpadComment", () => {
  it("prefers the newest workpad comment", () => {
    const comment = findExistingLinearWorkpadComment(
      [
        {
          id: "1",
          body: "## Codex Workpad\n\nolder",
          updatedAt: "2026-04-10T10:00:00.000Z",
        },
        {
          id: "2",
          body: "## Codex Workpad\n\nnewer",
          updatedAt: "2026-04-10T11:00:00.000Z",
        },
      ],
      workflow.linear.workpad.heading,
    );

    expect(comment?.id).toBe("2");
  });
});

describe("upsertLinearRemediationSection", () => {
  it("replaces only the CI remediation section and keeps the plan intact", () => {
    const nextBody = upsertLinearRemediationSection({
      existingBody: `## Codex Workpad

### Plan

- [ ] keep the main plan

### CI Remediation

old ci section

### Confusions

- none
`,
      workpadHeading: workflow.linear.workpad.heading,
      remediationHeading: workflow.linear.workpad.remediationHeading,
      remediationSection: `### CI Remediation

new ci section`,
    });

    expect(nextBody).toContain("- [ ] keep the main plan");
    expect(nextBody).toContain("new ci section");
    expect(nextBody).not.toContain("old ci section");
    expect(nextBody).toContain("### Confusions");
  });
});

describe("buildLinearRemediationSection", () => {
  it("renders the remediation heading and shared status fields", () => {
    const section = buildLinearRemediationSection({
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

    expect(section).toContain("### CI Remediation");
    expect(section).toContain("status: repairing");
    expect(section).toContain("`delivery-gate`");
  });
});

describe("syncLinearIssueWorkpad", () => {
  it("updates an existing workpad comment in place", async () => {
    const updateComment = vi.fn(async () => true);
    const linear = {
      getIssueByIdOrIdentifier: vi
        .fn()
        .mockResolvedValueOnce({
          id: "issue-1",
          identifier: "GOT-40",
          comments: {
            nodes: [
              {
                id: "comment-1",
                body: `## Codex Workpad

### Plan

- [ ] keep the plan

### CI Remediation

old ci section
`,
                updatedAt: "2026-04-10T10:00:00.000Z",
              },
            ],
          },
        })
        .mockResolvedValueOnce({
          id: "issue-1",
          identifier: "GOT-40",
          comments: {
            nodes: [
              {
                id: "comment-1",
                body: `## Codex Workpad

### Plan

- [ ] keep the plan

### CI Remediation

status: awaiting-ci
`,
                updatedAt: "2026-04-10T11:00:00.000Z",
              },
            ],
          },
        }),
      createComment: vi.fn(async () => true),
      updateComment,
    };

    const result = await syncLinearIssueWorkpad({
      linear,
      workflow,
      pr,
      state: {
        activeRunId: "run-1",
        attemptCount: 1,
        latestFailedChecks: ["delivery-gate"],
        linearCommentId: "comment-1",
      },
      status: "awaiting-ci",
      diagnosis: ["Investigating the failed check."],
      actionsTaken: ["Prepared the workspace."],
      validation: ["delivery-gate: passed"],
      blocker: null,
    });

    expect(updateComment).toHaveBeenCalledWith(
      "comment-1",
      expect.stringContaining("### CI Remediation"),
    );
    expect(updateComment).toHaveBeenCalledWith(
      "comment-1",
      expect.stringContaining("- [ ] keep the plan"),
    );
    expect(result).toEqual({
      linearIssueId: "issue-1",
      linearIssueIdentifier: "GOT-40",
      linearCommentId: "comment-1",
    });
  });

  it("creates a bootstrap workpad comment when none exists yet", async () => {
    const createComment = vi.fn(async () => true);
    const linear = {
      getIssueByIdOrIdentifier: vi
        .fn()
        .mockResolvedValueOnce({
          id: "issue-1",
          identifier: "GOT-40",
          comments: {
            nodes: [],
          },
        })
        .mockResolvedValueOnce({
          id: "issue-1",
          identifier: "GOT-40",
          comments: {
            nodes: [
              {
                id: "comment-2",
                body: "## Codex Workpad\n\n### CI Remediation\n",
                updatedAt: "2026-04-10T11:00:00.000Z",
              },
            ],
          },
        }),
      createComment,
      updateComment: vi.fn(async () => true),
    };

    const result = await syncLinearIssueWorkpad({
      linear,
      workflow,
      pr,
      state: {
        activeRunId: "run-1",
        attemptCount: 1,
        latestFailedChecks: ["delivery-gate"],
      },
      status: "repairing",
      diagnosis: ["Investigating the failed check."],
    });

    expect(createComment).toHaveBeenCalledWith(
      "issue-1",
      expect.stringContaining("## Codex Workpad"),
    );
    expect(result).toEqual({
      linearIssueId: "issue-1",
      linearIssueIdentifier: "GOT-40",
      linearCommentId: "comment-2",
    });
  });
});
