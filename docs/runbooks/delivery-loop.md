# Delivery Loop

This repo is designed for a full autonomous delivery loop with protected-branch gates.

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
7. Convert the PR to ready once the local validation gate is green.
8. Enable GitHub auto-merge and let branch protection decide when it lands.
9. Move the Linear issue to `Done` after merge lands on `main`.

## Stop conditions
- If local validation fails, do not progress to PR readiness.
- If CI or branch protection fails, leave the issue in `In Progress`.
- If delivery is blocked, record the blocker in `.symphony/run.json` and `.symphony/proof.json`.

## Required artifacts
- `.symphony/run.json`
- `.symphony/checks.json`
- `.symphony/observability.json`
- `.symphony/proof.json`
