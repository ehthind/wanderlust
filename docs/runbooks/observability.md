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

## Sentry coverage
- `apps/web` uses `service=wanderlust-web` and reports browser crashes, route-handler failures, and server-render failures in Vercel `preview` and `production`
- `workers/temporal` uses `service=wanderlust-temporal-worker` and reports worker boot/connectivity failures plus terminal workflow failures
- the current Railway `dev` environment is treated as the worker's preview-equivalent Sentry environment until a dedicated Railway production environment exists

## Sentry tags and sampling
- always tag `service` and `runtime`
- include `workspace`, `issue`, and `runId` only when those labels are explicitly available and not just local placeholder defaults
- include workflow/activity tags for Temporal terminal failures
- sample web browser traces at `0.05`
- sample web server and edge traces at `0.1`
- sample Temporal worker traces at `0.1`

## Sentry filtering and redaction
- drop validation noise such as `ZodError`
- drop abort/cancel noise and health/readiness probe failures
- drop expected 4xx-style failures when they surface as explicit exceptions
- redact secret-like metadata keys before they are attached as Sentry extras
- never attach request bodies, response bodies, cookies, auth headers, prompts, or free-form user content

## Failure handling
- local runs should degrade to metadata-only observability if Docker or managed credentials are unavailable
- failure to start the local stack should not destroy the workspace; it should be recorded as a degraded run artifact instead
- failure to resolve managed sink credentials must never print raw secret values into logs or `.symphony` artifacts
