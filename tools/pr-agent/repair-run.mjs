import fs from "node:fs";
import path from "node:path";

import { writePrAgentArtifacts } from "./artifacts.mjs";
import { createGitHubAppClient, extractActionsRunIdFromCheckRun } from "./github-app.mjs";
import { createLinearClientFromWorkflow, syncLinearIssueWorkpad } from "./linear.mjs";
import { getRequiredCheckStatus } from "./policy.mjs";
import { runCodexRepair, runRepairCycle } from "./repair-runner.mjs";
import { createStateStore } from "./state-store.mjs";
import { loadPrWorkflow } from "./workflow.mjs";
import { findExistingWorkpadComment } from "./workpad.mjs";
import { commitAndPushChanges, preparePrWorkspace } from "./workspace.mjs";

const args = process.argv.slice(2);
const contextFlagIndex = args.indexOf("--context");
const contextPath =
  contextFlagIndex >= 0 && args[contextFlagIndex + 1] ? args[contextFlagIndex + 1] : null;

if (!contextPath) {
  process.stderr.write("Usage: node tools/pr-agent/repair-run.mjs --context <path>\n");
  process.exit(1);
}

const readCheckContext = async ({ github, checkRun, workflow }) => {
  const snippets = [];
  if (checkRun.output?.summary) {
    snippets.push(checkRun.output.summary);
  }
  if (checkRun.output?.text) {
    snippets.push(checkRun.output.text);
  }

  const runId = extractActionsRunIdFromCheckRun(checkRun);
  if (!runId) {
    return snippets;
  }

  const artifactDir = await github
    .downloadRequiredCheckArtifact(runId, checkRun.name)
    .catch(() => null);
  if (!artifactDir) {
    return snippets;
  }

  for (const suffix of [".summary.md", ".log", ".json"]) {
    const filePath = path.join(artifactDir, `${checkRun.name}${suffix}`);
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const content = fs.readFileSync(filePath, "utf8");
    snippets.push(content.slice(0, workflow.config.limits.maxLogBytes));
  }

  return snippets;
};

const upsertWorkpad = async ({ github, workflow, pr, state, body }) => {
  const comments = await github.listIssueComments(pr.number);
  const existing =
    comments.find((comment) => comment.id === state.commentId) ??
    findExistingWorkpadComment(comments, workflow.config.workpad.marker);

  if (existing) {
    await github.updateIssueComment(existing.id, body);
    return existing.id;
  }

  const created = await github.createIssueComment(pr.number, body);
  return created.id;
};

