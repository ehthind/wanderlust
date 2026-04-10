import { spawn } from "node:child_process";
import path from "node:path";

import { createLinearClientFromWorkflow, syncLinearIssueWorkpad } from "./linear.mjs";
import { createInitialPrState, parseIssueCommentCommand, reconcilePrState } from "./policy.mjs";
import { generateRunId } from "./state-store.mjs";
import { buildWorkpadBody, findExistingWorkpadComment } from "./workpad.mjs";

const buildDefaultSpawnRepairRun =
  () =>
  async ({ contextPath, env }) => {
    const child = spawn(
      process.execPath,
      ["tools/pr-agent/repair-run.mjs", "--context", contextPath],
      {
        cwd: process.cwd(),
        env,
        detached: true,
        stdio: "ignore",
      },
    );
    child.unref();
    return child;
  };

const killProcessIfRunning = (pid) => {
  if (!pid) {
    return;
  }

  try {
    process.kill(pid, "SIGTERM");
  } catch {
    // The repair worker may already be gone.
  }
};

const upsertWorkpadComment = async ({
  github,
  workflow,
  pr,
  state,
  status,
  diagnosis = [],
  actionsTaken = [],
  validation = [],
  blocker = null,
}) => {
  const comments = await github.listIssueComments(pr.number);
  const existing =
    comments.find((comment) => comment.id === state.commentId) ??
    findExistingWorkpadComment(comments, workflow.workpad.marker);
  const body = buildWorkpadBody({
    workflow,
    pr,
    runState: {
      runId: state.activeRunId,
      attemptCount: state.attemptCount ?? 0,
      status,
    },
    failedChecks: state.latestFailedChecks ?? [],
    diagnosis,
    actionsTaken,
    validation,
    blocker,
  });

  if (existing) {
    await github.updateIssueComment(existing.id, body);
    return existing.id;
  }

  const created = await github.createIssueComment(pr.number, body);
  return created.id;
};

const completeRemediationCheckRun = async ({
  github,
  state,
  headSha,
  conclusion,
  title,
  summary,
}) => {
  if (!state.remediationCheckRunId && !state.commentId) {
    return null;
  }

  if (!state.remediationCheckRunId) {
    const created = await github.createCheckRun({
      name: "codex-remediation",
      head_sha: headSha,
      status: "completed",
      conclusion,
      output: {
        title,
        summary,
      },
    });
    return created.id;
  }

  await github.updateCheckRun(state.remediationCheckRunId, {
    status: "completed",
    conclusion,
    output: {
      title,
      summary,
    },
  });
  return state.remediationCheckRunId;
};

