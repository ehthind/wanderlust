# 0015 Semantic Release History

## Summary
Add a semantic-release pipeline on `main` that turns squash-merged conventional PR titles into versioned GitHub releases. Each release should publish clearly labeled artifacts so the team can inspect build outputs and compare repo growth over time without reconstructing CI state by hand.

## Decisions
- Keep the existing `delivery-gate` and `observability-contract` jobs as the release gate.
- Run `semantic-release` only after those required checks pass on pushes to `main`.
- Use squash-merge PR titles as the semantic-release signal, so PR titles must follow conventional commit types.
- Publish release assets that are honest about the current repo surfaces: web build output, required-check proof, release metadata, and a growth snapshot.
- Keep release scratch directories out of git and document the local dry-run path.

## Progress
- [x] define the release-history goal and artifact contract
- [x] add repo config and scripts for semantic-release plus labeled release assets
- [x] extend CI so `main` publishes releases only after required checks pass
- [x] document the PR title convention and local dry-run workflow
