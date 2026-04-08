# Temporal

## Goal
Treat Temporal as a first-class platform surface alongside Supabase and Vercel.

## Local development
- `corepack pnpm temporal:prepare` derives deterministic local Temporal settings for the current repo or worktree.
- `corepack pnpm temporal:start` starts `temporal server start-dev` in the background and syncs `TEMPORAL_*` runtime values into Doppler `wanderlust/local_main`.
- `corepack pnpm temporal:status` verifies the local Temporal server is reachable and refreshes Doppler with the current runtime values.
- `corepack pnpm temporal:stop` stops the local dev server and clears the managed Temporal metadata block from `.env.local`.
- `corepack pnpm temporal:env` prints the derived local settings without starting the server.

Local Temporal state lives under `.temporal/<worktree-slug>/` and includes:
- the SQLite state file for `start-dev`
- the worker/server PID file
- the local server log

`.env.local` remains metadata-only. The app and worker should read `TEMPORAL_ADDRESS`, `TEMPORAL_NAMESPACE`, `TEMPORAL_TASK_QUEUE`, and `TEMPORAL_UI_URL` from Doppler after the local sync completes.

## Hosted environments
- `corepack pnpm temporal:cloud:env:dev` prints the current Temporal config coming from Doppler `wanderlust/dev`.
- `corepack pnpm temporal:cloud:env:prod` prints the current Temporal config coming from Doppler `wanderlust/prd`.

Expected hosted secrets per Doppler config:
- `TEMPORAL_ADDRESS`
- `TEMPORAL_NAMESPACE`
- `TEMPORAL_TASK_QUEUE`
- `TEMPORAL_API_KEY`
- `TEMPORAL_UI_URL`

Temporal Cloud hosts the Temporal Service. Wanderlust still runs the worker code on infrastructure we control.

## Worker contract
- the first real workflow is `planTripWorkflow`
- the worker task queue comes from `TEMPORAL_TASK_QUEUE`
- the web app can start and describe plan-trip workflows through the typed workflow runtime
- the worker remains outside Vercel