export const createController = ({
  workflow,
  stateStore,
  githubClientFactory,
  linearClientFactory = () => createLinearClientFromWorkflow(workflow.config),
  spawnRepairRun = buildDefaultSpawnRepairRun(),
  logger = console,
}) => {
  const reconcilePullRequest = async ({ pr, installationId }) => {
    const owner = pr.base.repo.owner.login;
    const repo = pr.base.repo.name;
    const github = githubClientFactory({
      owner,
      repo,
      installationId,
    });
    const linear = linearClientFactory({
      owner,
      repo,
      installationId,
      workflow: workflow.config,
    });
    const existingState =
      stateStore.loadPrState({ owner, repo, prNumber: pr.number }) ??
      createInitialPrState({
        owner,
        repo,
        prNumber: pr.number,
      });
    const checkRunsResponse = await github.listCheckRunsForRef(pr.head.sha);
    const evaluation = reconcilePrState({
      workflow: workflow.config,
      pr,
      prState: existingState,
      checkRuns: checkRunsResponse.check_runs ?? [],
    });

    let nextState = {
      ...evaluation.nextState,
      owner,
      repo,
      prNumber: pr.number,
    };

    if (evaluation.cancelActiveRun) {
      killProcessIfRunning(existingState.activeProcessId);
      nextState = {
        ...nextState,
        activeRunId: null,
        activeProcessId: null,
      };
    }

    const syncLinearState = async ({
      state,
      status,
      diagnosis = [],
      actionsTaken = [],
      validation = [],
      blocker = null,
    }) => {
      if (!linear) {
        return {};
      }

      try {
        return (
          (await syncLinearIssueWorkpad({
            linear,
            workflow: workflow.config,
            pr,
            state,
            status,
            diagnosis,
            actionsTaken,
            validation,
            blocker,
          })) ?? {}
        );
      } catch (error) {
        logger.warn?.(
          `Failed to sync Linear workpad for PR #${pr.number}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        return {};
      }
    };

    switch (evaluation.action.type) {
      case "mark-green": {
        const shouldSyncExternalWorkpads = Boolean(
          existingState.commentId ?? existingState.linearCommentId ?? existingState.linearIssueId,
        );
        const commentId = shouldSyncExternalWorkpads
          ? await upsertWorkpadComment({
              github,
              workflow: workflow.config,
              pr,
              state: nextState,
              status: "green",
              diagnosis: ["Required checks are green on the latest PR head SHA."],
              actionsTaken: [],
              validation: workflow.config.checks.allowed.map((checkName) => `${checkName}: passed`),
              blocker: null,
            })
          : null;
        const linearState = shouldSyncExternalWorkpads
          ? await syncLinearState({
              state: {
                ...nextState,
                commentId: commentId ?? existingState.commentId,
              },
              status: "green",
              diagnosis: ["Required checks are green on the latest PR head SHA."],
              validation: workflow.config.checks.allowed.map((checkName) => `${checkName}: passed`),
            })
          : {};

        nextState = {
          ...nextState,
          commentId: commentId ?? existingState.commentId,
          ...linearState,
          remediationCheckRunId: await completeRemediationCheckRun({
            github,
            state: existingState,
            headSha: pr.head.sha,
            conclusion: "success",
            title: "Codex remediation complete",
            summary: "Required checks are green on the latest PR head SHA.",
          }),
          activeRunId: null,
          activeProcessId: null,
        };
        break;
      }

      case "skip": {
        const commentId =
          existingState.commentId ??
          (await upsertWorkpadComment({
            github,
            workflow: workflow.config,
            pr,
            state: nextState,
            status: nextState.status,
            diagnosis: [nextState.blockedReason ?? "PR remediation is disabled for this PR."],
            blocker: nextState.blockedReason,
          }));
        const linearState = await syncLinearState({
          state: {
            ...nextState,
            commentId,
          },
          status: nextState.status,
          diagnosis: [nextState.blockedReason ?? "PR remediation is disabled for this PR."],
          blocker: nextState.blockedReason,
        });
        nextState = {
          ...nextState,
          commentId,
          ...linearState,
        };
        break;
      }

      case "block-loop": {
        const commentId = await upsertWorkpadComment({
          github,
          workflow: workflow.config,
          pr,
          state: nextState,
          status: "blocked",
          diagnosis: [nextState.blockedReason],
          blocker: nextState.blockedReason,
        });
        const linearState = await syncLinearState({
          state: {
            ...nextState,
            commentId,
          },
          status: "blocked",
          diagnosis: [nextState.blockedReason],
          blocker: nextState.blockedReason,
        });
        nextState = {
          ...nextState,
          commentId,
          ...linearState,
          remediationCheckRunId: await completeRemediationCheckRun({
            github,
            state: existingState,
            headSha: pr.head.sha,
            conclusion: "neutral",
            title: "Codex remediation stopped",
            summary: nextState.blockedReason,
          }),
          activeRunId: null,
          activeProcessId: null,
        };
        break;
      }

      case "start-repair": {
        const runId = generateRunId();
        const contextPath = stateStore.writeRunContext(runId, {
          owner,
          repo,
          pullRequestNumber: pr.number,
          installationId,
          runId,
          headSha: pr.head.sha,
          workflowPath: path.join(process.cwd(), "WORKFLOW.pr.md"),
          repositoryUrl: pr.head.repo.clone_url,
        });
        const authToken = await github.getAuthToken();
        nextState = {
          ...nextState,
          activeRunId: runId,
          activeProcessId: null,
          blockedReason: null,
        };
        stateStore.savePrState(nextState);
        const child = await spawnRepairRun({
          contextPath,
          env: {
            ...process.env,
            GITHUB_PR_AGENT_TOKEN: authToken,
          },
        });

        nextState = {
          ...nextState,
          activeProcessId: child.pid ?? null,
        };
        break;
      }

      default:
        break;
    }

    stateStore.savePrState(nextState);
    return nextState;
  };

  const resolvePullRequestFromLightweightPayload = async ({
    installationId,
    owner,
    repo,
    pullRequestNumber,
  }) => {
    const github = githubClientFactory({
      owner,
      repo,
      installationId,
    });
    return github.getPullRequest(pullRequestNumber);
  };

  return {
    async handleWebhookEvent({ eventName, payload }) {
      logger.info?.(`Handling GitHub webhook event ${eventName}`);

      if (eventName === "pull_request") {
        return reconcilePullRequest({
          installationId: payload.installation?.id ?? null,
          pr: payload.pull_request,
        });
      }

      if (eventName === "check_run" && payload.action === "completed") {
        const pullRequest = payload.check_run.pull_requests?.[0];
        if (!pullRequest) {
          return null;
        }

        const owner = payload.repository.owner.login;
        const repo = payload.repository.name;
        const pr = await resolvePullRequestFromLightweightPayload({
          installationId: payload.installation?.id ?? null,
          owner,
          repo,
          pullRequestNumber: pullRequest.number,
        });
        return reconcilePullRequest({
          installationId: payload.installation?.id ?? null,
          pr,
        });
      }

      if (eventName === "check_suite" && payload.action === "completed") {
        const pullRequest = payload.check_suite.pull_requests?.[0];
        if (!pullRequest) {
          return null;
        }

        const owner = payload.repository.owner.login;
        const repo = payload.repository.name;
        const pr = await resolvePullRequestFromLightweightPayload({
          installationId: payload.installation?.id ?? null,
          owner,
          repo,
          pullRequestNumber: pullRequest.number,
        });
        return reconcilePullRequest({
          installationId: payload.installation?.id ?? null,
          pr,
        });
      }

      if (eventName === "issue_comment" && payload.action === "created") {
        const command = parseIssueCommentCommand(payload.comment.body ?? "");
        if (!command) {
          return null;
        }

        const owner = payload.repository.owner.login;
        const repo = payload.repository.name;
        const installationId = payload.installation?.id ?? null;
        const pr = await resolvePullRequestFromLightweightPayload({
          installationId,
          owner,
          repo,
          pullRequestNumber: payload.issue.number,
        }).catch(() => null);
        if (!pr) {
          return null;
        }

        const currentState =
          stateStore.loadPrState({ owner, repo, prNumber: pr.number }) ??
          createInitialPrState({
            owner,
            repo,
            prNumber: pr.number,
          });

        if (command === "stop") {
          killProcessIfRunning(currentState.activeProcessId);
          const github = githubClientFactory({
            owner,
            repo,
            installationId,
          });
          const linear = linearClientFactory({
            owner,
            repo,
            installationId,
            workflow: workflow.config,
          });
          const commentId = await upsertWorkpadComment({
            github,
            workflow: workflow.config,
            pr,
            state: currentState,
            status: "blocked",
            diagnosis: ["Stopped by @codex stop."],
            blocker: "Stopped by @codex stop.",
          });
          let linearState = {};
          if (linear) {
            try {
              linearState =
                (await syncLinearIssueWorkpad({
                  linear,
                  workflow: workflow.config,
                  pr,
                  state: {
                    ...currentState,
                    commentId,
                  },
                  status: "blocked",
                  diagnosis: ["Stopped by @codex stop."],
                  blocker: "Stopped by @codex stop.",
                })) ?? {};
            } catch (error) {
              logger.warn?.(
                `Failed to sync Linear workpad for PR #${pr.number}: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              );
            }
          }
          const nextState = {
            ...currentState,
            status: "blocked",
            blockedReason: "Stopped by @codex stop.",
            activeRunId: null,
            activeProcessId: null,
            remediationCheckRunId: await completeRemediationCheckRun({
              github,
              state: currentState,
              headSha: pr.head.sha,
              conclusion: "neutral",
              title: "Codex remediation stopped",
              summary: "Stopped by @codex stop.",
            }),
            commentId,
            ...linearState,
          };
          stateStore.savePrState(nextState);
          return nextState;
        }

        return reconcilePullRequest({
          installationId,
          pr,
        });
      }

      return null;
    },
  };
};
