import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const DEFAULT_API_BASE_URL = "https://api.github.com";

const base64UrlEncode = (value) =>
  Buffer.from(value)
    .toString("base64")
    .replaceAll("=", "")
    .replaceAll("+", "-")
    .replaceAll("/", "_");

const normalizePrivateKey = (privateKey) => privateKey.replaceAll("\\n", "\n");

const buildApiUrl = (apiBaseUrl, pathname) => new URL(pathname, apiBaseUrl).toString();

const parseResponseBody = async (response) => {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export const buildGitHubAppJwt = ({ appId, privateKey, nowMs = Date.now() }) => {
  const issuedAt = Math.floor(nowMs / 1000) - 60;
  const expiresAt = issuedAt + 9 * 60;
  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      iat: issuedAt,
      exp: expiresAt,
      iss: appId,
    }),
  );
  const signingInput = `${header}.${payload}`;
  const signature = crypto
    .sign("RSA-SHA256", Buffer.from(signingInput), normalizePrivateKey(privateKey))
    .toString("base64")
    .replaceAll("=", "")
    .replaceAll("+", "-")
    .replaceAll("/", "_");

  return `${signingInput}.${signature}`;
};

export const verifyGitHubWebhookSignature = ({ secret, payload, signatureHeader }) => {
  if (!signatureHeader?.startsWith("sha256=")) {
    return false;
  }

  const expectedDigest = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const actualDigest = signatureHeader.slice("sha256=".length);

  return crypto.timingSafeEqual(Buffer.from(expectedDigest), Buffer.from(actualDigest));
};

export const extractActionsRunIdFromCheckRun = (checkRun) => {
  const detailsUrl = checkRun.details_url ?? "";
  const match = detailsUrl.match(/\/actions\/runs\/(\d+)/);
  return match ? Number(match[1]) : null;
};

