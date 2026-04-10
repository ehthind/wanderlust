import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const service = process.env.RAILWAY_SERVICE ?? "pr-agent";
const environment = process.env.RAILWAY_ENVIRONMENT ?? "production";
const codexAuthPath = path.join(os.homedir(), ".codex", "auth.json");
const codexConfigPath = path.join(os.homedir(), ".codex", "config.toml");

const readBase64 = (filePath) =>
  fs.existsSync(filePath) ? fs.readFileSync(filePath).toString("base64") : null;

const resolveGitHubToken = () => {
  if (process.env.GITHUB_PR_AGENT_TOKEN) {
    return process.env.GITHUB_PR_AGENT_TOKEN;
  }

  return execFileSync("gh", ["auth", "token"], {
    encoding: "utf8",
    env: process.env,
  }).trim();
};

const webhookSecret =
  process.env.GITHUB_WEBHOOK_SECRET ?? crypto.randomBytes(24).toString("hex");

const entries = [
  ["NIXPACKS_APT_PKGS", "git,unzip"],
  [
    "NIXPACKS_INSTALL_CMD",
    "corepack pnpm install --frozen-lockfile && npm install -g @openai/codex@0.118.0",
  ],
  ["NIXPACKS_BUILD_CMD", "npx playwright install --with-deps chromium"],
  ["NIXPACKS_START_CMD", "node tools/pr-agent/start.mjs"],
  ["PR_AGENT_WEBHOOK_PATH", "/github/webhook"],
  ["GITHUB_PR_AGENT_TOKEN", resolveGitHubToken()],
  ["GITHUB_WEBHOOK_SECRET", webhookSecret],
  ["CODEX_AUTH_JSON_B64", readBase64(codexAuthPath)],
  ["CODEX_CONFIG_TOML_B64", readBase64(codexConfigPath)],
  ["OPENAI_API_KEY", process.env.OPENAI_API_KEY ?? null],
  ["LINEAR_API_KEY", process.env.LINEAR_API_KEY ?? null],
].filter(([, value]) => value !== undefined && value !== null && String(value).length > 0);

if (entries.length === 0) {
  process.stdout.write("No PR agent variables resolved for Railway.\n");
  process.exit(0);
}

const result = execFileSync(
  "railway",
  [
    "variable",
    "set",
    "--service",
    service,
    "--environment",
    environment,
    ...entries.map(([key, value]) => `${key}=${String(value)}`),
  ],
  {
    encoding: "utf8",
    env: process.env,
  },
);

process.stdout.write(result);
process.stdout.write(`PR agent webhook secret set for ${service} (${environment}).\n`);
