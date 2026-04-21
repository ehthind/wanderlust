# Delivery Loop

This repo is designed for a full autonomous delivery loop with PR-first gates.

## Expected flow
1. Claim an eligible Linear issue and move it to `In Progress`.
2. Prepare the isolated workspace and local observability surface.
3. Implement the change inside the workspace clone only.
4. Run the local validation gate:
   - `corepack pnpm lint`
   - `corepack pnpm typecheck`
   - `corepack pnpm check`
   - `corepack pnpm test`
   - `corepack pnpm playwright:smoke`
5. Commit to the issue branch.
6. Open or update a draft PR.
7. Convert the PR to ready and move the issue to `Human Review` once the local validation gate is green.
8. After approval, move the issue to `Merging`.
9. Let the Symphony `land` skill watch checks, resolve drift, and squash-merge into `main`.
10. Let the `main` branch release job run `semantic-release` and publish the labeled release assets for that squash merge.
11. Move the Linear issue to `Done` after merge lands on `main`.

## PR repair loop
- Same-repo PRs can be watched by the GitHub App worker defined by `WORKFLOW.pr.md`.
- The worker acts only on failed required checks for the latest PR head SHA.
- The worker keeps one PR comment headed `## Codex CI Workpad` updated as it diagnoses, reruns, or pushes a fix.
- The worker mirrors the same CI remediation state into the linked Linear issue's `## Codex Workpad` comment under `### CI Remediation` so Symphony and PR repair runs share one ticket timeline.
- The worker publishes a non-required `codex-remediation` check run so reviewers can see whether repair is active, blocked, or waiting on CI.
- The worker never merges; `Human Review` and `Merging` remain the handoff points for Symphony's normal land flow.

## Stop conditions
- If local validation fails, do not progress to PR readiness.
- If CI or branch protection fails, leave the issue in `In Progress`.
- If delivery is blocked, record the blocker in `.symphony/run.json` and `.symphony/proof.json`.

## Release history contract
- Pull request titles should use conventional commit types because squash merges feed `semantic-release` on `main`.
- Release assets should stay legible at a glance and include the semantic version plus the released commit SHA.
- The release history runbook lives in [`docs/runbooks/release-history.md`](./release-history.md).

## Current GitHub settings
- Default branch: `main`
- Merge method: allow squash merge; disable merge commits and rebase merge
- Branch cleanup: automatically delete head branches after merge
- Label: `symphony`
- Optional sandbox branch: `dev` may exist for human integration work, but Symphony's branch sync and merge target remain `main`

## Platform-enforced settings
- Pull requests: require a pull request before merging
- Reviews: require at least one approval before merge
- Reviews: require conversation resolution before merge
- Branch freshness: require branches to be up to date before merge
- Required checks on `main`:
  - `delivery-gate`
  - `observability-contract`
- Informational checks:
  - `codex-remediation`

## Required artifacts
- `.symphony/run.json`
- `.symphony/checks.json`
- `.symphony/observability.json`
- `.symphony/proof.json`
