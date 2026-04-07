# Architecture

Wanderlust follows a rigid, agent-legible architecture inspired by the Harness Engineering patterns.

## Image-derived patterns we are encoding
- `Worktree-local validation loop`: the app must be bootable per worktree and easy for agents to validate with browser automation.
- `Local observability loop`: logs, metrics, and traces must be easy to expose and query locally, even if the first scaffold only ships the interfaces and hooks.
- `Knowledge store layout`: root docs stay short; `docs/` and `plans/` hold the durable system of record.
- `Layered domain model`: every domain uses `types -> config -> repo -> service -> runtime -> ui`, with cross-cutting concerns entering through `providers`.

## Runtime split
- `apps/web`: Next.js product shell and public routes
- `workers/temporal`: durable workflow worker
- `packages/domains`: business-domain implementation
- `packages/providers`: stable interfaces for external rails
- `packages/shared`: contracts, config, observability, logging, testing, and UI utilities
- `ops/symphony/elixir`: Elixir operator that can supervise isolated implementation runs against this repo

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
- `Supabase` for app state, auth, storage, and retrieval
- `Temporal` for durable business workflows
- `LangGraph` for agent reasoning inside selected workflows
- `OpenAI` for model execution

## Control-plane platform
- `Elixir/OTP` for the colocated Symphony operator
- root `WORKFLOW.md` as the shared policy contract
