# 0012 Local Machine Bootstrap

## Summary
Add a checked-in bootstrap and doctor path so a fresh machine can reach a reproducible Wanderlust local-development baseline without relying on scattered tribal setup steps.

## Decisions
- Keep setup repo-local and cross-platform by checking in Node-based scripts rather than a macOS-only installer.
- Pin the recommended Node version with `.node-version` so local machines and CI can converge on the same default runtime.
- Let the setup script perform only deterministic repo-safe actions such as dependency install, local file creation, and prepare commands.
- Keep external tool installation and service authentication explicit; the doctor reports those gaps instead of trying to hide them.
- Treat Doppler access and the Temporal CLI as default local-runtime prerequisites because `corepack pnpm dev` depends on them.

## Progress
- [x] added `.node-version` and aligned CI to read it
- [x] added checked-in setup and doctor scripts under `tools/dev/`
- [x] copied the canonical setup path into a dedicated runbook
- [x] linked README and runtime runbooks to the new setup path
- [x] kept the setup flow non-destructive and limited to repo-local state
