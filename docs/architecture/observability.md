# Observability

Wanderlust uses a hybrid observability model:
- disposable local observability for agent debugging inside isolated workspaces
- optional managed sinks for shared team visibility

## Local stack
- OpenTelemetry Collector for intake and fan-out
- Grafana-compatible local stack for logs, traces, and metrics
- workspace-scoped labels so one issue run does not hide another

The local stack is the primary debugging surface for Symphony runs. A run should be debuggable even when managed credentials are absent.

## Managed sinks
- `Sentry` for error and exception reporting
- `PostHog` for product analytics and event visibility

Managed exports are additive. They must not be required to boot the web app, Temporal worker, or Symphony workspace hooks.

## Instrumentation contract
- `apps/web`: request spans, readiness state, and route-level logs
- `packages/domains`: service and repo boundary events
- `workers/temporal`: worker lifecycle plus workflow/activity events
- `.symphony/*.json`: run metadata, checks, observability endpoints, and delivery state
