# Reliability

## Principles
- Durable business workflows run through Temporal.
- Structured logs are mandatory outside local dev-only scripts.
- Worktree-local environments must be isolated and disposable.
- Agent validation should be reproducible from scripts, not private human steps.
- The autonomous delivery loop must stop at explicit gates rather than silently skipping failures.
- Local observability must be queryable per workspace so agent runs can debug without shared tribal knowledge.

## First-slice reliability checks
- app boot health route
- worker start validation
- provider fake path for deterministic local tests
- architecture and docs checks in CI
- web smoke test in CI and in the delivery loop
