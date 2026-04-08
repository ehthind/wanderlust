import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { setSecretsSync } from "../doppler/secrets.mjs";
import { derivePortBlock } from "./port-utils.mjs";
import { sanitizeProjectId, upsertManagedBlock } from "./supabase-local.mjs";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const envPath = path.join(repoRoot, ".env.local");
const temporalRoot = path.join(repoRoot, ".temporal");
const managedStart = "# BEGIN WANDERLUST TEMPORAL";
const managedEnd = "# END WANDERLUST TEMPORAL";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const removeManagedBlock = (content) =>
  content.replace(
    new RegExp(`${escapeRegExp(managedStart)}[\\s\\S]*?${escapeRegExp(managedEnd)}\\n?`, "m"),
    "",
  );

const isProcessAlive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

const writeManagedMetadata = (settings) => {
  const block = [
    managedStart,
    `TEMPORAL_GRPC_PORT=${settings.grpcPort}`,
    `TEMPORAL_UI_PORT=${settings.uiPort}`,
    `TEMPORAL_HTTP_PORT=${settings.httpPort}`,
    `TEMPORAL_METRICS_PORT=${settings.metricsPort}`,
    `TEMPORAL_LOCAL_NAMESPACE=${settings.namespace}`,
    `TEMPORAL_TASK_QUEUE=${settings.taskQueue}`,
    managedEnd,
  ].join("\n");

  const existingEnv = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  fs.writeFileSync(envPath, upsertManagedBlock(existingEnv, block), "utf8");
};

const clearManagedMetadata = () => {
  if (!fs.existsSync(envPath)) {
    return;
  }

  const next = removeManagedBlock(fs.readFileSync(envPath, "utf8")).trimEnd();
  fs.writeFileSync(envPath, next ? `${next}\n` : "", "utf8");
};

export const deriveTemporalLocalSettings = ({ cwd = repoRoot, existingEnv = process.env } = {}) => {
  const workspaceSlug = sanitizeProjectId(path.basename(cwd));
  const [grpcPort, uiPort, httpPort, metricsPort] = derivePortBlock({
    cwd,
    base: 58000,
    size: 4,
    spread: 400,
  });
  const namespace = existingEnv.TEMPORAL_NAMESPACE ?? workspaceSlug;
  const taskQueue = existingEnv.TEMPORAL_TASK_QUEUE ?? `wanderlust-${workspaceSlug}`;
  const stateDir = path.join(temporalRoot, workspaceSlug);

  return {
    workspaceSlug,
    namespace,
    taskQueue,
    grpcPort,
    uiPort,
    httpPort,
    metricsPort,
    address: `127.0.0.1:${grpcPort}`,
    uiUrl: `http://127.0.0.1:${uiPort}`,
    stateDir,
    dbFilename: path.join(stateDir, "temporal.db"),
    pidPath: path.join(stateDir, "server.pid"),
    logPath: path.join(stateDir, "server.log"),
    dopplerProject: existingEnv.DOPPLER_PROJECT ?? "wanderlust",
    dopplerConfig: existingEnv.DOPPLER_CONFIG ?? "local_main",
  };
};

const ensureTemporalCli = () => {
  const result = spawnSync("temporal", ["--version"], {
    encoding: "utf8",
    stdio: "pipe",
  });

  if (result.status !== 0) {
    throw new Error(
      "Temporal CLI is unavailable. Install it with Homebrew or the official Temporal installer.",
    );
  }
};

const ensureStateDir = (settings) => {
  fs.mkdirSync(settings.stateDir, { recursive: true });
};

const writePid = (settings, pid) => {
  fs.writeFileSync(settings.pidPath, JSON.stringify({ pid }, null, 2), "utf8");
};

const readPid = (settings) => {
  if (!fs.existsSync(settings.pidPath)) {
    return null;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(settings.pidPath, "utf8"));
    return typeof parsed.pid === "number" ? parsed.pid : null;
  } catch {
    return null;
  }
};

const temporalDescribe = (settings, { capture = false } = {}) =>
  spawnSync(
    "temporal",
    [
      "operator",
      "namespace",
      "describe",
      "--namespace",
      settings.namespace,
      "--address",
      settings.address,
      "--tls=false",
      "--command-timeout",
      "5s",
      "--output",
      "json",
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: capture ? ["ignore", "pipe", "pipe"] : "pipe",
    },
  );

