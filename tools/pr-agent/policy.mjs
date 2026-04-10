import crypto from "node:crypto";

const FAILURE_CONCLUSIONS = new Set([
  "action_required",
  "cancelled",
  "failure",
  "neutral",
  "stale",
  "startup_failure",
  "timed_out",
]);

const PENDING_STATUSES = new Set(["in_progress", "pending", "queued", "requested", "waiting"]);

const normalizeLabel = (value) => value.trim().toLowerCase();

const toLowerText = (value) => (value ?? "").toLowerCase();

export const isSameRepoPullRequest = (pr) =>
  Boolean(
    pr?.head?.repo?.full_name &&
      pr?.base?.repo?.full_name &&
      pr.head.repo.full_name === pr.base.repo.full_name,
  );

export const hasLabel = (pr, labelName) =>
  (pr.labels ?? []).some((label) => normalizeLabel(label.name ?? "") === normalizeLabel(labelName));

export const isOptedOut = (pr, workflow) => hasLabel(pr, workflow.github.optOutLabel);

const latestCheckRunTimestamp = (checkRun) =>
  checkRun.completed_at ?? checkRun.started_at ?? checkRun.created_at ?? "";

export const getLatestRequiredCheckRuns = (checkRuns, requiredCheckNames) => {
  const latestByName = new Map();

  for (const checkRun of checkRuns) {
    if (!requiredCheckNames.includes(checkRun.name)) {
      continue;
    }

    const existing = latestByName.get(checkRun.name);
    if (!existing || latestCheckRunTimestamp(checkRun) > latestCheckRunTimestamp(existing)) {
      latestByName.set(checkRun.name, checkRun);
    }
  }

  return latestByName;
};

export const getRequiredCheckStatus = ({ checkRuns, requiredCheckNames }) => {
  const latestByName = getLatestRequiredCheckRuns(checkRuns, requiredCheckNames);
  const failed = [];
  const passed = [];
  const pending = [];
  const missing = [];

  for (const checkName of requiredCheckNames) {
    const checkRun = latestByName.get(checkName);
    if (!checkRun) {
      missing.push(checkName);
      continue;
    }

    const status = toLowerText(checkRun.status);
    const conclusion = toLowerText(checkRun.conclusion);

    if (PENDING_STATUSES.has(status) || !conclusion) {
      pending.push(checkRun);
      continue;
    }

    if (FAILURE_CONCLUSIONS.has(conclusion)) {
      failed.push(checkRun);
      continue;
    }

    passed.push(checkRun);
  }

  return {
    failed,
    passed,
    pending,
    missing,
    latestByName,
  };
};

export const computeFailureFingerprint = ({ failedCheckRuns, excerpts = [] }) => {
  const fingerprint = crypto.createHash("sha256");
  fingerprint.update(
    JSON.stringify({
      failedChecks: failedCheckRuns.map((checkRun) => ({
        name: checkRun.name,
        conclusion: checkRun.conclusion,
        summary: checkRun.output?.summary ?? "",
      })),
      excerpts,
    }),
  );

  return fingerprint.digest("hex").slice(0, 16);
};

export const registerFailureFingerprint = ({ state, fingerprint, maxAttempts }) => {
  const fingerprintCounts = {
    ...(state.fingerprintCounts ?? {}),
  };
  const attemptCount = (fingerprintCounts[fingerprint] ?? 0) + 1;
  fingerprintCounts[fingerprint] = attemptCount;

  return {
    nextState: {
      ...state,
      attemptCount,
      fingerprintCounts,
      lastFailureFingerprint: fingerprint,
    },
    attemptCount,
    exhausted: attemptCount > maxAttempts,
  };
};

const textMatchesAnyPattern = (text, patterns) =>
  patterns.find((pattern) => text.includes(pattern.toLowerCase())) ?? null;

export const classifyFailure = ({ failedCheckRuns, excerpts = [], workflow }) => {
  const haystack = [
    ...failedCheckRuns.map((checkRun) => checkRun.output?.summary ?? ""),
    ...failedCheckRuns.map((checkRun) => checkRun.output?.text ?? ""),
    ...excerpts,
  ]
    .join("\n")
    .toLowerCase();

  const manualPattern = textMatchesAnyPattern(haystack, workflow.checks.manualPatterns);
  if (manualPattern) {
    return {
      kind: "manual",
      reason: `Matched manual-only failure pattern: ${manualPattern}`,
    };
  }

  const rerunPattern = textMatchesAnyPattern(haystack, workflow.checks.rerunOnlyPatterns);
  const rerunOnlyConclusions = failedCheckRuns.every((checkRun) =>
    ["cancelled", "stale", "timed_out"].includes(toLowerText(checkRun.conclusion)),
  );

  if (rerunPattern || rerunOnlyConclusions) {
    return {
      kind: "rerun-only",
      reason: rerunPattern
        ? `Matched retryable failure pattern: ${rerunPattern}`
        : "Only retryable check conclusions were detected.",
    };
  }

  return {
    kind: "repairable",
    reason: "The failed required checks appear to be repo-local and repairable.",
  };
};

