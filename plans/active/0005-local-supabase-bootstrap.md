# 0005 Local Supabase Bootstrap

## Summary
Set up a reproducible local Supabase bootstrap for Wanderlust that works inside isolated worktrees and Symphony-created issue workspaces.

## Decisions
- Pin the Supabase CLI in the repo toolchain instead of relying on a global install.
- Generate `supabase/config.toml` from a tracked template so worktree-local ports stay deterministic and reviewable.
- Keep `.env.local` for non-secret local metadata only.
- Sync live `SUPABASE_*` runtime values into Doppler `wanderlust/local_main` so the app and worker keep using the Doppler-first runtime path.
- Use a scoped write-capable Doppler `local_main` service token for local/worktree write-back instead of shell env injection.
- Load root `.env` and `.env.local` from shared config for non-secret local overrides before resolving runtime secrets from Doppler.
- Run `corepack pnpm supabase:prepare` from Symphony `hooks.after_create` so fresh issue workspaces are bootstrapped automatically.

## Progress
- [x] pinned `supabase` CLI in root `package.json`
- [x] added `supabase:prepare`, `supabase:start`, `supabase:status`, `supabase:stop`, and `supabase:env` scripts
- [x] added tracked `supabase/` scaffold files for template, migrations, and seed
- [x] added worktree-aware bootstrap logic and tests
- [x] wired root dev commands to auto-run `supabase:prepare`
- [x] fixed shared-config loading so local metadata can coexist with Doppler runtime secrets
- [x] added explicit Docker prerequisite messaging for Supabase runtime commands without a separate `docker` CLI preflight
- [x] updated Symphony bootstrap hooks and runbooks
- [x] recorded workspace-local proof artifacts
- [x] synced Supabase runtime values into Doppler instead of writing them into `.env.local`
- [ ] validate `supabase start/status` against a Docker-enabled local environment with a scoped write-capable Doppler token configured
