# Wanderlust Agent Map

This repo is optimized for agent-first development. Treat this file as a map, not the source of truth.

## Start here
- Read [ARCHITECTURE.md](ARCHITECTURE.md) for domain boundaries and provider rules.
- Read [DESIGN.md](DESIGN.md) and [PRODUCT_SENSE.md](PRODUCT_SENSE.md) before changing user-facing flows.
- Read [RELIABILITY.md](RELIABILITY.md) and [SECURITY.md](SECURITY.md) before touching runtime, workflows, or integrations.
- Read [PLANS.md](PLANS.md) before starting non-trivial work.
- Read [`docs/runbooks/worktree-dev.md`](docs/runbooks/worktree-dev.md) before changing local or hosted development flows.
- Read [`docs/runbooks/delivery-loop.md`](docs/runbooks/delivery-loop.md) before changing validation gates or delivery automation.

## Repository principles
- Keep plans checked in under `plans/`.
- Keep product and architecture context in `docs/`, not in prompts.
- Keep domains layered: `types -> config -> repo -> service -> runtime -> ui`.
- Cross-cutting concerns enter domains only through `packages/providers`.
- Parse data at boundaries and prefer `zod` contracts in `packages/shared/schemas`.
- Keep files small, structured, and easy for future agent runs to navigate.

## Symphony contract
- Root `WORKFLOW.md` is the scheduler contract.
- Workspace hooks live under `tools/symphony/`.
- Operator docs live under `ops/symphony/`.
- Use `corepack pnpm symphony:setup` before the first upstream Symphony run in a fresh environment.
- Use `corepack pnpm symphony:run` to invoke the upstream operator against this repo.
- Proof-of-work artifacts must be reproducible from local commands and CI.
- Symphony-run agents are allowed to write to GitHub and Linear for this repo's delivery loop when the run policy calls for it.
- Do not bypass branch protection on `main`; prefer draft PR -> ready PR -> auto-merge.
- Keep delivery state legible through `.symphony/run.json`, `.symphony/checks.json`, `.symphony/observability.json`, and `.symphony/proof.json`.

## Runtime workflows
- `corepack pnpm dev` boots the web app and Temporal worker and auto-runs `supabase:prepare` plus `temporal:prepare`.
- Use `corepack pnpm dev:web` or `corepack pnpm dev:worker` for single-surface work.
- Use `corepack pnpm dev:hosted`, `corepack pnpm dev:hosted:web`, or `corepack pnpm dev:hosted:worker` to run against Doppler `dev` without starting the local Supabase stack.
- Use `corepack pnpm supabase:start|status|stop` and `corepack pnpm temporal:start|status|stop` for explicit local service control.

## Before shipping
- Run `corepack pnpm lint`
- Run `corepack pnpm check`
- Run `corepack pnpm typecheck`
- Run `corepack pnpm test`
- Run `corepack pnpm playwright:smoke` when the web shell or delivery gate changes.
- `corepack pnpm check:delivery` runs the full local validation gate.
- Update docs or plans when behavior or constraints change
