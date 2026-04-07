# Wanderlust Symphony Elixir

This directory is the colocated Elixir control-plane for Symphony-style orchestration inside the Wanderlust repo.

It is intentionally separate from the TypeScript product runtime:
- `apps/web` stays the traveler-facing app
- `workers/temporal` stays the durable workflow worker
- `ops/symphony/elixir` is the scheduler/operator layer that can watch Linear, create workspaces, launch Codex, and supervise long-running implementation runs

## Why Elixir here
This follows the same reasoning as the upstream Symphony reference implementation:
- long-running supervision
- fault tolerance
- scheduling and retries
- restart recovery
- operator-facing control-plane services

## Current scope
The first version here is a bootstrap skeleton:
- Mix project
- CLI entrypoint
- workflow loader
- workspace manager
- orchestrator stub
- logging and runtime config

It is not yet a full production-grade Symphony implementation.

## Run later
Once Elixir and Erlang are installed locally:

```bash
cd ops/symphony/elixir
mix deps.get
mix test
./bin/symphony ../../../WORKFLOW.md
```

## Inputs
- repo root `WORKFLOW.md`
- `LINEAR_API_KEY`
- optional `SYMPHONY_WORKSPACE_ROOT`

## Notes
- The root `WORKFLOW.md` remains the policy contract.
- The Elixir service should own polling, claiming, workspace lifecycle, and agent process supervision.
- Ticket writes still belong to the coding agent and its available tools.
