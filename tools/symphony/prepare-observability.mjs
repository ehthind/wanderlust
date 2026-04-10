import { spawnShellSync } from "../shared/shell.mjs";

import { getWorkspaceContext, updateRunArtifact, writeArtifact } from "./_shared.mjs";

const ctx = getWorkspaceContext();

const composeFile = `${ctx.repoRoot}/ops/observability/compose.yml`;
const projectName = `wanderlust-${ctx.issue.identifier.toLowerCase()}`;
const endpoints = {
  grafana: `http://127.0.0.1:${ctx.workspace.ports.grafana}`,
  otlpGrpc: `http://127.0.0.1:${ctx.workspace.ports.otlpGrpc}`,
  otlpHttp: `http://127.0.0.1:${ctx.workspace.ports.otlpHttp}`,
};

const dockerCheck = spawnShellSync("docker compose version", {
  cwd: ctx.repoRoot,
  encoding: "utf8",
});

const canUseDocker = dockerCheck.status === 0;
let status = canUseDocker ? "configured" : "degraded";
let reason = canUseDocker
  ? ""
  : "docker compose unavailable; falling back to metadata-only observability";
let mode = canUseDocker ? "stack" : "metadata-only";

if (canUseDocker) {
  const result = spawnShellSync(
    `OBSERVABILITY_GRAFANA_PORT=${ctx.workspace.ports.grafana} OBSERVABILITY_OTLP_GRPC_PORT=${ctx.workspace.ports.otlpGrpc} OBSERVABILITY_OTLP_HTTP_PORT=${ctx.workspace.ports.otlpHttp} docker compose -f ops/observability/compose.yml -p ${projectName} up -d`,
    {
      cwd: ctx.repoRoot,
      encoding: "utf8",
    },
  );

  if (result.status === 0) {
    status = "started";
  } else {
    status = "degraded";
    mode = "metadata-only";
    reason = result.stderr?.trim() || "failed to start docker compose stack";
  }
}

writeArtifact(ctx, "observability.json", {
  generatedAt: new Date().toISOString(),
  workspace: {
    labels: ctx.workspace.labels,
    repoRoot: ctx.repoRoot,
    workspaceRoot: ctx.workspace.workspaceRoot,
  },
  local: {
    mode,
    status,
    composeFile,
    projectName,
    endpoints,
    reason,
  },
  managed: ctx.managed,
});

updateRunArtifact(ctx, {
  observability: {
    localMode: mode,
    localStatus: status,
    managed: ctx.managed,
  },
});

process.stdout.write(
  canUseDocker
    ? `observability configured for ${projectName}\n`
    : "observability configured in metadata-only mode\n",
);
