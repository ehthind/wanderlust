# Worktree Local Development

## Goal
Every task should be bootable in an isolated workspace.

## Current first-slice behavior
- export `DOPPLER_TOKEN` before starting the runtime or Symphony operator
- root `corepack pnpm dev` auto-runs `supabase:prepare`
- web dev server picks a local port
- worker runs separately
- `.env.example` documents Doppler selectors plus the local fallback keys used only when `WANDERLUST_SECRETS_MODE=env`
- `corepack pnpm supabase:prepare` renders a worktree-local `supabase/config.toml`
- `corepack pnpm supabase:start` syncs runtime keys back into root `.env.local`
- shared config loads root `.env` and `.env.local` for the web app and worker before resolving Doppler or env-mode secrets

## Future additions
- local observability stack per workspace
- local Temporal dev server automation
- browser proof and video capture

## Supabase workflow
1. Run `corepack pnpm supabase:prepare` after `corepack pnpm install`, or let `corepack pnpm dev`, `corepack pnpm dev:web`, or `corepack pnpm dev:worker` do it automatically.
2. Start the local stack with `corepack pnpm supabase:start`.
3. Inspect the stack with `corepack pnpm supabase:status`.
4. Stop it with `corepack pnpm supabase:stop`.

The bootstrap script derives stable ports from the worktree name, writes `supabase/config.toml` from the tracked template, and manages a marked block inside root `.env.local`. Docker and the Supabase CLI binary are still local prerequisites; this repo now pins the CLI and generates the per-worktree config around it.
`corepack pnpm supabase:prepare` works without Docker. `supabase:start`, `supabase:status`, and `supabase:env` now surface explicit Docker prerequisite errors from the Supabase runtime when the daemon is unavailable.
