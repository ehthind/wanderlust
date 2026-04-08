# Railway Worker Hosting

## Goal
Keep Railway as the default hosted worker target without making it part of the core local-development loop.

## Current contract
- the Temporal worker is the only service intended for Railway in the first pass
- Railway is optional for local development
- Temporal Cloud still hosts the Temporal Service; Railway only hosts Wanderlust worker code

## Commands
- `corepack pnpm railway:whoami`
- `corepack pnpm railway:login`
- `corepack pnpm railway:link`
- `corepack pnpm railway:env:dev`
- `corepack pnpm railway:deploy:worker`

`railway:env:dev` projects the worker-relevant variables from Doppler `wanderlust/dev` into the linked Railway service. It expects:
- `RAILWAY_SERVICE` or the default `wanderlust-temporal-worker`
- `RAILWAY_ENVIRONMENT` or the default `dev`

## Expected Railway runtime env
- `TEMPORAL_ADDRESS`
- `TEMPORAL_NAMESPACE`
- `TEMPORAL_TASK_QUEUE`
- `TEMPORAL_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `SENTRY_DSN`
- `POSTHOG_HOST`
- `POSTHOG_KEY`

## Next hosted step
Once the Railway service exists and is linked:
1. sync worker envs from Doppler with `corepack pnpm railway:env:dev`
2. rely on the tracked [railway.toml](/Users/amritthind/code/wanderlust/railway.toml) build/start contract for `@wanderlust/temporal-worker`
3. deploy the worker with `corepack pnpm railway:deploy:worker`
4. verify it can connect to Temporal Cloud `dev`
