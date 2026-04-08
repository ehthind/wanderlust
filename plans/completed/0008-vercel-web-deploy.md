# 0008 Vercel Web Deploy

## Summary
Wire Vercel in as the deployment platform for the Next.js web app only, while keeping the Temporal worker outside Vercel and preserving Doppler as the secrets source of truth.

## Decisions
- Vercel deploys `apps/web` only.
- Preview and production flows are both supported, but previews are the primary day-to-day surface.
- Doppler remains authoritative; Vercel envs are synced from Doppler configs.
- Repo-local Vercel CLI state lives under `.vercel-agent/` so agents and humans share the same deterministic path.
- Manual CLI deploys are available as a fallback, but Git-connected previews remain the intended steady-state flow.

## Progress
- [x] add repo-native Vercel CLI dependency
- [x] add repo-local Vercel wrapper scripts and cache/config path
- [x] add Doppler-to-Vercel env sync for development, preview, and production targets
- [x] document the Vercel setup and runtime contract
