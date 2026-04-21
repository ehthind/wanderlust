# Release History

## Goal
Publish versioned GitHub releases from `main` with enough metadata to track how Wanderlust changes over time.

## Trigger model
- `semantic-release` runs only on pushes to `main`.
- The release job waits for `delivery-gate` and `observability-contract` to pass in CI.
- The repo uses squash merge, so the merged PR title becomes the semantic-release signal.

## PR title contract
Use a conventional commit title on the pull request so the squash commit on `main` is machine-readable:
- `feat: ...` for user-visible features
- `fix: ...` for bug fixes
- `perf: ...` for performance work
- `refactor: ...`, `docs: ...`, `test: ...`, `chore: ...`, `ci: ...`, or `build: ...` for the other common maintenance paths

Breaking changes should include `!` in the type line or a `BREAKING CHANGE:` footer in the merged commit body.

## Published artifacts
Each GitHub release uploads:
- `wanderlust-release-metadata-vX.Y.Z-<sha>.json`
- `wanderlust-growth-snapshot-vX.Y.Z-<sha>.md`
- `wanderlust-web-build-vX.Y.Z-<sha>.tgz`
- `wanderlust-required-checks-vX.Y.Z-<sha>.tgz`

The growth snapshot records file and line-count trends for the iOS app, web app, domain layer, schemas, docs, and active plans so release history stays easy to compare over time.

## Local dry run
1. Run `corepack pnpm install --frozen-lockfile`.
2. Run `corepack pnpm release:dry-run`.
3. If you want to inspect asset generation directly, run `node tools/release/build-release-artifacts.mjs --version 0.0.0-local --tag v0.0.0-local --git-head $(git rev-parse HEAD)`.

The local asset script writes scratch output to `.release-artifacts/` and expects any downloaded required-check artifacts under `.release-inputs/required-checks/`.
