import { buildRemediationBody } from "./workpad.mjs";

const DEFAULT_LINEAR_API_BASE_URL = "https://api.linear.app/graphql";
const LINEAR_ISSUE_IDENTIFIER_PATTERN = /\b([a-z][a-z0-9]*-\d+)\b/gi;
const LINEAR_ISSUE_URL_PATTERN = /linear\.app\/[^/\s]+\/issue\/([a-z][a-z0-9]*-\d+)/gi;

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const normalizeIssueIdentifier = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const match = value.trim().match(/^([a-z][a-z0-9]*)-(\d+)$/i);
  if (!match) {
    return null;
  }

  return `${match[1].toUpperCase()}-${match[2]}`;
};

const collectIssueIdentifiersFromText = (text) => {
  const values = [];
  for (const match of text.matchAll(LINEAR_ISSUE_URL_PATTERN)) {
    const normalized = normalizeIssueIdentifier(match[1]);
    if (normalized) {
      values.push(normalized);
    }
  }
  for (const match of text.matchAll(LINEAR_ISSUE_IDENTIFIER_PATTERN)) {
    const normalized = normalizeIssueIdentifier(match[1]);
    if (normalized) {
      values.push(normalized);
    }
  }

  return values;
};

export const collectLinearIssueIdentifiers = ({ pr, state }) => {
  const candidates = [
    typeof state?.linearIssueId === "string" ? state.linearIssueId.trim() : null,
    normalizeIssueIdentifier(state?.linearIssueIdentifier),
    ...collectIssueIdentifiersFromText(pr?.head?.ref ?? ""),
    ...collectIssueIdentifiersFromText(pr?.title ?? ""),
    ...collectIssueIdentifiersFromText(pr?.body ?? ""),
  ].filter(Boolean);

  return [...new Set(candidates)];
};

const parseResponseBody = async (response) => {
  const text = await response.text();
  if (!text) {
    return null;
  }

  return JSON.parse(text);
};

const issueCommentsFromResponse = (issue) => ensureArray(issue?.comments?.nodes);

export const findExistingLinearWorkpadComment = (comments, heading) =>
  [...ensureArray(comments)]
    .filter((comment) => comment.body?.includes(heading))
    .sort((left, right) =>
      String(left.updatedAt ?? "").localeCompare(String(right.updatedAt ?? "")),
    )
    .at(-1) ?? null;

const escapeForRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const upsertLinearRemediationSection = ({
  existingBody = "",
  workpadHeading,
  remediationHeading,
  remediationSection,
}) => {
  const trimmedBody = existingBody.trim();
  if (!trimmedBody) {
    return [workpadHeading, "", remediationSection, ""].join("\n");
  }

  const withHeading = trimmedBody.includes(workpadHeading)
    ? trimmedBody
    : [workpadHeading, "", trimmedBody].join("\n");
  const sectionPattern = new RegExp(
    `(^|\\n)${escapeForRegExp(remediationHeading)}\\n[\\s\\S]*?(?=\\n###\\s+|$)`,
  );
  if (sectionPattern.test(withHeading)) {
    return withHeading.replace(sectionPattern, `$1${remediationSection}`);
  }

  const confusionsIndex = withHeading.indexOf("\n### Confusions");
  if (confusionsIndex >= 0) {
    return `${withHeading.slice(0, confusionsIndex).trimEnd()}\n\n${remediationSection}${withHeading.slice(
      confusionsIndex,
    )}\n`;
  }

  return `${withHeading.trimEnd()}\n\n${remediationSection}\n`;
};

export const buildLinearRemediationSection = ({
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
    workflow.linear.workpad.remediationHeading,
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
    }).trimEnd(),
  ].join("\n");

