# Wanderlust

Wanderlust is an agent-first travel product scaffold built to be legible to coding agents, Symphony, and human reviewers at the same time.

## What this repo optimizes for
- small root instructions and deep repo-local knowledge
- explicit domain layering and provider boundaries
- checked-in execution plans
- worktree-local app boot and proof-of-work collection
- Symphony-compatible workflow contracts for the upstream service
- repo-local hooks that bootstrap and validate isolated Symphony workspaces
- autonomous delivery that can stop at draft PR, ready PR, or merged-on-main depending on repository policy
- hybrid observability with local agent-debug surfaces and optional managed exports

## Core commands
- export `DOPPLER_TOKEN` before runtime or Symphony commands that need managed secrets
- `corepack pnpm install`
- `corepack pnpm dev`
- `corepack pnpm test`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm check`
- `corepack pnpm check:delivery`
- `corepack pnpm check:observability`
- `corepack pnpm symphony:setup`
- `corepack pnpm symphony:run`

## Conservative Codex defaults
- one active issue at a time
- low default turn budget
- subagents disabled by default
- `gpt-5.1-codex-mini` as the default model hint in `WORKFLOW.md`

## First slice
- `apps/web`: public product shell with Discover placeholder and health route
- `workers/temporal`: sample Temporal worker and workflow
- `packages/domains`: layered business-domain source
- `packages/providers`: stable provider interfaces plus local fakes
- `packages/shared`: schemas, config, observability, logging, testing, and UI helpers
- `WORKFLOW.md`: Symphony contract for isolated implementation runs
- `tools/symphony`: repo-local hooks plus wrappers for the upstream Symphony clone
- `ops/observability`: local OTEL/Grafana-compatible stack for workspace debugging
- `tools/vercel`: repo-local wrappers for Vercel auth, linking, env sync, and deployment fallback flows

## Web deploy platform
- `apps/web` is the only runtime targeted at Vercel.
- Preview and production deployments should come from the Git-connected Vercel project flow.
- Doppler remains the secret source of truth; Vercel envs are synced from Doppler configs.
- Manual fallback deploys are available via `corepack pnpm vercel:deploy:preview` and `corepack pnpm vercel:deploy:prod`.
- See `docs/runbooks/vercel.md` for the exact setup path.

## Delivery policy
- GitHub and Linear are part of the delivery loop for Symphony-run work.
- The repo expects protected-branch PR flow on `main`, with automation stopping at branch protection rather than bypassing it.
- Proof-of-work artifacts under `.symphony/` must be rich enough for another agent to inspect without replaying the whole run.
- Managed secrets come from Doppler via a service-token runtime fetch model, not `doppler run` environment injection.
