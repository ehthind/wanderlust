# Local Observability Scaffold

This directory defines the disposable observability surface used by local
workspaces and PR-repair runs.

## Purpose

- keep app and worker debugging usable without managed credentials
- provide a local OpenTelemetry intake and dashboard stack
- preserve workspace-scoped metadata in `.symphony/observability.json`

## Contents

- `compose.yml`: local LGTM + OpenTelemetry Collector services
- `otel-collector-config.yml`: collector receiver/processor/exporter wiring

## Usage

1. Start the stack from the repo root:
   - `docker compose -f ops/observability/compose.yml up -d`
2. Run the workspace flow (`corepack pnpm dev` or Symphony hooks).
3. Stop the stack when done:
   - `docker compose -f ops/observability/compose.yml down`

## Notes

- Managed sinks (for example Sentry/PostHog) are additive and remain optional.
- If Docker is unavailable, runs should degrade to metadata-only observability
  and still record status in `.symphony/observability.json`.
