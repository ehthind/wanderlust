#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { downloadSecretsSync } from "../doppler/secrets.mjs";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const envFiles = [".env", ".env.local"];

const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));
const recommendedNodeVersion = fs.readFileSync(path.join(repoRoot, ".node-version"), "utf8").trim();
const packageManager = String(packageJson.packageManager ?? "");
const expectedPnpmVersion = packageManager.startsWith("pnpm@")
  ? packageManager.slice("pnpm@".length)
  : null;
const defaultSymphonyRoot =
  process.env.SYMPHONY_UPSTREAM_ROOT ??
  path.join(process.env.HOME ?? "~", "code", "symphony", "elixir");

const parseEnvFile = (content) => {
  const parsed = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    parsed[key] = value;
  }

  return parsed;
};

const loadLocalEnv = () => {
  const merged = {};

  for (const relativePath of envFiles) {
    const absolutePath = path.join(repoRoot, relativePath);
    if (!fs.existsSync(absolutePath)) {
      continue;
    }

    Object.assign(merged, parseEnvFile(fs.readFileSync(absolutePath, "utf8")));
  }

  return { ...merged, ...process.env };
};

const mergedEnv = loadLocalEnv();

const getSecretsMode = (source) => {
  if (source.WANDERLUST_SECRETS_MODE === "doppler" || source.WANDERLUST_SECRETS_MODE === "env") {
    return source.WANDERLUST_SECRETS_MODE;
  }

  return source.NODE_ENV === "test" ? "env" : "doppler";
};

const run = (command, args) =>
  spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe",
    env: process.env,
  });

const summarize = (value) => value.replace(/\s+/g, " ").trim();

const checks = [];

const addCheck = ({ section, label, status, detail, required = false }) => {
  checks.push({ section, label, status, detail, required });
};

const addCommandCheck = ({
  section,
  label,
  command,
  args,
  required = false,
  okDetail = null,
  failDetail,
  expect = null,
}) => {
  const result = run(command, args);

  if (result.status === 0) {
    const output = summarize(result.stdout || result.stderr || "");
    addCheck({
      section,
      label,
      status: "ok",
      detail: okDetail ?? output ?? `${command} ${args.join(" ")}`,
      required,
    });

    if (expect && !expect(output)) {
      addCheck({
        section,
        label: `${label} version`,
        status: required ? "fail" : "warn",
        detail: output,
        required,
      });
    }

    return true;
  }

  addCheck({
    section,
    label,
    status: required ? "fail" : "warn",
    detail: failDetail ?? summarize(result.stderr || result.stdout || `${command} failed`),
    required,
  });

  return false;
};

const nodeMajor = Number.parseInt(process.versions.node.split(".")[0] ?? "", 10);
const expectedNodeMajor = Number.parseInt(recommendedNodeVersion.split(".")[0] ?? "", 10);
const nodeMatches = Number.isFinite(expectedNodeMajor) ? nodeMajor === expectedNodeMajor : true;

addCheck({
  section: "Core repo",
  label: "Node.js",
  status: nodeMatches ? "ok" : "fail",
  detail: nodeMatches
    ? `using Node ${process.versions.node} from .node-version ${recommendedNodeVersion}`
    : `using Node ${process.versions.node}; install Node ${recommendedNodeVersion} to match the repo default`,
  required: true,
});

const corepackReady = addCommandCheck({
  section: "Core repo",
  label: "corepack",
  command: "corepack",
  args: ["--version"],
  required: true,
  failDetail: "corepack is unavailable. Install a recent Node release and run `corepack enable`.",
});

if (corepackReady) {
  addCommandCheck({
    section: "Core repo",
    label: "pnpm",
    command: "corepack",
    args: ["pnpm", "--version"],
    required: true,
    okDetail: expectedPnpmVersion
      ? `pnpm ${expectedPnpmVersion} requested by packageManager`
      : "pnpm is available through corepack",
    failDetail: "pnpm is unavailable through corepack. Run `corepack enable` and retry.",
    expect: expectedPnpmVersion ? (output) => output.startsWith(expectedPnpmVersion) : null,
  });
}

const nodeModulesReady =
  fs.existsSync(path.join(repoRoot, "node_modules")) &&
  fs.existsSync(path.join(repoRoot, "node_modules", ".pnpm"));

addCheck({
  section: "Core repo",
  label: "dependencies",
  status: nodeModulesReady ? "ok" : "fail",
  detail: nodeModulesReady
    ? "dependencies are installed"
    : "dependencies are missing. Run `corepack pnpm setup` or `corepack pnpm install`.",
  required: true,
});