export const createLinearClient = ({
  apiKey,
  apiBaseUrl = DEFAULT_LINEAR_API_BASE_URL,
  fetchImpl = fetch,
}) => {
  if (!apiKey) {
    throw new Error("A Linear API key is required.");
  }

  const graphql = async (query, variables = {}) => {
    const response = await fetchImpl(apiBaseUrl, {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });
    const body = await parseResponseBody(response);

    if (!response.ok || body?.errors?.length) {
      throw new Error(`Linear GraphQL request failed: ${JSON.stringify(body?.errors ?? body)}`);
    }

    return body?.data ?? null;
  };

  const getIssueByIdOrIdentifier = async (id) => {
    const data = await graphql(
      `
        query WanderlustPrAgentLinearIssue($id: String!) {
          issue(id: $id) {
            id
            identifier
            title
            comments(first: 100) {
              nodes {
                id
                body
                updatedAt
              }
            }
          }
        }
      `,
      { id },
    );
    return data?.issue ?? null;
  };

  const createComment = async (issueId, body) => {
    const data = await graphql(
      `
        mutation WanderlustPrAgentLinearCommentCreate($issueId: String!, $body: String!) {
          commentCreate(input: { issueId: $issueId, body: $body }) {
            success
          }
        }
      `,
      { issueId, body },
    );
    if (data?.commentCreate?.success !== true) {
      throw new Error(`Linear commentCreate failed for issue ${issueId}.`);
    }
    return true;
  };

  const updateComment = async (commentId, body) => {
    const data = await graphql(
      `
        mutation WanderlustPrAgentLinearCommentUpdate($commentId: String!, $body: String!) {
          commentUpdate(id: $commentId, input: { body: $body }) {
            success
          }
        }
      `,
      { commentId, body },
    );
    if (data?.commentUpdate?.success !== true) {
      throw new Error(`Linear commentUpdate failed for comment ${commentId}.`);
    }
    return true;
  };

  return {
    getIssueByIdOrIdentifier,
    createComment,
    updateComment,
  };
};

export const createLinearClientFromWorkflow = (workflow, env = process.env) => {
  if (!workflow.linear?.enabled) {
    return null;
  }

  const apiKey = env[workflow.linear.apiKeyEnv];
  if (!apiKey) {
    return null;
  }

  return createLinearClient({ apiKey });
};

export const syncLinearIssueWorkpad = async ({
  linear,
  workflow,
  pr,
  state,
  status,
  diagnosis = [],
  actionsTaken = [],
  validation = [],
  blocker = null,
  updatedAt = new Date().toISOString(),
}) => {
  if (!linear || !workflow.linear?.enabled) {
    return null;
  }

  const candidateIds = collectLinearIssueIdentifiers({ pr, state });
  if (candidateIds.length === 0) {
    return null;
  }

  let issue = null;
  for (const candidateId of candidateIds) {
    issue = await linear.getIssueByIdOrIdentifier(candidateId);
    if (issue) {
      break;
    }
  }

  if (!issue) {
    return null;
  }

  const existingComment =
    issueCommentsFromResponse(issue).find((comment) => comment.id === state.linearCommentId) ??
    findExistingLinearWorkpadComment(
      issueCommentsFromResponse(issue),
      workflow.linear.workpad.heading,
    );
  const remediationSection = buildLinearRemediationSection({
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
    updatedAt,
  });
  const commentBody = upsertLinearRemediationSection({
    existingBody: existingComment?.body ?? "",
    workpadHeading: workflow.linear.workpad.heading,
    remediationHeading: workflow.linear.workpad.remediationHeading,
    remediationSection,
  });

  if (existingComment) {
    await linear.updateComment(existingComment.id, commentBody);
  } else {
    await linear.createComment(issue.id, commentBody);
  }

  const refreshedIssue = await linear.getIssueByIdOrIdentifier(issue.id);
  const refreshedComment = findExistingLinearWorkpadComment(
    issueCommentsFromResponse(refreshedIssue),
    workflow.linear.workpad.heading,
  );

  return {
    linearIssueId: refreshedIssue?.id ?? issue.id,
    linearIssueIdentifier: refreshedIssue?.identifier ?? issue.identifier,
    linearCommentId: refreshedComment?.id ?? existingComment?.id ?? state.linearCommentId ?? null,
  };
};
