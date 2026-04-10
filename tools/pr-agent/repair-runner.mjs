import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { listRequiredChecks, runRequiredCheck } from "../checks/required-checks.mjs";
import { classifyFailure } from "./policy.mjs";
import { buildWorkpadBody } from "./workpad.mjs";

const formatValidation = (results) =>
  results.map((result) => `${result.name}: ${result.status} (${result.durationMs}ms)`);

const replaceProgressAction = (actionsTaken, value) => {
  const nextActions = actionsTaken.filter((entry) => !entry.startsWith("Progress: "));
  nextActions.push(`Progress: ${value}`);
  actionsTaken.splice(0, actionsTaken.length, ...nextActions);
};

export const buildCodexPrompt = ({ workflowPrompt, pr, failedCheckRuns, excerpts }) =>
  [
    workflowPrompt,
    "",
    "## Pull Request Context",
    `- PR: #${pr.number}`,
    `- Title: ${pr.title}`,
    `- URL: ${pr.html_url}`,
    `- Base branch: ${pr.base.ref}`,
    `- Head branch: ${pr.head.ref}`,
    `- Head SHA: ${pr.head.sha}`,
    "",
    "## Failed Required Checks",
    ...failedCheckRuns.flatMap((checkRun) => [
      `### ${checkRun.name}`,
      `- conclusion: ${checkRun.conclusion ?? "unknown"}`,
      `- details: ${checkRun.details_url ?? "n/a"}`,
      checkRun.output?.summary ? `- summary: ${checkRun.output.summary}` : "- summary: none",
      "",
    ]),
    ...(excerpts.length > 0
      ? [
          "## CI Context",
          ...excerpts.map((excerpt, index) => `### Excerpt ${index + 1}\n${excerpt}`),
        ]
      : []),
  ].join("\n");

