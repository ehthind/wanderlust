# Symphony Integration

Symphony is an orchestration layer for isolated implementation runs. It is not part of the traveler-facing runtime.

## What this repo provides
- root `WORKFLOW.md`
- workspace root under `.symphony/workspaces`
- lifecycle hooks under `tools/symphony`
- proof-of-work collection hooks
- operator docs under `ops/symphony`
- a colocated Elixir operator skeleton under `ops/symphony/elixir`

## What this repo does not require
- Symphony as a product runtime dependency

## Colocated Elixir strategy
This repo now uses Elixir for the Symphony control-plane purpose:
- polling Linear
- loading `WORKFLOW.md`
- owning orchestration state
- preparing workspaces
- supervising Codex app-server runs

The product runtime remains in TypeScript.

## Cost-control defaults
The repo uses conservative defaults intended to fit a ChatGPT Pro workflow:
- `max_concurrent_agents: 1`
- `max_turns: 8`
- `allow_subagents: false`
- `codex.model: gpt-5.1-codex-mini`

The Elixir orchestrator enforces the concurrency cap when selecting active issues from Linear.

## Expected operator flow
1. Point Symphony at this repo.
2. Let it read `WORKFLOW.md`.
3. Let it create a workspace under `.symphony/workspaces`.
4. Use the hooks to prepare the environment, run Codex, and collect evidence.
