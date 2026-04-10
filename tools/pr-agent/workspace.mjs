import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { getSpawnErrorMessage, spawnShellSync } from "../shared/shell.mjs";

const run = ({ command, args, cwd, env = process.env, allowFailure = false }) => {
  const result = spawnSync(command, args, {
    cwd,
    env,
    encoding: "utf8",
  });

  if (!allowFailure && result.status !== 0) {
    const errorMessage = getSpawnErrorMessage(result);
    throw new Error(
      `${command} ${args.join(" ")} failed: ${(errorMessage || result.stderr) ?? result.stdout ?? "unknown error"}`,
    );
  }

  return result;
};

const runShell = ({ command, cwd, env = process.env, allowFailure = false }) =>
  (() => {
    const result = spawnShellSync(command, {
      cwd,
      env,
      encoding: "utf8",
    });

    if (!allowFailure && result.status !== 0) {
      const errorMessage = getSpawnErrorMessage(result);
      throw new Error(
        `${command} failed: ${(errorMessage || result.stderr) ?? result.stdout ?? "unknown error"}`,
      );
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
      args: ["clone", remoteUrlWithToken(repositoryUrl, token), workspacePath],
      cwd: process.cwd(),
    });
  }

  run({
    command: "git",
    args: ["remote", "set-url", "origin", remoteUrlWithToken(repositoryUrl, token)],
    cwd: workspacePath,
  });
  run({
    command: "git",
    args: ["fetch", "origin", headRef],
    cwd: workspacePath,
  });
  run({
    command: "git",
    args: ["checkout", "-B", `codex-pr-agent/pr-${prNumber}`, `origin/${headRef}`],
    cwd: workspacePath,
  });
  run({
    command: "git",
    args: ["reset", "--hard", headSha],
    cwd: workspacePath,
  });
  run({
    command: "git",
    args: ["clean", "-fd"],
    cwd: workspacePath,
  });
  run({
    command: "git",
    args: ["config", "user.name", gitUserName],
    cwd: workspacePath,
  });
  run({
    command: "git",
    args: ["config", "user.email", gitUserEmail],
    cwd: workspacePath,
  });

  runShell({
    command: "corepack enable",
    cwd: workspacePath,
  });
  runShell({
    command: installCommand,
    cwd: workspacePath,
  });
  runShell({
    command: playwrightInstallCommand,
    cwd: workspacePath,
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
