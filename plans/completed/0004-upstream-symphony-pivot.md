# 0004 Upstream Symphony Pivot

## Summary
Switch Wanderlust from the experimental colocated Symphony operator to the upstream `openai/symphony` implementation.

## Delivered
- [x] cloned upstream Symphony under `/Users/amritthind/code/symphony`
- [x] updated `WORKFLOW.md` to match the upstream config schema
- [x] changed workspace bootstrap to clone Wanderlust into empty issue workspaces
- [x] added repo wrappers for upstream setup and launch
- [x] smoke-tested the upstream service against the Wanderlust project
- [x] removed the old colocated Symphony operator subtree from this repo

## Notes
- the repo-local Symphony surface is now just `WORKFLOW.md`, `tools/symphony/*`, and the docs/runbooks
- live issue execution still depends on active Linear work being available
