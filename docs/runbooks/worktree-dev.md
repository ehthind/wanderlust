# Worktree Local Development

## Goal
Every task should be bootable in an isolated workspace.

## Current first-slice behavior
- configure a scoped write-capable Doppler token before starting the runtime or Symphony operator:
  - `doppler configure set token=... project=wanderlust config=local_main --scope /path/to/repo-or-worktree`
- root `corepack pnpm dev` auto-runs `supabase:prepare`
- root `corepack pnpm dev:hosted` runs the app and worker against Doppler `dev` without starting the local Supabase stack
- web dev server picks a local port
- worker runs separately
- `.env.example` documents Doppler selectors plus the local fallback keys used only when `WANDERLUST_SECRETS_MODE=env`
- `corepack pnpm supabase:prepare` renders a worktree-local `supabase/config.toml`
- `corepack pnpm supabase:start` and `corepack pnpm supabase:status` sync live `SUPABASE_*` values into Doppler `wanderlust/local_main`
- shared config loads root `.env` and `.env.local` for local metadata before resolving Doppler or env-mode secrets

## Future additions
- local observability stack per workspace
- local Temporal dev server automation
- browser proof and video capture

## Supabase workflow
### Local stack
1. Run `corepack pnpm supabase:prepare` after `corepack pnpm install`, or let `corepack pnpm dev`, `corepack pnpm dev:web`, or `corepack pnpm dev:worker` do it automatically.
2. Start the local stack with `corepack pnpm supabase:start`.
3. Inspect the stack with `corepack pnpm supabase:status`.
4. Stop it with `corepack pnpm supabase:stop`.

The bootstrap script derives stable ports from the worktree name, writes `supabase/config.toml` from the tracked template, manages a marked metadata block inside root `.env.local`, and syncs live local Supabase runtime values into Doppler for the app and worker. Docker and the Supabase CLI binary are still local prerequisites; this repo now pins the CLI and generates the per-worktree config around it.
`corepack pnpm supabase:prepare` works without Docker. `supabase:start`, `supabase:status`, and `supabase:env` now surface explicit Docker prerequisite errors from the Supabase runtime when the daemon is unavailable.

### Hosted dev project
- the root repo is linked to the hosted Supabase dev project `wanderlust-dev`
- project ref: `rgzbypwrwkoiczutdyfu`
- Doppler `wanderlust/dev` holds the hosted `SUPABASE_*` runtime values
- Doppler `wanderlust/dev` should also hold `SUPABASE_DB_PASSWORD` for repeatable hosted schema pushes
- use the hosted path when you want app/worker behavior against cloud Supabase without bringing up local containers:
  - `corepack pnpm dev:hosted`
  - `corepack pnpm dev:hosted:web`
  - `corepack pnpm dev:hosted:worker`
  - `corepack pnpm supabase:push:hosted`

The hosted scripts force `DOPPLER_CONFIG=dev` for the child process and reuse the same guarded runtime path as local development.
They also force `DOPPLER_SCOPE=/Users/amritthind/code` so hosted `dev` reads come from the broader Doppler login instead of the repo-scoped `local_main` token.
