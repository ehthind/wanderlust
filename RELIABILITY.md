# Reliability

## Principles
- Durable business workflows run through Temporal.
- Structured logs are mandatory outside local dev-only scripts.
- Worktree-local environments must be isolated and disposable.
- Agent validation should be reproducible from scripts, not private human steps.

## First-slice reliability checks
- app boot health route
- worker start validation
- provider fake path for deterministic local tests
- architecture and docs checks in CI
