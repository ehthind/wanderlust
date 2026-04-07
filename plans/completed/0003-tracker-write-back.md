# 0003 Tracker Write-Back

## Summary
Add an opt-in tracker write-back path for Symphony run updates without violating the upstream Symphony separation between orchestration and repo policy.

## Scope
- add workflow config for tracker write-back
- format concise run start and run finish comments for Linear
- keep the feature disabled by default
- record tracker write-back attempts in workspace run metadata

## Delivered
- [x] `tracker.write_back` config was added to `WORKFLOW.md` in the experimental local operator phase
- [x] Linear comment formatter for run start and finish updates
- [x] tracker adapter methods for comment-only write-back
- [x] orchestrator integration that records write-back events in `run.json`
- [x] tests for config parsing and comment formatting

## Notes
- this plan is historical only and was superseded by `0004-upstream-symphony-pivot`
- the workflow config from this phase was removed when the repo switched to the upstream Symphony operator
- write-back is disabled by default
- this implementation only creates comments; it does not transition issue state
- no live external writes were performed while implementing this change
