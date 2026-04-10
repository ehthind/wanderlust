import { syncLinearIssueWorkpad } from "./linear.mjs";
import { buildWorkpadBody, findExistingWorkpadComment } from "./workpad.mjs";

const normalizeFailureMessage = (error) => {
  const message =
    error instanceof Error
      ? error.message || error.stack || error.name
      : String(error ?? "Unknown repair worker failure.");

  return message.replace(/\s+/g, " ").trim().slice(0, 1000);
};

export const upsertRepairWorkpad = async ({ github, workflow, pr, state, body }) => {
  const comments = await github.listIssueComments(pr.number);
  const existing =
    comments.find((comment) => comment.id === state.commentId) ??
    findExistingWorkpadComment(comments, workflow.workpad.marker);

  if (existing) {
    await github.updateIssueComment(existing.id, body);
    return existing.id;
  }

  const created = await github.createIssueComment(pr.number, body);
  return created.id;
};

export const reportRepairRunFailure = async ({
  github,
  linear,
  workflow,
  stateStore,
  owner,
  repo,
  pr,
  runId,
  error,
  logger = console,
}) => {
  const currentState = stateStore.loadPrState({
    owner,
    repo,
    prNumber: pr.number,
  });
  if (!currentState || currentState.activeRunId !== runId) {
    return null;
  }

  const blocker = normalizeFailureMessage(error);
  const diagnosis = ["Repair worker crashed before completing the remediation attempt."];
  const actionsTaken = ["Stopped the attempt and marked the PR for manual follow-up."];
  const body = buildWorkpadBody({
    workflow,
    pr,
    runState: {
      runId,
      attemptCount: currentState.attemptCount ?? 0,
      status: "blocked",
    },
    failedChecks: currentState.latestFailedChecks ?? [],
    diagnosis,
    actionsTaken,
    validation: [],
    blocker,
  });
  const commentId = await upsertRepairWorkpad({
    github,
    workflow,
    pr,
    state: currentState,
    body,
  });

  let linearState = {};
  if (linear) {
    try {
      linearState =
        (await syncLinearIssueWorkpad({
          linear,
          workflow,
          pr,
          state: {
            ...currentState,
            commentId,
          },
          status: "blocked",
          diagnosis,
          actionsTaken,
          validation: [],
          blocker,
        })) ?? {};
    } catch (linearError) {
      logger.warn?.(
        `Failed to sync Linear workpad for PR #${pr.number} after repair-run failure: ${
          linearError instanceof Error ? linearError.message : String(linearError)
        }`,
      );
    }
  }

  const output = {
    title: "Codex remediation crashed",
    summary: blocker,
  };
  let remediationCheckRunId = currentState.remediationCheckRunId;
  if (remediationCheckRunId) {
    await github.updateCheckRun(remediationCheckRunId, {
      status: "completed",
      conclusion: "failure",
      output,
    });
  } else {
    remediationCheckRunId = (
      await github.createCheckRun({
        name: "codex-remediation",
        head_sha: pr.head.sha,
        status: "completed",
        conclusion: "failure",
        output,
      })
    ).id;
  }

  const nextState = {
    ...currentState,
    commentId,
    ...linearState,
    remediationCheckRunId,
    status: "blocked",
    blockedReason: blocker,
    activeRunId: null,
    activeProcessId: null,
    updatedAt: new Date().toISOString(),
  };
  stateStore.savePrState(nextState);
  return nextState;
};
