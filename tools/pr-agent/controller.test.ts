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
  it("persists the active run before spawning the repair worker", async () => {
    let savedState = null;
    const savePrState = vi.fn((state) => {
      savedState = state;
      return state;
    });
    const stateStore = {
      loadPrState: vi.fn(() => savedState),
      savePrState,
      writeRunContext: vi.fn(() => "/tmp/context.json"),
    };
    const github = {
      getAuthToken: vi.fn(async () => "token"),
      getPullRequest: vi.fn(async () => buildPullRequest()),
      listCheckRunsForRef: vi.fn(async () => ({
        check_runs: [
          {
            id: 11,
            name: "delivery-gate",
            status: "completed",
            conclusion: "success",
          },
          {
            id: 12,
            name: "observability-contract",
            status: "completed",
            conclusion: "failure",
            output: {
              summary: "missing README",
            },
          },
        ],
      })),
      listIssueComments: vi.fn(async () => []),
      createIssueComment: vi.fn(async () => ({ id: 101 })),
      updateIssueComment: vi.fn(async () => ({ id: 101 })),
      createCheckRun: vi.fn(async () => ({ id: 201 })),
      updateCheckRun: vi.fn(async () => ({ id: 201 })),
      rerequestCheckRun: vi.fn(async () => true),
    };
    const spawnRepairRun = vi.fn(async () => ({ pid: 4321 }));

    const controller = createController({
      workflow: {
        ...workflow,
        config: {
          ...workflow.config,
          github: {
            ...workflow.config.github,
            optOutLabel: "skip-this",
          },
        },
      },
      stateStore,
      githubClientFactory: vi.fn(() => github),
      linearClientFactory: vi.fn(() => null),
      spawnRepairRun,
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
      },
    });

    const pr = {
      ...buildPullRequest(),
      labels: [],
    };

    await controller.handleWebhookEvent({
      eventName: "pull_request",
      payload: {
        installation: { id: 1 },
        pull_request: pr,
      },
    });

    expect(savePrState).toHaveBeenCalledTimes(2);

    const preSpawnState = savePrState.mock.calls[0][0];
    const finalState = savePrState.mock.calls[1][0];

    expect(preSpawnState.activeRunId).toBeTruthy();
    expect(preSpawnState.activeProcessId).toBeNull();
    expect(spawnRepairRun).toHaveBeenCalledTimes(1);
    expect(finalState.activeRunId).toBe(preSpawnState.activeRunId);
    expect(finalState.activeProcessId).toBe(4321);
  });

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
