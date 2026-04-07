# Symphony Integration

Symphony is an orchestration layer for isolated implementation runs. It is not part of the traveler-facing runtime.

## What this repo provides
- root `WORKFLOW.md`
- workspace bootstrap hooks for cloned issue workspaces
- lifecycle hooks under `tools/symphony`
- proof-of-work collection hooks
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

## Cost-control defaults
The repo uses conservative defaults intended to fit a ChatGPT Pro workflow:
- `max_concurrent_agents: 1`
- `max_turns: 8`
- `allow_subagents: false`
- `codex.model: gpt-5.1-codex-mini`

The workflow config keeps the upstream operator on a single active issue at a time by default.

## Workspace model
The current workflow uses upstream Symphony's default workspace model:
- create an empty per-issue workspace under the configured root
- run `hooks.after_create`
- clone Wanderlust into that workspace
- run repo-local hooks inside the cloned repo

Proof artifacts still come from the repo-local `after_run` flow.

## Expected operator flow
1. Run the upstream Symphony service against this repo's `WORKFLOW.md`.
2. Let it create an empty issue workspace under `workspace.root`.
3. Use `hooks.after_create` to clone Wanderlust into that workspace.
4. Use the repo-local hooks to validate and collect proof.
5. Inspect the workspace-local proof artifacts before deciding whether to clean it up.
