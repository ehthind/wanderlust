# Architecture

Wanderlust follows a rigid, agent-legible architecture inspired by the Harness Engineering patterns.

## Image-derived patterns we are encoding
- `Worktree-local validation loop`: the app must be bootable per worktree and easy for agents to validate with browser automation.
- `Local observability loop`: logs, metrics, and traces must be easy to expose and query locally, even if the first scaffold only ships the interfaces and hooks.
- `Autonomous delivery loop`: implementation, validation, branch creation, PR creation, merge monitoring, and issue-state updates are part of the same control flow.
- `Knowledge store layout`: root docs stay short; `docs/` and `plans/` hold the durable system of record.
- `Layered domain model`: every domain uses `types -> config -> repo -> service -> runtime -> ui`, with cross-cutting concerns entering through `providers`.

## Runtime split
- `apps/web`: Next.js product shell and public routes
- `workers/temporal`: durable workflow worker
- `packages/domains`: business-domain implementation
- `packages/providers`: stable interfaces for external rails
- `packages/shared`: contracts, config, observability, logging, testing, and UI utilities
- `tools/symphony`: repo-local hook and wrapper layer used by the upstream Symphony operator

## Domain layering
- `types`: contracts and pure domain values
- `config`: constants and feature/domain configuration
- `repo`: persistence and retrieval adapters
- `service`: domain orchestration
- `runtime`: runtime entrypoints and workflow/activity wiring
- `ui`: presentation helpers

Allowed dependency direction is toward more foundational layers only. `ui` can depend on `runtime`, `service`, `repo`, `config`, and `types`. `types` depends on nothing inside its own domain.

## Providers
Cross-cutting integrations are accessed only through provider interfaces:
- booking
- payment
- communication
- support
- workflow
- agent runtime

## Product platform
- `Vercel` for the deployed Next.js web surface
- `Supabase` for app state, auth, storage, and retrieval
- `Temporal` for durable business workflows
- `LangGraph` for agent reasoning inside selected workflows
- `OpenAI` for model execution

## Control-plane platform
- upstream `openai/symphony` Elixir implementation as the orchestrator
- root `WORKFLOW.md` as the shared policy contract
- `.symphony/*.json` artifacts as the machine-readable run ledger

## Delivery gates
- `main` is expected to stay behind protected-branch PR flow.
- Local run hooks should mirror the same validation gates as CI.
- The repo should be able to stop safely at any of these stages:
  - validated local branch
  - draft PR
  - ready PR with auto-merge enabled
  - merged issue ready for closure

## Observability split
- `ops/observability` holds the disposable local stack for agent debugging.
- `packages/shared/observability` holds the application-facing contracts for logs, traces, metrics, and correlation.
- Managed sinks such as Sentry and PostHog are optional exports; local runs must still be debuggable without them.

## Deployment split
- `apps/web` can be deployed to Vercel with Doppler-projected envs.
- `workers/temporal` remains outside Vercel and is treated as an external dependency by the web app.
