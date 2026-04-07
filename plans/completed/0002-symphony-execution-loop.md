# 0002 Symphony Execution Loop

## Summary
Turn the colocated Elixir Symphony operator into a real local execution loop instead of a polling-only scaffold.

## Scope
- create deterministic per-issue workspaces
- use detached git worktrees under `.symphony/workspaces`
- write run and lock metadata inside each workspace
- execute lifecycle hooks around each run
- launch the configured Codex command and stream logs into the workspace
- keep the operator cost-aware by honoring the existing concurrency cap

## Delivered
- [x] worktree-backed `WorkspaceManager.ensure_workspace/3`
- [x] lock and run metadata persisted under `workspace/.symphony/`
- [x] `HookRunner` for `after_create`, `before_run`, and `after_run`
- [x] `CodexLauncher` with Port-based process supervision
- [x] orchestrator launch/finalize flow for active Linear issues
- [x] focused Elixir tests for workflow helpers, workspaces, hooks, and launcher

## Notes
- this plan is historical only and was superseded by `0004-upstream-symphony-pivot`
- workspaces are left on disk for inspection; automatic cleanup is still deferred
- the operator still polls Linear read-only and does not yet post status updates back
