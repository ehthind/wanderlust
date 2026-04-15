# Local Machine Setup

## Goal
Make a fresh machine ready for Wanderlust repo install, local development, and the common validation loop with one checked-in bootstrap path.

## Canonical path
1. Install Node `24.x` using the checked-in [`.node-version`](../../.node-version).
2. Run `corepack enable`.
3. Run `corepack pnpm setup`.
4. If you want a fresh readiness re-check later, run `corepack pnpm env:doctor`.

## What setup does
- installs repository dependencies through the pinned pnpm toolchain
- copies `.env.example` to `.env.local` when `.env.local` does not exist yet
- installs the Playwright Chromium browser used by the smoke path
- runs `corepack pnpm supabase:prepare`
- runs `corepack pnpm temporal:prepare` when the Temporal CLI is already available
- runs the environment doctor at the end so missing machine prerequisites are explicit

## What setup does not try to automate
- installing OS-level tools such as Docker Desktop, the Doppler CLI, the Temporal CLI, or `gh`
- logging into Doppler, GitHub, Vercel, Railway, or the upstream Symphony service
- provisioning secrets or mutating managed environments outside the repo

## Required prerequisites outside the repo
- Doppler access for `wanderlust/local_main`, unless you explicitly switch local runs to `WANDERLUST_SECRETS_MODE=env`
- Temporal CLI on `PATH`, because `corepack pnpm dev` auto-runs `temporal:prepare`

## Common optional prerequisites
- Docker daemon for `corepack pnpm supabase:start`
- `gh` authentication for PR-oriented delivery
- upstream Symphony checkout plus `SYMPHONY_UPSTREAM_ROOT` for `corepack pnpm symphony:setup`
- Vercel login and project linking for the deploy flow in [vercel.md](./vercel.md)

## After setup
- Run `corepack pnpm dev` for the default local web + worker path.
- Run `corepack pnpm test`, `corepack pnpm typecheck`, and `corepack pnpm check` to validate the repo.
- Use [worktree-dev.md](./worktree-dev.md) for the local runtime details.
- Use [symphony.md](./symphony.md) for the upstream operator path.
