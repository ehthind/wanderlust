import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { downloadSecretsSync } from "../doppler/secrets.mjs";
import { codeRoot, repoRoot, runVercelSync } from "./_shared.mjs";

const [, , target] = process.argv;

const targetToDopplerConfig = {
  development: "dev",
  preview: "dev",
  production: "prd",
};

const targetToEntries = {
  development: [
    ["APP_NAME", "Wanderlust", false],
    ["SERVICE_NAME", "wanderlust", false],
    ["WANDERLUST_SECRETS_MODE", "env", false],
  ],
  preview: [
    ["APP_NAME", "Wanderlust", false],
    ["SERVICE_NAME", "wanderlust", false],
    ["WANDERLUST_SECRETS_MODE", "env", false],
  ],
  production: [
    ["APP_NAME", "Wanderlust", false],
    ["SERVICE_NAME", "wanderlust", false],
    ["WANDERLUST_SECRETS_MODE", "env", false],
  ],
};

if (!target || !Object.hasOwn(targetToDopplerConfig, target)) {
  process.stderr.write("Usage: node tools/vercel/sync-env.mjs <development|preview|production>\n");
  process.exit(1);
}

const source = {
  ...process.env,
  DOPPLER_PROJECT: process.env.DOPPLER_PROJECT ?? "wanderlust",
  DOPPLER_CONFIG: targetToDopplerConfig[target],
  DOPPLER_SCOPE: process.env.DOPPLER_SCOPE ?? codeRoot,
};

const secrets = downloadSecretsSync(source);
const vercelProjectFile = path.join(repoRoot, ".vercel", "project.json");

const secretEntries = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "TEMPORAL_ADDRESS",
  "TEMPORAL_NAMESPACE",
  "OPENAI_API_KEY",
  "INTERCOM_ACCESS_TOKEN",
  "SENDGRID_API_KEY",
  "SENTRY_DSN",
  "POSTHOG_HOST",
  "POSTHOG_KEY",
]
  .map((name) => [name, secrets[name], true])
  .filter(([, value]) => typeof value === "string" && value.length > 0);

const entries = [...targetToEntries[target], ...secretEntries];

const readLinkedProjectId = () => {
  if (!fs.existsSync(vercelProjectFile)) {
    throw new Error("Missing .vercel/project.json. Run `corepack pnpm vercel:link` first.");
  }

  const parsed = JSON.parse(fs.readFileSync(vercelProjectFile, "utf8"));
  if (typeof parsed.projectId !== "string" || parsed.projectId.length === 0) {
    throw new Error("Missing projectId in .vercel/project.json.");
  }

  return parsed.projectId;
};

const parseApiJson = (result, fallbackMessage) => {
  const payload = result.stdout?.trim();
  if (!payload) {
    throw new Error(result.stderr?.trim() || fallbackMessage);
  }

  try {
    return JSON.parse(payload);
  } catch {
    throw new Error(payload || result.stderr?.trim() || fallbackMessage);
  }
};

const syncPreviewEntry = (projectId, name, value) => {
  const listResult = runVercelSync(
    ["api", `/v10/projects/${projectId}/env?target=preview`, "--raw"],
    {
      capture: true,
    },
  );

  if (listResult.status !== 0) {
    throw new Error(
      listResult.stdout?.trim() || listResult.stderr?.trim() || "Failed to list preview envs",
    );
  }

  const envs = parseApiJson(listResult, "Failed to parse preview env list").envs ?? [];
  const existing = envs.find(
    (entry) =>
      entry.key === name &&
      Array.isArray(entry.target) &&
      entry.target.includes("preview") &&
      entry.configurationId === null,
  );

  const body = existing
    ? { value, type: "encrypted", target: ["preview"] }
    : { key: name, value, type: "encrypted", target: ["preview"] };
  const tmpFile = path.join(os.tmpdir(), `wanderlust-vercel-preview-${name}.json`);

  fs.writeFileSync(tmpFile, JSON.stringify(body));

  const result = runVercelSync(
    [
      "api",
      existing ? `/v10/projects/${projectId}/env/${existing.id}` : `/v10/projects/${projectId}/env`,
      "-X",
      existing ? "PATCH" : "POST",
      "--input",
      tmpFile,
      "--raw",
    ],
    { capture: true },
  );

  fs.rmSync(tmpFile, { force: true });

  if (result.status !== 0) {
    throw new Error(
      result.stdout?.trim() || result.stderr?.trim() || `Failed to sync ${name} (preview)`,
    );
  }
};

const previewProjectId = target === "preview" ? readLinkedProjectId() : null;

for (const [name, value, sensitive] of entries) {
  if (target === "preview") {
    syncPreviewEntry(previewProjectId, name, value);
    process.stdout.write(`synced ${name} (${target})\n`);
    continue;
  }

  const useSensitiveFlag = sensitive && target !== "development";
  const updateResult = runVercelSync(
    [
      "env",
      "update",
      name,
      target,
      "--yes",
      "--value",
      value,
      ...(useSensitiveFlag ? ["--sensitive"] : []),
    ],
    { capture: true },
  );

  if (updateResult.status === 0) {
    process.stdout.write(`updated ${name} (${target})\n`);
    continue;
  }

  const addResult = runVercelSync(
    [
      "env",
      "add",
      name,
      target,
      "--yes",
      "--value",
      value,
      ...(useSensitiveFlag ? ["--sensitive"] : []),
    ],
    { capture: true },
  );

  if (addResult.status !== 0) {
    const error =
      addResult.stdout?.trim() ||
      addResult.stderr?.trim() ||
      updateResult.stdout?.trim() ||
      updateResult.stderr?.trim() ||
      `Failed to sync ${name}`;
    process.stderr.write(`${error}\n`);
    process.exit(addResult.status ?? 1);
  }

  process.stdout.write(`added ${name} (${target})\n`);
}
