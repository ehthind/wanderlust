# Wanderlust Agent Map

This repo is optimized for agent-first development. Treat this file as a map, not the source of truth.

## Start here
- Read [ARCHITECTURE.md](ARCHITECTURE.md) for domain boundaries and provider rules.
- Read [DESIGN.md](DESIGN.md) and [PRODUCT_SENSE.md](PRODUCT_SENSE.md) before changing user-facing flows.
- Read [RELIABILITY.md](RELIABILITY.md) and [SECURITY.md](SECURITY.md) before touching runtime, workflows, or integrations.
- Read [PLANS.md](PLANS.md) before starting non-trivial work.

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
- Proof-of-work artifacts must be reproducible from local commands and CI.
- Symphony-run agents are allowed to write to GitHub and Linear for this repo's delivery loop when the run policy calls for it.
- Do not bypass branch protection on `main`; prefer draft PR -> ready PR -> auto-merge.
- Keep delivery state legible through `.symphony/run.json`, `.symphony/checks.json`, `.symphony/observability.json`, and `.symphony/proof.json`.

## Before shipping
- Run `corepack pnpm check`
- Run `corepack pnpm typecheck`
- Run `corepack pnpm test`
- Run `corepack pnpm playwright:smoke` when the web shell or delivery gate changes.
- Update docs or plans when behavior or constraints change
