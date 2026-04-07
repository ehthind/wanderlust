import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { derivePort, derivePortBlock } from "./port-utils.mjs";

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(import.meta.dirname, "../..");
const supabaseDir = path.join(repoRoot, "supabase");
const templatePath = path.join(supabaseDir, "config.template.toml");
const configPath = path.join(supabaseDir, "config.toml");
const envPath = path.join(repoRoot, ".env.local");
const managedStart = "# BEGIN WANDERLUST SUPABASE";
const managedEnd = "# END WANDERLUST SUPABASE";

const toInteger = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const sanitizeProjectId = (value) => {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || "wanderlust";
};

export const deriveSupabaseLocalSettings = ({ cwd = repoRoot, existingEnv = process.env } = {}) => {
  const webPort = toInteger(existingEnv.WEB_PORT, derivePort({ cwd, base: 3000, spread: 400 }));
  const [apiPort, dbPort, shadowPort, studioPort, inbucketPort, poolerPort] = derivePortBlock({
    cwd,
    base: 55000,
    size: 6,
    spread: 400,
  });
  const projectId = sanitizeProjectId(path.basename(cwd));
  const siteUrl = existingEnv.WANDERLUST_SITE_URL ?? `http://127.0.0.1:${webPort}`;
  const authRedirectUrl = existingEnv.WANDERLUST_AUTH_REDIRECT_URL ?? siteUrl;

  return {
    projectId,
    webPort,
    apiPort,
    dbPort,
    shadowPort,
    studioPort,
    inbucketPort,
    poolerPort,
    siteUrl,
    authRedirectUrl,
    supabaseUrl: existingEnv.SUPABASE_URL ?? `http://127.0.0.1:${apiPort}`,
    supabaseAnonKey: existingEnv.SUPABASE_ANON_KEY ?? "local-anon-key",
    supabaseServiceRoleKey: existingEnv.SUPABASE_SERVICE_ROLE_KEY ?? "local-service-role-key",
    supabaseDbUrl:
      existingEnv.SUPABASE_DB_URL ?? `postgresql://postgres:postgres@127.0.0.1:${dbPort}/postgres`,
    supabaseStudioUrl: existingEnv.SUPABASE_STUDIO_URL ?? `http://127.0.0.1:${studioPort}`,
    supabaseInbucketUrl: existingEnv.SUPABASE_INBUCKET_URL ?? `http://127.0.0.1:${inbucketPort}`,
    supabaseJwtSecret: existingEnv.SUPABASE_JWT_SECRET ?? "",
  };
};

export const renderSupabaseTemplate = (template, settings) =>
  template
    .replaceAll("{{SUPABASE_PROJECT_ID}}", settings.projectId)
    .replaceAll("{{SUPABASE_API_PORT}}", String(settings.apiPort))
    .replaceAll("{{SUPABASE_DB_PORT}}", String(settings.dbPort))
    .replaceAll("{{SUPABASE_DB_SHADOW_PORT}}", String(settings.shadowPort))
    .replaceAll("{{SUPABASE_STUDIO_PORT}}", String(settings.studioPort))
    .replaceAll("{{SUPABASE_INBUCKET_PORT}}", String(settings.inbucketPort))
    .replaceAll("{{SUPABASE_POOLER_PORT}}", String(settings.poolerPort))
    .replaceAll("{{WANDERLUST_SITE_URL}}", settings.siteUrl)
    .replaceAll("{{WANDERLUST_AUTH_REDIRECT_URL}}", settings.authRedirectUrl);

export const formatManagedEnvBlock = (settings) => {
  const lines = [
    managedStart,
    `WEB_PORT=${settings.webPort}`,
    `WANDERLUST_SITE_URL=${settings.siteUrl}`,
    `WANDERLUST_AUTH_REDIRECT_URL=${settings.authRedirectUrl}`,
    `SUPABASE_PROJECT_ID=${settings.projectId}`,
    `SUPABASE_API_PORT=${settings.apiPort}`,
    `SUPABASE_DB_PORT=${settings.dbPort}`,
    `SUPABASE_DB_SHADOW_PORT=${settings.shadowPort}`,
    `SUPABASE_POOLER_PORT=${settings.poolerPort}`,
    `SUPABASE_STUDIO_PORT=${settings.studioPort}`,
    `SUPABASE_INBUCKET_PORT=${settings.inbucketPort}`,
    `SUPABASE_URL=${settings.supabaseUrl}`,
    `SUPABASE_DB_URL=${settings.supabaseDbUrl}`,
    `SUPABASE_STUDIO_URL=${settings.supabaseStudioUrl}`,
    `SUPABASE_INBUCKET_URL=${settings.supabaseInbucketUrl}`,
    `SUPABASE_ANON_KEY=${settings.supabaseAnonKey}`,
    `SUPABASE_SERVICE_ROLE_KEY=${settings.supabaseServiceRoleKey}`,
  ];

  if (settings.supabaseJwtSecret) {
    lines.push(`SUPABASE_JWT_SECRET=${settings.supabaseJwtSecret}`);
  }

  lines.push(managedEnd);

  return lines.join("\n");
};

export const upsertManagedBlock = (content, managedBlock) => {
  const blockPattern = new RegExp(
    `${escapeRegExp(managedStart)}[\\s\\S]*?${escapeRegExp(managedEnd)}\\n?`,
    "m",
  );

  if (blockPattern.test(content)) {
    return content.replace(blockPattern, `${managedBlock}\n`);
  }

  const trimmed = content.trimEnd();
  if (!trimmed) {
    return `${managedBlock}\n`;
  }

  return `${trimmed}\n\n${managedBlock}\n`;
};

