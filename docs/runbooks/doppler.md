# Doppler Runbook

## Defaults
- `DOPPLER_TOKEN` is the global credential for Wanderlust local development, Symphony runs, and future CI automation.
- `DOPPLER_PROJECT` should default to `wanderlust`.
- `DOPPLER_CONFIG` should match the target environment such as `local`, `dev`, `staging`, or `prod`.
- `WANDERLUST_SECRETS_MODE=doppler` is the normal runtime path.

## CLI expectations
- the `doppler` CLI must be installed locally
- the repo treats the CLI as a first-class development tool for agents and humans
- runtime code and Symphony hooks both depend on `doppler secrets download --no-file --format json`

## Local use
- export `DOPPLER_TOKEN`
- run `corepack pnpm dev` or `corepack pnpm symphony:run`
- use `WANDERLUST_SECRETS_MODE=env` only for test or emergency local fallback paths
