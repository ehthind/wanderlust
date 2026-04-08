import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = fileURLToPath(new URL("../../", import.meta.url));
export const codeRoot = path.resolve(repoRoot, "..");
export const vercelGlobalConfigDir = path.join(repoRoot, ".vercel-agent", "global");
export const vercelCacheDir = path.join(repoRoot, ".vercel-agent", "cache");
export const vercelBin = path.join(repoRoot, "node_modules", ".bin", "vercel");
export const defaultVercelProjectName = process.env.VERCEL_PROJECT_NAME ?? "wanderlust-web";
export const defaultVercelScope = process.env.VERCEL_SCOPE ?? "";

export const ensureVercelLocalState = () => {
  fs.mkdirSync(vercelGlobalConfigDir, { recursive: true });
  fs.mkdirSync(vercelCacheDir, { recursive: true });
};

export const buildVercelArgs = (args, { scope = defaultVercelScope } = {}) => [
  "--global-config",
  vercelGlobalConfigDir,
  ...(scope ? ["--scope", scope] : []),
  ...args,
];

export const runVercelSync = (
  args,
  { cwd = repoRoot, capture = false, scope = defaultVercelScope, env = process.env } = {},
) => {
  ensureVercelLocalState();

  return spawnSync(vercelBin, buildVercelArgs(args, { scope }), {
    cwd,
    encoding: "utf8",
    stdio: capture ? ["inherit", "pipe", "pipe"] : "inherit",
    env: {
      ...env,
      XDG_CACHE_HOME: env.XDG_CACHE_HOME ?? vercelCacheDir,
      VERCEL_DISABLE_AUTO_UPDATE: env.VERCEL_DISABLE_AUTO_UPDATE ?? "1",
    },
  });
};