export const parseStatusEnv = (output) => {
  const parsed = {};

  for (const rawLine of output.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    const separator = line.indexOf("=");
    if (separator === -1) {
      continue;
    }

    parsed[line.slice(0, separator)] = line.slice(separator + 1);
  }

  return parsed;
};

const resolveSupabaseBinary = () => {
  const packageJsonPath = require.resolve("supabase/package.json", { paths: [repoRoot] });
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const binRelative = packageJson.bin?.supabase;
  const binPath = path.join(path.dirname(packageJsonPath), binRelative ?? "");

  if (!binRelative || !fs.existsSync(binPath)) {
    throw new Error(
      "Supabase CLI binary is missing. Run `corepack pnpm install` to restore the pinned local toolchain.",
    );
  }

  return binPath;
};

const writeGeneratedFiles = (settings) => {
  fs.mkdirSync(supabaseDir, { recursive: true });

  const template = fs.readFileSync(templatePath, "utf8");
  fs.writeFileSync(configPath, renderSupabaseTemplate(template, settings), "utf8");

  const existingEnv = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  fs.writeFileSync(
    envPath,
    upsertManagedBlock(existingEnv, formatManagedEnvBlock(settings)),
    "utf8",
  );
};

const runSupabase = (args, { capture = false } = {}) => {
  const binPath = resolveSupabaseBinary();

  return spawnSync(binPath, args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: capture ? ["inherit", "pipe", "pipe"] : "inherit",
  });
};

export const formatSupabaseRuntimeFailure = ({ stdout = "", stderr = "" } = {}) => {
  const lines = [stderr, stdout]
    .flatMap((value) => value.split(/\r?\n/))
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return "";
  }

  const daemonUnavailable = lines
    .map((line) => line.match(/Cannot connect to the Docker daemon.*$/i)?.[0] ?? "")
    .find(Boolean);
  const dockerDesktopHint = lines.find((line) =>
    /Docker Desktop is a prerequisite/i.test(line),
  );

  if (daemonUnavailable || dockerDesktopHint) {
    return [
      "Docker is required for Supabase local runtime commands and does not appear to be ready.",
      daemonUnavailable,
      dockerDesktopHint,
    ]
      .filter(Boolean)
      .join(" ");
  }

  return lines.join("\n");
};

const writeSupabaseFailure = (result) => {
  const message = formatSupabaseRuntimeFailure(result);

  if (!message) {
    return;
  }

  process.stderr.write(`${message}\n`);
};

const syncStatusIntoEnv = (settings) => {
  const result = runSupabase(["status", "-o", "env"], { capture: true });
  if (result.status !== 0) {
    writeSupabaseFailure(result);
    process.exitCode = result.status ?? 1;
    return;
  }

  const statusEnv = parseStatusEnv(result.stdout ?? "");
  const syncedSettings = {
    ...settings,
    supabaseUrl: statusEnv.API_URL ?? settings.supabaseUrl,
    supabaseDbUrl: statusEnv.DB_URL ?? settings.supabaseDbUrl,
    supabaseStudioUrl: statusEnv.STUDIO_URL ?? settings.supabaseStudioUrl,
    supabaseInbucketUrl: statusEnv.INBUCKET_URL ?? settings.supabaseInbucketUrl,
    supabaseAnonKey: statusEnv.ANON_KEY ?? settings.supabaseAnonKey,
    supabaseServiceRoleKey: statusEnv.SERVICE_ROLE_KEY ?? settings.supabaseServiceRoleKey,
    supabaseJwtSecret: statusEnv.JWT_SECRET ?? settings.supabaseJwtSecret,
  };

  writeGeneratedFiles(syncedSettings);
  process.stdout.write(`synced Supabase runtime env to ${path.relative(repoRoot, envPath)}\n`);
};

const printPreparedSummary = (settings) => {
  process.stdout.write(
    `${JSON.stringify(
      {
        projectId: settings.projectId,
        files: {
          config: path.relative(repoRoot, configPath),
          env: path.relative(repoRoot, envPath),
        },
        ports: {
          web: settings.webPort,
          api: settings.apiPort,
          db: settings.dbPort,
          shadowDb: settings.shadowPort,
          studio: settings.studioPort,
          inbucket: settings.inbucketPort,
          pooler: settings.poolerPort,
        },
      },
      null,
      2,
    )}\n`,
  );
};

const main = () => {
  const command = process.argv[2] ?? "prepare";
  const passthroughArgs = process.argv.slice(3);
  const settings = deriveSupabaseLocalSettings();

  writeGeneratedFiles(settings);

  if (command === "prepare") {
    printPreparedSummary(settings);
    return;
  }

  if (command === "env") {
    syncStatusIntoEnv(settings);
    return;
  }

  if (command === "start" || command === "stop" || command === "status") {
    const result = runSupabase([command, ...passthroughArgs]);
    if (result.status !== 0) {
      process.exitCode = result.status ?? 1;
      return;
    }

    if (command === "start" || command === "status") {
      syncStatusIntoEnv(settings);
    }
    return;
  }

  process.stderr.write("Unknown command. Use one of: prepare, start, status, stop, env.\n");
  process.exitCode = 1;
};

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main();
}
