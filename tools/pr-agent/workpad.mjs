const ensureList = (values) => (Array.isArray(values) ? values : []);

export const renderBulletList = (values, emptyText) => {
  const items = ensureList(values).filter(Boolean);
  if (items.length === 0) {
    return `- ${emptyText}`;
  }

  return items.map((value) => `- ${value}`).join("\n");
};

export const findExistingWorkpadComment = (comments, marker) =>
  [...comments].reverse().find((comment) => comment.body?.includes(marker)) ?? null;

export const buildRemediationBody = ({
  maxAttempts,
  pr,
  runState,
  failedChecks = [],
  diagnosis = [],
  actionsTaken = [],
  validation = [],
  blocker = null,
  updatedAt = new Date().toISOString(),
}) =>
  [
    `status: ${runState.status}`,
    `run: \`${runState.runId ?? "pending"}\``,
    `attempt: ${runState.attemptCount}/${maxAttempts}`,
    `head_sha: \`${pr.head.sha}\``,
    `updated_at: ${updatedAt}`,
    "",
    "#### Failing Checks",
    renderBulletList(
      failedChecks.map((checkName) => `\`${checkName}\``),
      "none",
    ),
    "",
    "#### Diagnosis",
    renderBulletList(diagnosis, "waiting for diagnosis"),
    "",
    "#### Actions Taken",
    renderBulletList(actionsTaken, "no changes yet"),
    "",
    "#### Latest Validation",
    renderBulletList(validation, "validation pending"),
    "",
    "#### Blocker",
    blocker ? blocker : "None right now",
    "",
  ].join("\n");

export const buildWorkpadBody = ({
  workflow,
  pr,
  runState,
  failedChecks = [],
  diagnosis = [],
  actionsTaken = [],
  validation = [],
  blocker = null,
  updatedAt = new Date().toISOString(),
}) =>
  [
    workflow.workpad.marker,
    workflow.workpad.heading,
    "",
    buildRemediationBody({
      maxAttempts: workflow.limits.maxAttempts,
      pr,
      runState,
      failedChecks,
      diagnosis,
      actionsTaken,
      validation,
      blocker,
      updatedAt,
    }),
  ].join("\n");
