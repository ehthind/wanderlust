# Symphony Runbook

## Required files
- `WORKFLOW.md`
- `tools/symphony/setup-upstream.sh`
- `tools/symphony/run-upstream.sh`
- `tools/symphony/before-run.mjs`
- `tools/symphony/after-run.mjs`
- `tools/symphony/before-remove.mjs`
- `tools/symphony/collect-proof.mjs`

## Local expectations
- `corepack` is available
- `LINEAR_API_KEY` is set when running with a live tracker
- app and worker commands are reproducible from the repo root
- the upstream Symphony clone exists at `/Users/amritthind/code/symphony/elixir`, or `SYMPHONY_UPSTREAM_ROOT` points to it

## Operator note
The repo is Symphony-ready through the upstream `openai/symphony` service, not a local custom scheduler.

## Current flow
1. Run `corepack pnpm symphony:setup`.
2. Run `corepack pnpm symphony:run`.
3. The upstream service creates an empty workspace for an issue.
4. `hooks.after_create` clones Wanderlust into that workspace and installs dependencies.
5. `hooks.before_run` validates the repo map inside the cloned workspace.
6. `hooks.after_run` writes proof artifacts inside the cloned workspace.

## Deferred pieces
- automatic workspace removal after a run
- importing additional upstream Symphony skills into this repo