export const runRepairCycle = async (
  { workflow, promptTemplate, pr, runState, failedCheckRuns, excerpts = [] },
  deps,
) => {
  const diagnosis = [];
  const actionsTaken = [];
  let validation = [];
  let blocker = null;

  const syncWorkpad = async (status) => {
    const nextState = {
      ...runState,
      status,
    };
    const body = buildWorkpadBody({
      workflow,
      pr,
      runState: nextState,
      failedChecks: failedCheckRuns.map((checkRun) => checkRun.name),
      diagnosis,
      actionsTaken,
      validation,
      blocker,
    });

    const commentId = await deps.ensureWorkpad(body);
    const statePatch = {
      commentId,
      status,
      blockedReason: blocker,
    };
    if (deps.syncLinearWorkpad) {
      Object.assign(
        statePatch,
        (await deps.syncLinearWorkpad({
          state: {
            ...runState,
            latestFailedChecks: failedCheckRuns.map((checkRun) => checkRun.name),
            commentId,
            ...statePatch,
          },
          status,
          diagnosis,
          actionsTaken,
          validation,
          blocker,
        })) ?? {},
      );
    }
    await deps.updateState(statePatch);
    return commentId;
  };

  const remediationCheckRunId = await deps.ensureRemediationCheckRun({
    name: "codex-remediation",
    headSha: pr.head.sha,
    status: "in_progress",
    output: {
      title: "Codex remediation in progress",
      summary: `Investigating ${failedCheckRuns.map((checkRun) => checkRun.name).join(", ")}`,
    },
  });
  await deps.updateState({
    remediationCheckRunId,
    status: "repairing",
  });

  const classification = classifyFailure({
    failedCheckRuns,
    excerpts,
    workflow,
  });
  diagnosis.push(classification.reason);
  await syncWorkpad("repairing");

  if (classification.kind === "manual") {
    blocker = classification.reason;
    await syncWorkpad("blocked");
    await deps.updateRemediationCheckRun(remediationCheckRunId, {
      status: "completed",
      conclusion: "neutral",
      output: {
        title: "Codex remediation blocked",
        summary: blocker,
      },
    });
    await deps.writeArtifacts({
      runState: {
        ...runState,
        status: "blocked",
      },
      diagnosis,
      actionsTaken,
      blocker,
      checkResults: [],
    });
    return { status: "blocked", blocker };
  }

  if (classification.kind === "rerun-only") {
    await Promise.all(failedCheckRuns.map((checkRun) => deps.rerequestCheckRun(checkRun.id)));
    actionsTaken.push("Requested a rerun of the failed required checks.");
    await syncWorkpad("awaiting-ci");
    await deps.writeArtifacts({
      runState: {
        ...runState,
        status: "awaiting-ci",
      },
      diagnosis,
      actionsTaken,
      blocker,
      checkResults: [],
    });
    return { status: "awaiting-ci", rerunRequested: true };
  }

  replaceProgressAction(actionsTaken, "preparing workspace");
  await syncWorkpad("repairing");
  const workspace = await deps.prepareWorkspace({
    onProgress: async (step) => {
      replaceProgressAction(actionsTaken, step);
      await syncWorkpad("repairing");
    },
  });
  actionsTaken.push(`Prepared workspace \`${workspace.workspacePath}\`.`);
  await syncWorkpad("repairing");

  replaceProgressAction(actionsTaken, "running Codex repair");
  await syncWorkpad("repairing");
  const prompt = buildCodexPrompt({
    workflowPrompt: promptTemplate,
    pr,
    failedCheckRuns,
    excerpts,
  });
  const codexResult = await deps.runCodex({
    workspacePath: workspace.workspacePath,
    prompt,
    runId: runState.runId,
  });
  if (codexResult.exitCode !== 0) {
    diagnosis.push(`Codex exited with code ${codexResult.exitCode}.`);
  }
  if (codexResult.finalMessage) {
    diagnosis.push(codexResult.finalMessage);
  } else {
    diagnosis.push("Codex finished without a final message.");
  }

  replaceProgressAction(actionsTaken, "running local required-check validation");
  await syncWorkpad("repairing");
  const results = deps.validateRequiredChecks
    ? await deps.validateRequiredChecks({
        workflow,
        workspacePath: workspace.workspacePath,
      })
    : listRequiredChecks()
        .filter((check) => workflow.checks.allowed.includes(check.name))
        .map((check) =>
          runRequiredCheck({
            repoRoot: workspace.workspacePath,
            checkName: check.name,
            surface: "workspace",
            appendStepSummary: false,
          }),
        );
  validation = formatValidation(results);

  await deps.writeArtifacts({
    runState: {
      ...runState,
      status: results.every((result) => result.status === "passed") ? "validated" : "blocked",
    },
    diagnosis,
    actionsTaken,
    blocker,
    checkResults: results,
  });

  if (!results.every((result) => result.status === "passed")) {
    blocker = "Local required checks still fail after the Codex repair attempt.";
    await syncWorkpad("blocked");
    await deps.updateRemediationCheckRun(remediationCheckRunId, {
      status: "completed",
      conclusion: "failure",
      output: {
        title: "Codex remediation failed local validation",
        summary: blocker,
      },
    });
    return { status: "blocked", blocker, validation };
  }

  const pushResult = await deps.commitAndPush({
    workspacePath: workspace.workspacePath,
    headRef: pr.head.ref,
    commitMessage: `fix pr #${pr.number} required checks`,
  });

  if (!pushResult.committed) {
    blocker = "Codex did not produce a pushable change after diagnosis.";
    await syncWorkpad("blocked");
    await deps.updateRemediationCheckRun(remediationCheckRunId, {
      status: "completed",
      conclusion: "failure",
      output: {
        title: "Codex remediation produced no changes",
        summary: blocker,
      },
    });
    return { status: "blocked", blocker, validation };
  }

  actionsTaken.push(
    `Pushed remediation commit \`${pushResult.commitSha.slice(0, 7)}\` to \`${pr.head.ref}\`.`,
  );
  await syncWorkpad("awaiting-ci");
  await deps.updateRemediationCheckRun(remediationCheckRunId, {
    status: "in_progress",
    output: {
      title: "Waiting for required checks",
      summary: `Pushed remediation commit ${pushResult.commitSha.slice(
        0,
        7,
      )}; waiting for delivery-gate and observability-contract.`,
    },
  });
  await deps.writeArtifacts({
    runState: {
      ...runState,
      status: "awaiting-ci",
    },
    diagnosis,
    actionsTaken,
    blocker,
    checkResults: results,
  });

  return {
    status: "awaiting-ci",
    validation,
    commitSha: pushResult.commitSha,
  };
};

export const buildCodexExecArgs = ({ workspacePath, runId, workflow, finalMessagePath }) => {
  const args = [
    "--ask-for-approval",
    workflow.codex.approvalPolicy,
    ...workflow.codex.command.slice(1),
    "--cd",
    workspacePath,
    "--model",
    workflow.codex.model,
    "--sandbox",
    workflow.codex.sandbox,
    "--output-last-message",
    finalMessagePath,
    ...workflow.codex.extraArgs,
  ];

  for (const configValue of workflow.codex.config) {
    args.push("--config", configValue);
  }

  return args;
};

export const runCodexRepair = ({ workspacePath, prompt, runId, workflow }) => {
  const symphonyDir = path.join(workspacePath, ".symphony");
  fs.mkdirSync(symphonyDir, { recursive: true });
  const finalMessagePath = path.join(symphonyDir, `${runId}-codex-final.txt`);
  const codexLogPath = path.join(symphonyDir, `${runId}-codex.log`);
  const args = buildCodexExecArgs({
    workspacePath,
    runId,
    workflow,
    finalMessagePath,
  });

  const result = spawnSync(workflow.codex.command[0], args, {
    cwd: workspacePath,
    input: prompt,
    encoding: "utf8",
    env: process.env,
  });

  fs.writeFileSync(codexLogPath, `${result.stdout ?? ""}${result.stderr ?? ""}`);

  return {
    exitCode: result.status ?? 1,
    finalMessage: fs.existsSync(finalMessagePath)
      ? fs.readFileSync(finalMessagePath, "utf8").trim()
      : "",
    logPath: codexLogPath,
  };
};
