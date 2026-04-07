# Symphony Operator Notes

This directory is for the operator-side setup that attaches Symphony to the Wanderlust repo.

## Current state
- repo-native hooks and workflow contract are present
- proof collection is scriptable
- the Elixir operator skeleton now lives in `ops/symphony/elixir`

## Attach later
When you are ready to run Symphony against this repo:
1. provide Linear credentials
2. install Elixir/Erlang via `mise`
3. point the orchestrator at the repository root
4. run `./bin/symphony ../../../WORKFLOW.md` from `ops/symphony/elixir`
5. let it use `WORKFLOW.md`
6. confirm the workspace root and hooks are writable/executable