const envLocalPath = path.join(repoRoot, ".env.local");
addCheck({
  section: "Core repo",
  label: ".env.local",
  status: fs.existsSync(envLocalPath) ? "ok" : "warn",
  detail: fs.existsSync(envLocalPath)
    ? ".env.local is present"
    : ".env.local is missing. Setup will copy .env.example and local prepare commands will manage metadata blocks.",
});

const secretsMode = getSecretsMode(mergedEnv);

if (secretsMode === "env") {
  const requiredEnvKeys = [
    "TEMPORAL_ADDRESS",
    "TEMPORAL_NAMESPACE",
    "TEMPORAL_TASK_QUEUE",
    "TEMPORAL_UI_URL",
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];
  const missingKeys = requiredEnvKeys.filter((key) => !mergedEnv[key]);

  addCheck({
    section: "Local runtime",
    label: "secrets mode",
    status: missingKeys.length === 0 ? "ok" : "fail",
    detail:
      missingKeys.length === 0
        ? "env mode is enabled and local fallback secrets are present"
        : `env mode is enabled but these keys are missing: ${missingKeys.join(", ")}`,
    required: true,
  });
} else {
  try {
    downloadSecretsSync({
      ...mergedEnv,
      DOPPLER_PROJECT: mergedEnv.DOPPLER_PROJECT ?? "wanderlust",
      DOPPLER_CONFIG: mergedEnv.DOPPLER_CONFIG ?? "local_main",
    });
    addCheck({
      section: "Local runtime",
      label: "Doppler access",
      status: "ok",
      detail: `downloaded managed secrets for ${mergedEnv.DOPPLER_PROJECT ?? "wanderlust"}/${mergedEnv.DOPPLER_CONFIG ?? "local_main"}`,
      required: true,
    });
  } catch (error) {
    addCheck({
      section: "Local runtime",
      label: "Doppler access",
      status: "fail",
      detail:
        error instanceof Error
          ? summarize(error.message)
          : "Unable to verify Doppler access for wanderlust/local_main.",
      required: true,
    });
  }
}

addCommandCheck({
  section: "Local runtime",
  label: "Temporal CLI",
  command: "temporal",
  args: ["--version"],
  required: true,
  failDetail:
    "Temporal CLI is unavailable. Install it before running `corepack pnpm dev`, because dev auto-runs `temporal:prepare`.",
});

const dockerExists = addCommandCheck({
  section: "Local runtime",
  label: "Docker CLI",
  command: "docker",
  args: ["--version"],
  failDetail:
    "Docker CLI is unavailable. Install Docker Desktop or a compatible Docker runtime for local Supabase.",
});

if (dockerExists) {
  addCommandCheck({
    section: "Local runtime",
    label: "Docker daemon",
    command: "docker",
    args: ["info"],
    failDetail:
      "Docker is installed but the daemon is not ready. `corepack pnpm supabase:start` will fail until it is running.",
  });
}

addCommandCheck({
  section: "Delivery surfaces",
  label: "gh auth",
  command: "gh",
  args: ["auth", "status"],
  failDetail:
    "GitHub CLI is unavailable or not authenticated. PR-oriented delivery commands will not work yet.",
});

addCheck({
  section: "Delivery surfaces",
  label: "Symphony upstream checkout",
  status: fs.existsSync(defaultSymphonyRoot) ? "ok" : "warn",
  detail: fs.existsSync(defaultSymphonyRoot)
    ? `found upstream checkout at ${defaultSymphonyRoot}`
    : `missing upstream checkout at ${defaultSymphonyRoot}. Required only for \`corepack pnpm symphony:setup\` and \`corepack pnpm symphony:run\`.`,
});

const groupedSections = Array.from(new Set(checks.map((check) => check.section)));
const statusLabel = {
  ok: "OK",
  warn: "WARN",
  fail: "FAIL",
};

process.stdout.write("Wanderlust environment doctor\n\n");

for (const section of groupedSections) {
  process.stdout.write(`${section}\n`);

  for (const check of checks.filter((item) => item.section === section)) {
    process.stdout.write(`[${statusLabel[check.status]}] ${check.label}: ${check.detail}\n`);
  }

  process.stdout.write("\n");
}

const requiredFailures = checks.filter((check) => check.required && check.status === "fail");

if (requiredFailures.length > 0) {
  process.stderr.write("Doctor failed: required local development checks are still missing.\n");
  process.exit(1);
}

process.stdout.write(
  "Doctor passed: core repo and default local runtime prerequisites are ready.\n",
);
