import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { getManagedSinkStatusSync } from "../doppler/secrets.mjs";

const issueIdentifierFromWorkspace = (workspaceRoot) => path.basename(workspaceRoot);

const safeGit = (args, cwd) => {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    return "";
  }

  return result.stdout.trim();
};

const hashOffset = (input) => {
  const hash = crypto.createHash("sha256").update(input).digest();
  return hash.readUInt16BE(0) % 1000;
};

export const getWorkspaceContext = (cwd = process.cwd()) => {
  const repoRoot = cwd;
  const workspaceRoot = path.dirname(repoRoot);
  const issueIdentifier =
    process.env.SYMPHONY_ISSUE_IDENTIFIER ??
    process.env.LINEAR_ISSUE_ID ??
    issueIdentifierFromWorkspace(workspaceRoot);
  const gitBranchName = safeGit(["branch", "--show-current"], repoRoot);
  const branchName = process.env.SYMPHONY_BRANCH_NAME || gitBranchName || "main";
  const runId =
    process.env.SYMPHONY_RUN_ID ??
    `${issueIdentifier}-${crypto.createHash("sha1").update(repoRoot).digest("hex").slice(0, 8)}`;
  const workspaceHash = hashOffset(issueIdentifier);

  return {
    repoRoot,
    workspaceRoot,
    symphonyDir: path.join(repoRoot, ".symphony"),
    issue: {
      identifier: issueIdentifier,
      title: process.env.SYMPHONY_ISSUE_TITLE ?? process.env.LINEAR_ISSUE_TITLE ?? "",
      state: process.env.SYMPHONY_ISSUE_STATE ?? process.env.LINEAR_ISSUE_STATE ?? "",
      url: process.env.SYMPHONY_ISSUE_URL ?? process.env.LINEAR_ISSUE_URL ?? "",
      labels: (process.env.SYMPHONY_ISSUE_LABELS ?? "")
        .split(",")
        .map((label) => label.trim())
        .filter(Boolean),
    },
    run: {
      id: runId,
      startedAt: new Date().toISOString(),
    },
    workspace: {
      name: path.basename(workspaceRoot),
      repoRoot,
      workspaceRoot,
      branchName,
      issueBranchName:
        process.env.SYMPHONY_BRANCH_NAME ??
        issueIdentifier.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      labels: {
        workspace: path.basename(workspaceRoot),
        issue: issueIdentifier,
        branch: branchName,
      },
      ports: {
        grafana: 4100 + workspaceHash,
        otlpGrpc: 4317 + workspaceHash,
        otlpHttp: 4318 + workspaceHash,
      },
    },
    managed: getManagedSinkStatusSync(process.env),
  };
};

export const ensureSymphonyDir = (ctx) => {
  fs.mkdirSync(ctx.symphonyDir, { recursive: true });
};

export const artifactPath = (ctx, fileName) => path.join(ctx.symphonyDir, fileName);

export const readArtifact = (ctx, fileName) => {
  const filePath = artifactPath(ctx, fileName);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
};

export const writeArtifact = (ctx, fileName, data) => {
  ensureSymphonyDir(ctx);
  fs.writeFileSync(artifactPath(ctx, fileName), `${JSON.stringify(data, null, 2)}\n`);
};

export const updateRunArtifact = (ctx, update) => {
  const existing = readArtifact(ctx, "run.json");
  const base = {
    issue: ctx.issue,
    workspace: ctx.workspace,
    delivery: {
      mode: "protected-pr",
      linearClaimState: "In Progress",
      linearDoneState: "Done",
      github: {
        createBranch: true,
        createDraftPr: true,
        enableAutoMerge: true,
      },
    },
    run: {
      id: ctx.run.id,
      startedAt: existing?.run?.startedAt ?? ctx.run.startedAt,
      updatedAt: new Date().toISOString(),
      stage: "initialized",
      status: "pending",
    },
  };

  const next = {
    ...base,
    ...(existing ?? {}),
    ...(update ?? {}),
    issue: {
      ...base.issue,
      ...(existing?.issue ?? {}),
      ...(update?.issue ?? {}),
    },
    workspace: {
      ...base.workspace,
      ...(existing?.workspace ?? {}),
      ...(update?.workspace ?? {}),
    },
    delivery: {
      ...base.delivery,
      ...(existing?.delivery ?? {}),
      ...(update?.delivery ?? {}),
      github: {
        ...base.delivery.github,
        ...(existing?.delivery?.github ?? {}),
        ...(update?.delivery?.github ?? {}),
      },
    },
    run: {
      ...base.run,
      ...(existing?.run ?? {}),
      ...(update?.run ?? {}),
      updatedAt: new Date().toISOString(),
    },
  };

  writeArtifact(ctx, "run.json", next);
  return next;
};

export const currentGitState = (ctx) => ({
  branchName: safeGit(["branch", "--show-current"], ctx.repoRoot) || ctx.workspace.branchName,
  commitSha: safeGit(["rev-parse", "HEAD"], ctx.repoRoot),
  dirtyPaths: safeGit(["status", "--short"], ctx.repoRoot)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean),
});

export const runCommand = (ctx, name, command) => {
  const startedAt = Date.now();
  const logFileName = `${name}.log`;
  const logPath = artifactPath(ctx, logFileName);
  const result = spawnSync("/bin/zsh", ["-lc", command], {
    cwd: ctx.repoRoot,
    encoding: "utf8",
    env: process.env,
  });

  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  fs.writeFileSync(logPath, `${stdout}${stderr}`);

  return {
    name,
    command,
    status: result.status === 0 ? "passed" : "failed",
    exitCode: result.status ?? 1,
    durationMs: Date.now() - startedAt,
    logPath,
  };
};
