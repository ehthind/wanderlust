# 0009 Temporal Plan Trip Platform

## Summary
Make Temporal a first-class Wanderlust platform with deterministic local automation, a real cloud-ready env contract, and the first typed `Plan Trip` workflow replacing the sample worker path.

## Decisions
- Local development uses `temporal server start-dev` with worktree-derived ports and Doppler sync into `wanderlust/local_main`.
- Temporal Cloud remains the managed service target for hosted `dev`, with the worker still running on infrastructure we control.
- Railway stays the documented hosted worker target, but it does not block the core Temporal implementation.
- The first real workflow is `Plan Trip`, tied to `trip_drafts` and visible to the web app through a typed workflow runtime.

## Progress
- [ ] add Temporal local automation scripts and env schema support
- [ ] replace the sample workflow with a typed `Plan Trip` workflow and worker activities
- [ ] persist trip/workflow correlation and expose minimal web API start/status routes
- [ ] document local, cloud, and Railway worker paths
