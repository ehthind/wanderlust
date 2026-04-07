# Symphony Operator Notes

This directory is for the repo-local setup that attaches the upstream Symphony service to Wanderlust.

## Current state
- repo-local hooks and workflow contract are present
- proof collection is scriptable
- the canonical Symphony runtime lives in the separate upstream clone at `/Users/amritthind/code/symphony/elixir`

## Run now
1. set `LINEAR_API_KEY`
2. set `DOPPLER_TOKEN`
3. ensure the `doppler` CLI is installed locally
4. optionally set `WANDERLUST_SOURCE_REPO_URL` if you do not want workspaces cloned from `https://github.com/ehthind/wanderlust.git`
5. run `corepack pnpm symphony:setup`
6. run `corepack pnpm symphony:run`

## Historical note
Wanderlust previously carried a colocated experimental Symphony operator. That subtree has been removed in favor of the upstream `openai/symphony` implementation.
