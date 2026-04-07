# Worktree Local Development

## Goal
Every task should be bootable in an isolated workspace.

## Current first-slice behavior
- export `DOPPLER_TOKEN` before starting the runtime or Symphony operator
- web dev server picks a local port
- worker runs separately
- `.env.example` documents Doppler selectors plus the local fallback keys used only when `WANDERLUST_SECRETS_MODE=env`

## Future additions
- local Supabase stack automation
- local Temporal dev server automation
- local observability stack per workspace
- browser proof and video capture