export const createGitHubAppClient = ({
  owner,
  repo,
  installationId,
  token,
  appId,
  privateKey,
  apiBaseUrl = DEFAULT_API_BASE_URL,
}) => {
  let cachedToken = token ?? null;
  let cachedTokenExpiresAt = token ? Date.now() + 30 * 60 * 1000 : 0;

  const getAuthToken = async () => {
    if (cachedToken && Date.now() < cachedTokenExpiresAt - 60_000) {
      return cachedToken;
    }

    if (!installationId || !appId || !privateKey) {
      throw new Error(
        "Missing GitHub App credentials. Provide GITHUB_PR_AGENT_TOKEN or app credentials.",
      );
    }

    const appJwt = buildGitHubAppJwt({ appId, privateKey });
    const tokenResponse = await fetch(
      buildApiUrl(apiBaseUrl, `/app/installations/${installationId}/access_tokens`),
      {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${appJwt}`,
          "User-Agent": "wanderlust-pr-agent",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );

    const tokenBody = await parseResponseBody(tokenResponse);
    if (!tokenResponse.ok || !tokenBody?.token) {
      throw new Error(
        `Failed to create installation token (${tokenResponse.status}): ${JSON.stringify(tokenBody)}`,
      );
    }

    cachedToken = tokenBody.token;
    cachedTokenExpiresAt = tokenBody.expires_at
      ? Date.parse(tokenBody.expires_at)
      : Date.now() + 50 * 60 * 1000;
    return cachedToken;
  };

  const request = async (method, pathname, options = {}) => {
    const authToken = await getAuthToken();
    const headers = {
      Accept: options.accept ?? "application/vnd.github+json",
      Authorization: `Bearer ${authToken}`,
      "User-Agent": "wanderlust-pr-agent",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers ?? {}),
    };
    if (options.body) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(buildApiUrl(apiBaseUrl, pathname), {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      redirect: options.raw ? "follow" : "follow",
    });

    if (options.raw) {
      if (!response.ok) {
        const body = await parseResponseBody(response);
        throw new Error(
          `${method} ${pathname} failed (${response.status}): ${JSON.stringify(body)}`,
        );
      }
      return response;
    }

    const body = await parseResponseBody(response);
    if (!response.ok) {
      throw new Error(`${method} ${pathname} failed (${response.status}): ${JSON.stringify(body)}`);
    }

    return body;
  };

  return {
    owner,
    repo,
    installationId,
    getAuthToken,
    request,
    getPullRequest: (pullRequestNumber) =>
      request("GET", `/repos/${owner}/${repo}/pulls/${pullRequestNumber}`),
    listIssueComments: (issueNumber) =>
      request("GET", `/repos/${owner}/${repo}/issues/${issueNumber}/comments?per_page=100`),
    createIssueComment: (issueNumber, body) =>
      request("POST", `/repos/${owner}/${repo}/issues/${issueNumber}/comments`, { body: { body } }),
    updateIssueComment: (commentId, body) =>
      request("PATCH", `/repos/${owner}/${repo}/issues/comments/${commentId}`, { body: { body } }),
    listCheckRunsForRef: (ref) =>
      request("GET", `/repos/${owner}/${repo}/commits/${ref}/check-runs?per_page=100`),
    createCheckRun: (payload) =>
      request("POST", `/repos/${owner}/${repo}/check-runs`, { body: payload }),
    updateCheckRun: (checkRunId, payload) =>
      request("PATCH", `/repos/${owner}/${repo}/check-runs/${checkRunId}`, { body: payload }),
    rerequestCheckRun: (checkRunId) =>
      request("POST", `/repos/${owner}/${repo}/check-runs/${checkRunId}/rerequest`, { body: {} }),
    listWorkflowRunArtifacts: (runId) =>
      request("GET", `/repos/${owner}/${repo}/actions/runs/${runId}/artifacts?per_page=100`),
    getWorkflowRunJobs: (runId) =>
      request("GET", `/repos/${owner}/${repo}/actions/runs/${runId}/jobs?per_page=100`),
    downloadArtifact: async (artifactId, destinationDir) => {
      fs.mkdirSync(destinationDir, { recursive: true });

      const response = await request(
        "GET",
        `/repos/${owner}/${repo}/actions/artifacts/${artifactId}/zip`,
        {
          raw: true,
          headers: {
            Accept: "application/vnd.github+json",
          },
        },
      );

      const zipPath = path.join(destinationDir, `${artifactId}.zip`);
      const body = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(zipPath, body);

      const unzipResult = spawnSync("unzip", ["-o", zipPath, "-d", destinationDir], {
        encoding: "utf8",
      });
      if (unzipResult.status !== 0) {
        throw new Error(
          `Failed to unzip artifact ${artifactId}: ${unzipResult.stderr ?? unzipResult.stdout}`,
        );
      }

      return destinationDir;
    },
    downloadRequiredCheckArtifact: async (runId, checkName) => {
      const artifacts = await request(
        "GET",
        `/repos/${owner}/${repo}/actions/runs/${runId}/artifacts?per_page=100`,
      );
      const artifact = (artifacts.artifacts ?? []).find(
        (candidate) => candidate.name === `required-check-${checkName}`,
      );
      if (!artifact) {
        return null;
      }

      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `wanderlust-pr-agent-${checkName}-`));
      await request("GET", `/repos/${owner}/${repo}/actions/artifacts/${artifact.id}/zip`, {
        raw: true,
      }).then(async (response) => {
        const zipPath = path.join(tempDir, `${artifact.id}.zip`);
        fs.writeFileSync(zipPath, Buffer.from(await response.arrayBuffer()));
        const unzipResult = spawnSync("unzip", ["-o", zipPath, "-d", tempDir], {
          encoding: "utf8",
        });
        if (unzipResult.status !== 0) {
          throw new Error(
            `Failed to unzip required-check artifact ${artifact.name}: ${
              unzipResult.stderr ?? unzipResult.stdout
            }`,
          );
        }
      });

      return tempDir;
    },
  };
};
