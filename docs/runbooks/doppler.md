# Doppler Runbook

## Defaults
- `DOPPLER_TOKEN` is the global credential for Wanderlust local development, Symphony runs, and future CI automation.
- `DOPPLER_PROJECT` should default to `wanderlust`.
- `DOPPLER_CONFIG` should default to `local_main` for local development.
- Doppler config names for Wanderlust are:
  - `local_main`
  - `dev`
  - `stg`
  - `prd`
- `WANDERLUST_SECRETS_MODE=doppler` is the normal runtime path.

## CLI expectations
- the `doppler` CLI must be installed locally
- the repo treats the CLI as a first-class development tool for agents and humans
- runtime code and Symphony hooks both depend on `doppler secrets download --no-file --format json`

## Local use
- prefer configuring a write-capable `local_main` service token in scoped Doppler CLI config:
  - `doppler configure set token=... project=wanderlust config=local_main --scope /path/to/repo-or-worktree`
- local agent/human flows can still use Doppler CLI login for read/admin access when `DOPPLER_PROJECT` and `DOPPLER_CONFIG` are present
- runtime writes such as `corepack pnpm supabase:start` and `corepack pnpm supabase:status` require the scoped write-capable token
- run `corepack pnpm dev` or `corepack pnpm symphony:run`
- run `corepack pnpm supabase:start` or `corepack pnpm supabase:status` to sync the live local Supabase runtime values into Doppler `local_main`
- use `WANDERLUST_SECRETS_MODE=env` only for test or emergency local fallback paths

## Hosted environments
- `dev` now maps to the hosted Supabase project `wanderlust-dev`
- project ref: `rgzbypwrwkoiczutdyfu`
- the root repo is linked to that project via `supabase link`
- use the broader Doppler CLI login at `/Users/amritthind/code` for admin writes to non-local configs such as `dev`, `stg`, and `prd`
- run `corepack pnpm dev:hosted` when you want the app and worker to read managed `dev` secrets instead of the local Supabase stack
