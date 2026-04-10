# 0011 PR Repair Agent

## Summary
Add a GitHub App-backed PR repair worker for Wanderlust that can watch failed required checks, keep a single PR workpad comment up to date, mirror CI remediation into the linked Linear workpad comment, and push same-repo fixes without changing the normal review or merge flow.

## Progress
- [x] add `WORKFLOW.pr.md` as the repo-owned PR-remediation contract
- [x] add a shared required-check manifest for CI, Symphony validation, and the PR agent
- [x] refactor GitHub Actions required checks to emit stable `.ci-artifacts` logs and summaries
- [x] implement the PR agent workflow loader, policy/state modules, GitHub client, workspace runner, webhook server, and repair loop
- [x] mirror CI remediation updates into the linked Linear issue workpad so other agents can see PR repair progress
- [x] add repo tests for workflow parsing, policy decisions, state storage, workpad rendering, and repair-cycle orchestration
- [x] document the PR repair worker and its place in the delivery loop
