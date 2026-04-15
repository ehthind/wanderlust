#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const envExamplePath = path.join(repoRoot, ".env.example");
const envLocalPath = path.join(repoRoot, ".env.local");

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const skipPlaywright = args.has("--skip-playwright");
const skipDoctor = args.has("--skip-doctor");
const skipInstall = args.has("--skip-install");
const skipPrepare = args.has("--skip-prepare");

const log = (message) => {
  process.stdout.write(`${message}\n`);
};

const run = (command, commandArgs) => {
  log(`> ${command} ${commandArgs.join(" ")}`);

  if (dryRun) {
    return { status: 0 };
  }

  const result = spawnSync(command, commandArgs, {
    cwd: repoRoot,
    stdio: "inherit",
    env: process.env,
    encoding: "utf8",
  });

  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }

  return result;
};

const commandAvailable = (command, commandArgs = ["--version"]) => {
  const result = spawnSync(command, commandArgs, {
    cwd: repoRoot,
    stdio: "pipe",
    env: process.env,
    encoding: "utf8",
  });

  return result.status === 0;
};

const ensureEnvLocal = () => {
  if (fs.existsSync(envLocalPath)) {
    log(".env.local already exists");
    return;
  }

  log("Creating .env.local from .env.example");

  if (dryRun) {
    return;
  }

  fs.copyFileSync(envExamplePath, envLocalPath);
};

log("Wanderlust bootstrap");
log(
  "This installs repo-managed dependencies, prepares local metadata, and finishes with an environment doctor.\n",
);

ensureEnvLocal();

if (!skipInstall) {
  run("corepack", ["pnpm", "install"]);
} else {
  log("Skipping dependency install (--skip-install)");
}

if (!skipPlaywright) {
  run("corepack", ["pnpm", "exec", "playwright", "install", "chromium"]);
} else {
  log("Skipping Playwright browser install (--skip-playwright)");
}

if (!skipPrepare) {
  run("corepack", ["pnpm", "supabase:prepare"]);

  if (commandAvailable("temporal")) {
    run("corepack", ["pnpm", "temporal:prepare"]);
  } else {
    log("Skipping temporal:prepare because the Temporal CLI is not installed yet");
  }
} else {
  log("Skipping local prepare commands (--skip-prepare)");
}

if (!skipDoctor) {
  run(process.execPath, ["tools/dev/doctor.mjs"]);
} else {
  log("Skipping environment doctor (--skip-doctor)");
}