const waitForTemporal = async (settings) => {
  let lastError = "";

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const result = temporalDescribe(settings, { capture: true });
    if (result.status === 0) {
      return;
    }

    lastError = result.stderr?.trim() || result.stdout?.trim() || lastError;
    await sleep(500);
  }

  const logTail = fs.existsSync(settings.logPath)
    ? fs.readFileSync(settings.logPath, "utf8").split(/\r?\n/).slice(-20).join("\n").trim()
    : "";
  throw new Error(
    [lastError, logTail && `Temporal log tail:\n${logTail}`].filter(Boolean).join("\n\n") ||
      "Temporal local server did not become ready in time.",
  );
};

const buildDopplerTemporalSecrets = (settings) => ({
  TEMPORAL_ADDRESS: settings.address,
  TEMPORAL_NAMESPACE: settings.namespace,
  TEMPORAL_TASK_QUEUE: settings.taskQueue,
  TEMPORAL_UI_URL: settings.uiUrl,
});

const syncTemporalIntoDoppler = (settings) => {
  const updatedSecrets = setSecretsSync(buildDopplerTemporalSecrets(settings), {
    ...process.env,
    DOPPLER_PROJECT: settings.dopplerProject,
    DOPPLER_CONFIG: settings.dopplerConfig,
  });

  process.stdout.write(
    `synced Temporal runtime values to Doppler (${updatedSecrets.join(", ")}) and refreshed ${path.relative(repoRoot, envPath)} metadata\n`,
  );
};

const printSummary = (settings, status) => {
  process.stdout.write(
    `${JSON.stringify(
      {
        status,
        namespace: settings.namespace,
        taskQueue: settings.taskQueue,
        address: settings.address,
        uiUrl: settings.uiUrl,
        stateDir: path.relative(repoRoot, settings.stateDir),
      },
      null,
      2,
    )}\n`,
  );
};

const prepare = (settings) => {
  ensureTemporalCli();
  ensureStateDir(settings);
  writeManagedMetadata(settings);
  printSummary(settings, "prepared");
};

const start = async (settings) => {
  ensureTemporalCli();
  ensureStateDir(settings);
  writeManagedMetadata(settings);

  const existingPid = readPid(settings);
  if (existingPid && isProcessAlive(existingPid)) {
    await waitForTemporal(settings);
    syncTemporalIntoDoppler(settings);
    printSummary(settings, "running");
    return;
  }

  const logFd = fs.openSync(settings.logPath, "a");
  const child = spawn(
    "temporal",
    [
      "server",
      "start-dev",
      "--ip",
      "127.0.0.1",
      "--ui-ip",
      "127.0.0.1",
      "--db-filename",
      settings.dbFilename,
      "--namespace",
      settings.namespace,
      "--port",
      String(settings.grpcPort),
      "--ui-port",
      String(settings.uiPort),
      "--http-port",
      String(settings.httpPort),
      "--metrics-port",
      String(settings.metricsPort),
      "--log-format",
      "json",
    ],
    {
      cwd: repoRoot,
      detached: true,
      stdio: ["ignore", logFd, logFd],
    },
  );

  child.unref();
  fs.closeSync(logFd);
  writePid(settings, child.pid);

  await waitForTemporal(settings);
  syncTemporalIntoDoppler(settings);
  printSummary(settings, "running");
};

const status = async (settings) => {
  ensureTemporalCli();
  ensureStateDir(settings);
  writeManagedMetadata(settings);

  const pid = readPid(settings);
  if (!pid || !isProcessAlive(pid)) {
    printSummary(settings, "stopped");
    process.exitCode = 1;
    return;
  }

  await waitForTemporal(settings);
  syncTemporalIntoDoppler(settings);
  printSummary(settings, "running");
};

const stop = (settings) => {
  const pid = readPid(settings);

  if (!pid || !isProcessAlive(pid)) {
    clearManagedMetadata();
    printSummary(settings, "stopped");
    return;
  }

  process.kill(pid, "SIGTERM");
  fs.rmSync(settings.pidPath, { force: true });
  clearManagedMetadata();
  printSummary(settings, "stopped");
};

const main = async () => {
  const command = process.argv[2] ?? "prepare";
  const settings = deriveTemporalLocalSettings();

  switch (command) {
    case "prepare":
      prepare(settings);
      return;
    case "start":
      await start(settings);
      return;
    case "status":
      await status(settings);
      return;
    case "stop":
      stop(settings);
      return;
    case "env":
      printSummary(settings, "configured");
      return;
    default:
      process.stderr.write(
        "Usage: node tools/dev/temporal-local.mjs <prepare|start|status|stop|env>\n",
      );
      process.exitCode = 1;
  }
};

const isDirectExecution = process.argv[1]
  ? import.meta.url === pathToFileUrl(process.argv[1]).href
  : false;

function pathToFileUrl(filePath) {
  return new URL(`file://${path.resolve(filePath)}`);
}

if (isDirectExecution) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
