# PR Repair Agent

The Wanderlust PR repair agent is a GitHub App worker that watches same-repo pull requests and tries to repair failed required checks before a human has to intervene.

## Source of truth
- `WORKFLOW.pr.md` defines the repair contract, retry budget, workpad header, and Codex prompt.
- `tools/checks/required-checks.mjs` defines the required check names, commands, and stable artifact paths.
- `tools/pr-agent/*` implements webhook handling, state storage, workspace preparation, Codex execution, and PR status updates.

## Runtime expectations
- GitHub App permissions:
  - `contents:write`
  - `pull_requests:write`
  - `issues:write`
  - `checks:write`
  - `actions:read`
  - `metadata:read`
- Required environment:
  - `GITHUB_WEBHOOK_SECRET`
  - `GITHUB_APP_ID` and `GITHUB_APP_PRIVATE_KEY`, or `GITHUB_PR_AGENT_TOKEN`
  - `LINEAR_API_KEY` when CI remediation should also update the linked Linear issue workpad
- Recommended host tooling:
  - Node 22+
  - `git`
  - `unzip`
  - Playwright system dependencies
  - persistent writable roots for `workspace.root` and `state.root`

## Commands
- Start the webhook worker: `corepack pnpm pr-agent:serve`
- Replay a saved webhook payload locally: `corepack pnpm pr-agent:handle-event <event> <payload.json>`
- Hosted Railway bootstrap:
  - `corepack pnpm railway:env:pr-agent`
  - `corepack pnpm railway:deploy:pr-agent`

## Behavior
- Watches `pull_request`, `check_run`, `check_suite`, and `issue_comment` events.
- Acts only on the latest same-repo PR head SHA.
- Keeps one PR comment headed `## Codex CI Workpad` up to date.
- Mirrors the same remediation status into the linked Linear issue's `## Codex Workpad` comment under `### CI Remediation` when it can resolve an issue identifier from the PR metadata.
- Publishes a non-required `codex-remediation` check run.
- Downloads stable `.ci-artifacts/<check>.*` files from GitHub Actions before falling back to raw check summaries.
- Reuses `.symphony/run.json`, `.symphony/checks.json`, `.symphony/observability.json`, and `.symphony/proof.json` inside the isolated repair workspace.
- Supports `@codex retry` and `@codex stop` PR comments.
- Exposes `GET /healthz` for service health checks and accepts GitHub webhook `POST`s at `PR_AGENT_WEBHOOK_PATH` or `/github/webhook`.

## Guardrails
- Ignores forked PRs in v1.
- Stops after the configured repeated-failure budget.
- Treats secrets, permissions, and upstream outages as blockers instead of forcing code changes.
- Never merges or changes review state.