const main = async () => {
  const context = JSON.parse(fs.readFileSync(contextPath, "utf8"));
  const workflow = loadPrWorkflow(context.workflowPath);
  const stateStore = createStateStore(workflow.config.state.root);
  const github = createGitHubAppClient({
    owner: context.owner,
    repo: context.repo,
    installationId: context.installationId,
    token: process.env.GITHUB_PR_AGENT_TOKEN,
    appId: process.env.GITHUB_APP_ID,
    privateKey: process.env.GITHUB_APP_PRIVATE_KEY,
  });
  const linear = createLinearClientFromWorkflow(workflow.config);

  const pr = await github.getPullRequest(context.pullRequestNumber);
  const currentState = stateStore.loadPrState({
    owner: context.owner,
    repo: context.repo,
    prNumber: context.pullRequestNumber,
  });

  if (
    !currentState ||
    currentState.activeRunId !== context.runId ||
    pr.head.sha !== context.headSha
  ) {
    stateStore.deleteRunContext(context.runId);
    return;
  }

  const checkRunsResponse = await github.listCheckRunsForRef(pr.head.sha);
  const checkStatus = getRequiredCheckStatus({
    checkRuns: checkRunsResponse.check_runs ?? [],
    requiredCheckNames: workflow.config.checks.allowed,
  });
  let workspaceArtifactRoot = path.join(
    workflow.config.workspace.root,
    `${context.owner}__${context.repo}`,
    `pr-${context.pullRequestNumber}`,
  );
  const excerpts = (
    await Promise.all(
      checkStatus.failed.map((checkRun) => readCheckContext({ github, checkRun, workflow })),
    )
  ).flat();

  const updateState = async (patch) => {
    const latest = stateStore.loadPrState({
      owner: context.owner,
      repo: context.repo,
      prNumber: context.pullRequestNumber,
    });
    stateStore.savePrState({
      ...latest,
      ...patch,
      updatedAt: new Date().toISOString(),
    });
  };

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
      process.stderr.write(
        `Failed to sync Linear workpad for PR #${pr.number}: ${
          error instanceof Error ? error.message : String(error)
        }\n`,
      );
      return {};
    }
  };

  try {
    const outcome = await runRepairCycle(
      {
        workflow: workflow.config,
        promptTemplate: workflow.promptTemplate,
        pr,
        runState: {
          runId: context.runId,
          attemptCount: currentState.attemptCount,
          status: currentState.status,
          fingerprint: currentState.lastFailureFingerprint,
        },
        failedCheckRuns: checkStatus.failed,
        excerpts,
      },
      {
        ensureWorkpad: async (body) =>
          upsertWorkpad({
            github,
            workflow,
            pr,
            state: stateStore.loadPrState({
              owner: context.owner,
              repo: context.repo,
              prNumber: context.pullRequestNumber,
            }),
            body,
          }),
        syncLinearWorkpad: ({ state, status, diagnosis, actionsTaken, validation, blocker }) =>
          syncLinearState({
            state: {
              ...(stateStore.loadPrState({
                owner: context.owner,
                repo: context.repo,
                prNumber: context.pullRequestNumber,
              }) ?? {}),
              ...state,
            },
            status,
            diagnosis,
            actionsTaken,
            validation,
            blocker,
          }),
        ensureRemediationCheckRun: async (payload) => {
          const latest = stateStore.loadPrState({
            owner: context.owner,
            repo: context.repo,
            prNumber: context.pullRequestNumber,
          });
          if (latest?.remediationCheckRunId) {
            await github.updateCheckRun(latest.remediationCheckRunId, {
              status: payload.status,
              output: payload.output,
            });
            return latest.remediationCheckRunId;
          }

          const created = await github.createCheckRun({
            name: payload.name,
            head_sha: payload.headSha,
            status: payload.status,
            output: payload.output,
          });
          return created.id;
        },
        updateRemediationCheckRun: (checkRunId, patch) => github.updateCheckRun(checkRunId, patch),
        rerequestCheckRun: (checkRunId) => github.rerequestCheckRun(checkRunId),
        updateState,
        prepareWorkspace: () => {
          const workspace = preparePrWorkspace({
            workspaceRoot: workflow.config.workspace.root,
            repositoryUrl: context.repositoryUrl,
            owner: context.owner,
            repo: context.repo,
            prNumber: context.pullRequestNumber,
            headRef: pr.head.ref,
            headSha: pr.head.sha,
            token: process.env.GITHUB_PR_AGENT_TOKEN,
            installCommand: workflow.config.workspace.installCommand,
            playwrightInstallCommand: workflow.config.workspace.playwrightInstallCommand,
          });
          workspaceArtifactRoot = workspace.workspacePath;
          return workspace;
        },
        runCodex: ({ workspacePath, prompt, runId }) =>
          runCodexRepair({
            workspacePath,
            prompt,
            runId,
            workflow: workflow.config,
          }),
        commitAndPush: ({ workspacePath, headRef, commitMessage }) =>
          commitAndPushChanges({
            workspacePath,
            headRef,
            commitMessage,
          }),
        writeArtifacts: ({ runState, diagnosis, actionsTaken, blocker, checkResults }) =>
          writePrAgentArtifacts({
            repoRoot: workspaceArtifactRoot,
            workflow: workflow.config,
            pr,
            runState,
            checkResults,
            diagnosis,
            actionsTaken,
            blocker,
          }),
      },
    );

    await updateState({
      activeRunId: null,
      activeProcessId: null,
      status: outcome.status,
      blockedReason: outcome.blocker ?? null,
    });
  } finally {
    stateStore.deleteRunContext(context.runId);
  }
};

main().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`,
  );
  process.exit(1);
});
