import { spawnSync } from "node:child_process";

export const resolveShell = (env = process.env) => {
  if (process.platform === "win32") {
    return env.ComSpec?.trim() || "cmd.exe";
  }

  return env.SHELL?.trim() || "/bin/bash";
};

export const resolveShellArgs = (command) =>
  process.platform === "win32" ? ["/d", "/s", "/c", command] : ["-lc", command];

export const getSpawnErrorMessage = (result) => {
  if (result.error instanceof Error) {
    return `${result.error.name}: ${result.error.message}`;
  }

  return result.error ? String(result.error) : "";
};

export const spawnShellSync = (command, options = {}) =>
  spawnSync(resolveShell(options.env), resolveShellArgs(command), options);
