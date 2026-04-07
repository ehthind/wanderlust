# 0005 Local Supabase Bootstrap

## Summary
Set up a reproducible local Supabase bootstrap for Wanderlust that works inside isolated worktrees and Symphony-created issue workspaces.

## Decisions
- Pin the Supabase CLI in the repo toolchain instead of relying on a global install.
- Generate `supabase/config.toml` from a tracked template so worktree-local ports stay deterministic and reviewable.
- Manage local Supabase-derived env through a marked block in root `.env.local` rather than hardcoding runtime secrets into source.
- Load root `.env` and `.env.local` from shared config so the web app and worker pick up generated values without direct Supabase-specific boot logic.
- Run `corepack pnpm supabase:prepare` from Symphony `hooks.after_create` so fresh issue workspaces are bootstrapped automatically.

## Progress
- [x] pinned `supabase` CLI in root `package.json`
- [x] added `supabase:prepare`, `supabase:start`, `supabase:status`, `supabase:stop`, and `supabase:env` scripts
- [x] added tracked `supabase/` scaffold files for template, migrations, and seed
- [x] added worktree-aware bootstrap logic and tests
- [x] wired root dev commands to auto-run `supabase:prepare`
- [x] fixed `.env.local` override behavior in shared config and covered it with tests
- [x] added explicit Docker prerequisite messaging for Supabase runtime commands without a separate `docker` CLI preflight
- [x] updated Symphony bootstrap hooks and runbooks
- [x] recorded workspace-local proof artifacts
- [ ] validate `supabase start/status` against a Docker-enabled local environment
