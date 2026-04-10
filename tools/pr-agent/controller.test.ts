import { describe, expect, it, vi } from "vitest";

import { createController } from "./controller.mjs";

const workflow = {
  config: {
    github: {
      sameRepoOnly: true,
      optOutLabel: "codex-disabled",
    },
    checks: {
      allowed: ["delivery-gate", "observability-contract"],
      rerunOnlyPatterns: [],
      manualPatterns: [],
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
      apiKeyEnv: "LINEAR_API_KEY",
      workpad: {
        heading: "## Codex Workpad",
        remediationHeading: "### CI Remediation",
      },
    },
  },
};

const buildPullRequest = () => ({
  number: 42,
  title: "Fix CI for GOT-40",
  body: "",
  labels: [{ name: "codex-disabled" }],
  head: {
    ref: "feature/got-40-fix-ci",
    sha: "head-sha",
    repo: {
      full_name: "ehthind/wanderlust",
      clone_url: "https://github.com/ehthind/wanderlust.git",
    },
  },
  base: {
    ref: "main",
    repo: {
      full_name: "ehthind/wanderlust",
      owner: { login: "ehthind" },
      name: "wanderlust",
    },
  },
});

describe("createController", () => {
  it("syncs the Linear workpad when the PR is opted out", async () => {
    let savedState = null;
    const stateStore = {
      loadPrState: vi.fn(() => savedState),
      savePrState: vi.fn((state) => {
        savedState = state;
        return state;
      }),
      writeRunContext: vi.fn(),
    };
    const github = {
      getAuthToken: vi.fn(async () => "token"),
      listCheckRunsForRef: vi.fn(async () => ({ check_runs: [] })),
      listIssueComments: vi.fn(async () => []),
      createIssueComment: vi.fn(async () => ({ id: 101 })),
      updateIssueComment: vi.fn(async () => ({ id: 101 })),
    };
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
                id: "comment-1",
                body: "## Codex Workpad\n\n### CI Remediation\n",
                updatedAt: "2026-04-10T11:00:00.000Z",
              },
            ],
          },
        }),
      createComment: vi.fn(async () => true),
      updateComment: vi.fn(async () => true),
    };
    const controller = createController({
      workflow,
      stateStore,
      githubClientFactory: vi.fn(() => github),
      linearClientFactory: vi.fn(() => linear),
      spawnRepairRun: vi.fn(),
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
      },
    });

    const nextState = await controller.handleWebhookEvent({
      eventName: "pull_request",
      payload: {
        installation: { id: 1 },
        pull_request: buildPullRequest(),
      },
    });

    expect(github.createIssueComment).toHaveBeenCalledTimes(1);
    expect(linear.createComment).toHaveBeenCalledTimes(1);
    expect(nextState).toMatchObject({
      status: "opted-out",
      commentId: 101,
      linearIssueIdentifier: "GOT-40",
      linearCommentId: "comment-1",
    });
  });
});
