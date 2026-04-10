# Symphony Integration

Symphony is an orchestration layer for isolated implementation runs. It is not part of the traveler-facing runtime.

## What this repo provides
- root `WORKFLOW.md`
- repo-local Codex delivery skills under `.codex/skills/`
- repo-local PR template under `.github/pull_request_template.md`
- workspace bootstrap hooks for cloned issue workspaces
- lifecycle hooks under `tools/symphony`
- proof-of-work collection hooks
- delivery-loop policy docs
- operator docs under `ops/symphony`
- wrapper scripts that run the upstream `openai/symphony` Elixir service against this repo

## What this repo does not require
- Symphony as a product runtime dependency

## Upstream strategy
This repo now prefers the upstream `openai/symphony` Elixir implementation for the control-plane purpose:
- polling Linear
- loading `WORKFLOW.md`
- preparing isolated workspaces
- supervising Codex app-server runs

Wanderlust keeps only the repo-local policy and bootstrap layer:
- `WORKFLOW.md`
- `tools/symphony/*`
- docs and runbooks

The product runtime remains in TypeScript.

## Workflow alignment
The root `WORKFLOW.md` now stays close to the upstream `openai/symphony` reference workflow:
- upstream-style Linear status flow: `Todo`, `In Progress`, `Human Review`, `Merging`, `Rework`, `Done`
- upstream agent defaults: `max_concurrent_agents: 10` and `max_turns: 20`
- upstream Codex launch posture: `gpt-5.3-codex`, `xhigh` reasoning, `approval_policy: never`, and `workspaceWrite` turn sandboxing

Repo-specific differences remain only where Wanderlust needs local policy or bootstrap behavior:
- `tracker.project_slug` points at the Wanderlust Linear project
- `workspace.root` stays under `~/code/wanderlust-workspaces`
- repo-local lifecycle hooks still prepare the workspace, observability, and proof artifacts

## Workspace model
The current workflow uses upstream Symphony's default workspace model:
- create an empty per-issue workspace under the configured root
- run `hooks.after_create`
- clone Wanderlust into that workspace
- render the worktree-local Supabase scaffold inside the cloned repo
- run repo-local hooks inside the cloned repo

Proof artifacts still come from the repo-local `after_run` flow.

## Delivery authority
The upstream Symphony service is expected to drive the full delivery loop for this repo when the relevant credentials are available:
- claim and update Linear issues
- create or update issue branches
- prepare commits
- open or update GitHub pull requests
- move approved issues into `Merging`
- watch required GitHub checks
- squash-merge the PR through the `land` skill
- monitor merge completion
- mark Linear work `Done` after the squash merge lands on `main`

Repo-local docs and hooks define the policy; upstream Symphony remains the scheduler.

## Adjacent PR repair worker
Wanderlust now carries a separate GitHub App worker for failed required PR checks:
- `WORKFLOW.pr.md` defines the PR-remediation contract
- `tools/pr-agent/*` implements the webhook server, state store, repair runner, and workspace loop
- `tools/checks/required-checks.mjs` is the shared source of truth for required check names and commands

This worker is adjacent to Symphony, not a replacement for it:
- it acts only on same-repo pull requests
- it can diagnose, rerun, and push fixes
- it does not move review state or merge the PR

## Secrets model
Symphony itself is not responsible for injecting secrets into the workspace environment. Wanderlust uses Doppler service-token runtime fetches instead:
- `DOPPLER_TOKEN` is expected in the operator environment
- repo-local hooks and runtime code use the Doppler CLI directly
- `.symphony` artifacts record only secret availability, never values

## Expected operator flow
1. Run the upstream Symphony service against this repo's `WORKFLOW.md`.
2. Let it create an empty issue workspace under `workspace.root`.
3. Use `hooks.after_create` to clone Wanderlust into that workspace.
4. Use the repo-local hooks to validate the workspace, prepare observability, and record run metadata.
5. Let the agent implement, validate, and prepare delivery state.
6. Use the repo-local hooks to collect proof and observability artifacts.
7. Inspect the workspace-local proof artifacts before deciding whether to clean it up.
