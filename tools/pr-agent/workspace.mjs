import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { getSpawnErrorMessage, spawnShellSync } from "../shared/shell.mjs";

const DEFAULT_TIMEOUTS_MS = Object.freeze({
  git: 90_000,
  shell: 15 * 60_000,
  install: 10 * 60_000,
  playwright: 5 * 60_000,
});

const formatFailure = ({ command, args = [], result }) => {
  const errorMessage = getSpawnErrorMessage(result);
  const signal = result.signal ? ` signal=${result.signal}` : "";
  const exitCode = Number.isInteger(result.status) ? ` exit=${result.status}` : "";
  return `${command}${args.length ? ` ${args.join(" ")}` : ""} failed:${exitCode}${signal}: ${
    (errorMessage || result.stderr) ?? result.stdout ?? "unknown error"
  }`;
};

const run = ({
  command,
  args,
  cwd,
  env = process.env,
  allowFailure = false,
  timeoutMs = DEFAULT_TIMEOUTS_MS.git,
  label = `${command} ${args.join(" ")}`,
  onProgress = null,
}) => {
  onProgress?.(label);
  process.stderr.write(`[pr-agent] ${label}\n`);
  const result = spawnSync(command, args, {
    cwd,
    env,
    encoding: "utf8",
    timeout: timeoutMs,
  });

  if (!allowFailure && result.status !== 0) {
    throw new Error(formatFailure({ command, args, result }));
  }

  return result;
};

const runShell = ({
  command,
  cwd,
  env = process.env,
  allowFailure = false,
  timeoutMs = DEFAULT_TIMEOUTS_MS.shell,
  label = command,
  onProgress = null,
}) =>
  (() => {
    onProgress?.(label);
    process.stderr.write(`[pr-agent] ${label}\n`);
    const result = spawnShellSync(command, {
      cwd,
      env,
      encoding: "utf8",
      timeout: timeoutMs,
    });

    if (!allowFailure && result.status !== 0) {
      throw new Error(formatFailure({ command, result }));
    }

    return result;
  })();

const remoteUrlWithToken = (repositoryUrl, token) => {
  if (!token || !repositoryUrl.startsWith("https://")) {
    return repositoryUrl;
  }

  const parsed = new URL(repositoryUrl);
  parsed.username = "x-access-token";
  parsed.password = token;
  return parsed.toString();
};

export const getPrWorkspacePath = ({ workspaceRoot, owner, repo, prNumber }) =>
  path.join(workspaceRoot, `${owner}__${repo}`, `pr-${prNumber}`);

export const preparePrWorkspace = ({
  workspaceRoot,
  repositoryUrl,
  owner,
  repo,
  prNumber,
  headRef,
  headSha,
  token,
  installCommand,
  playwrightInstallCommand,
  onProgress = null,
  gitUserName = "Wanderlust Codex CI",
  gitUserEmail = "codex-ci@wanderlust.local",
}) => {
  const workspacePath = getPrWorkspacePath({
    workspaceRoot,
    owner,
    repo,
    prNumber,
  });
  fs.mkdirSync(path.dirname(workspacePath), { recursive: true });

  if (!fs.existsSync(path.join(workspacePath, ".git"))) {
    run({
      command: "git",
      args: ["clone", repositoryUrl, workspacePath],
      cwd: process.cwd(),
      label: `clone repository into ${workspacePath}`,
      onProgress,
    });
  }

  run({
    command: "git",
    args: ["remote", "set-url", "origin", remoteUrlWithToken(repositoryUrl, token)],
    cwd: workspacePath,
    label: "set authenticated origin remote",
    onProgress,
  });
  run({
    command: "git",
    args: ["fetch", "origin", headRef],
    cwd: workspacePath,
    label: `fetch origin/${headRef}`,
    onProgress,
  });
  run({
    command: "git",
    args: ["checkout", "-B", `codex-pr-agent/pr-${prNumber}`, `origin/${headRef}`],
    cwd: workspacePath,
    label: `checkout codex-pr-agent/pr-${prNumber}`,
    onProgress,
  });
  run({
    command: "git",
    args: ["reset", "--hard", headSha],
    cwd: workspacePath,
    label: `reset workspace to ${headSha.slice(0, 7)}`,
    onProgress,
  });
  run({
    command: "git",
    args: ["clean", "-fd"],
    cwd: workspacePath,
    label: "clean workspace",
    onProgress,
  });
  run({
    command: "git",
    args: ["config", "user.name", gitUserName],
    cwd: workspacePath,
    label: "configure git user.name",
    onProgress,
  });
  run({
    command: "git",
    args: ["config", "user.email", gitUserEmail],
    cwd: workspacePath,
    label: "configure git user.email",
    onProgress,
  });

  runShell({
    command: installCommand,
    cwd: workspacePath,
    timeoutMs: DEFAULT_TIMEOUTS_MS.install,
    label: "install workspace dependencies",
    onProgress,
  });
  runShell({
    command: playwrightInstallCommand,
    cwd: workspacePath,
    timeoutMs: DEFAULT_TIMEOUTS_MS.playwright,
    label: "ensure Playwright browsers are available",
    onProgress,
  });

  return { workspacePath };
};

export const getWorkspaceStatus = (workspacePath) => {
  const result = run({
    command: "git",
    args: ["status", "--short"],
    cwd: workspacePath,
    allowFailure: true,
  });

  return (result.stdout ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
};

export const commitAndPushChanges = ({ workspacePath, headRef, commitMessage }) => {
  const statusLines = getWorkspaceStatus(workspacePath);
  if (statusLines.length === 0) {
    return {
      committed: false,
      commitSha: null,
      statusLines,
    };
  }

  run({
    command: "git",
    args: ["add", "-A"],
    cwd: workspacePath,
  });
  run({
    command: "git",
    args: ["commit", "-m", commitMessage],
    cwd: workspacePath,
  });
  run({
    command: "git",
    args: ["push", "origin", `HEAD:${headRef}`],
    cwd: workspacePath,
  });

  const commitSha = run({
    command: "git",
    args: ["rev-parse", "HEAD"],
    cwd: workspacePath,
  }).stdout.trim();

  return {
    committed: true,
    commitSha,
    statusLines,
  };
};