export const parseIssueCommentCommand = (body) => {
  const match = body.match(/@codex\s+(retry|stop)\b/i);
  return match ? match[1].toLowerCase() : null;
};

export const createInitialPrState = ({ owner, repo, prNumber }) => ({
  owner,
  repo,
  prNumber,
  headSha: null,
  status: "idle",
  commentId: null,
  remediationCheckRunId: null,
  linearIssueId: null,
  linearIssueIdentifier: null,
  linearCommentId: null,
  activeRunId: null,
  activeProcessId: null,
  latestFailedChecks: [],
  attemptCount: 0,
  fingerprintCounts: {},
  lastFailureFingerprint: null,
  blockedReason: null,
  updatedAt: new Date().toISOString(),
});

export const reconcilePrState = ({ workflow, pr, prState, checkRuns }) => {
  const state =
    prState ??
    createInitialPrState({
      owner: pr.base.repo.owner.login,
      repo: pr.base.repo.name,
      prNumber: pr.number,
    });

  const checkStatus = getRequiredCheckStatus({
    checkRuns,
    requiredCheckNames: workflow.checks.allowed,
  });

  const nextState = {
    ...state,
    headSha: pr.head.sha,
    latestFailedChecks: checkStatus.failed.map((checkRun) => checkRun.name),
    updatedAt: new Date().toISOString(),
  };

  const cancelActiveRun = Boolean(
    state.activeRunId && state.headSha && state.headSha !== pr.head.sha,
  );

  if (workflow.github.sameRepoOnly && !isSameRepoPullRequest(pr)) {
    return {
      nextState: {
        ...nextState,
        status: "ignored",
        blockedReason: "Pull request head repo is not the base repository.",
        activeRunId: null,
        activeProcessId: null,
      },
      cancelActiveRun,
      action: { type: "skip", reason: "same-repo-only" },
      checkStatus,
    };
  }

  if (isOptedOut(pr, workflow)) {
    return {
      nextState: {
        ...nextState,
        status: "opted-out",
        blockedReason: `PR has opt-out label ${workflow.github.optOutLabel}.`,
        activeRunId: null,
        activeProcessId: null,
      },
      cancelActiveRun,
      action: { type: "skip", reason: "opt-out-label" },
      checkStatus,
    };
  }

  if (
    checkStatus.failed.length === 0 &&
    checkStatus.pending.length === 0 &&
    checkStatus.missing.length === 0
  ) {
    return {
      nextState: {
        ...nextState,
        status: "green",
        blockedReason: null,
        activeRunId: null,
        activeProcessId: null,
      },
      cancelActiveRun,
      action: { type: "mark-green" },
      checkStatus,
    };
  }

  if (checkStatus.failed.length === 0) {
    return {
      nextState: {
        ...nextState,
        status: "waiting-ci",
        blockedReason: null,
      },
      cancelActiveRun,
      action: { type: "wait" },
      checkStatus,
    };
  }

  if (state.activeRunId && state.headSha === pr.head.sha) {
    return {
      nextState: {
        ...nextState,
        status: "repairing",
        blockedReason: null,
      },
      cancelActiveRun,
      action: { type: "noop-active-run" },
      checkStatus,
    };
  }

  const fingerprint = computeFailureFingerprint({
    failedCheckRuns: checkStatus.failed,
    excerpts: checkStatus.failed.map((checkRun) => checkRun.output?.summary ?? ""),
  });
  const fingerprintState = registerFailureFingerprint({
    state: nextState,
    fingerprint,
    maxAttempts: workflow.limits.maxAttempts,
  });

  if (fingerprintState.exhausted) {
    return {
      nextState: {
        ...fingerprintState.nextState,
        status: "blocked",
        blockedReason: `Failure fingerprint ${fingerprint} exceeded the retry budget.`,
        activeRunId: null,
        activeProcessId: null,
      },
      cancelActiveRun,
      action: { type: "block-loop", fingerprint },
      checkStatus,
    };
  }

  return {
    nextState: {
      ...fingerprintState.nextState,
      status: "repairing",
      blockedReason: null,
    },
    cancelActiveRun,
    action: {
      type: "start-repair",
      fingerprint,
      failedCheckNames: checkStatus.failed.map((checkRun) => checkRun.name),
    },
    checkStatus,
  };
};
