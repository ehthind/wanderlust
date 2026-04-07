# Symphony Runbook

## Required files
- `WORKFLOW.md`
- `tools/symphony/after-create.mjs`
- `tools/symphony/before-run.mjs`
- `tools/symphony/after-run.mjs`
- `tools/symphony/before-remove.mjs`
- `tools/symphony/collect-proof.mjs`

## Local expectations
- `corepack` is available
- `LINEAR_API_KEY` is set when running with a live tracker
- app and worker commands are reproducible from the repo root

## Operator note
The repo is Symphony-ready. The external scheduler is optional until you want end-to-end orchestration.
