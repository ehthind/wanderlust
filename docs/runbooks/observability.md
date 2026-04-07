# Observability Runbook

## Goals
- give each Symphony workspace a disposable observability surface
- make app, worker, and delivery-loop behavior queryable without shared dashboards
- keep local runs usable without managed credentials

## Local-first behavior
- `tools/symphony/before-run.mjs` prepares workspace-local observability metadata
- `ops/observability/compose.yml` defines the local collector and dashboard stack
- `tools/symphony/after-run.mjs` captures the observable run state into `.symphony/observability.json`

## Labels that should appear everywhere
- workspace path
- issue identifier
- branch name
- service name
- run stage

## Managed exports
- enable `Sentry` only when `SENTRY_DSN` is present in the resolved Doppler secret set
- enable `PostHog` only when `POSTHOG_KEY` and `POSTHOG_HOST` are present in the resolved Doppler secret set

## Failure handling
- local runs should degrade to metadata-only observability if Docker or managed credentials are unavailable
- failure to start the local stack should not destroy the workspace; it should be recorded as a degraded run artifact instead
- failure to resolve managed sink credentials must never print raw secret values into logs or `.symphony` artifacts
