# Railway Worker Hosting

## Goal
Keep Railway as the default hosted worker target without making it part of the core local-development loop.

## Current contract
- the Temporal worker is the only service intended for Railway in the first pass
- Railway is optional for local development
- Temporal Cloud still hosts the Temporal Service; Railway only hosts Wanderlust worker code
- The PR repair agent can also run as a dedicated Railway service when GitHub webhook delivery and Codex auth are wired.

## Commands
- `corepack pnpm railway:whoami`
- `corepack pnpm railway:login`
- `corepack pnpm railway:link`
- `corepack pnpm railway:env:dev`
- `corepack pnpm railway:deploy:worker`
- `corepack pnpm railway:env:pr-agent`
- `corepack pnpm railway:deploy:pr-agent`

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

## PR agent runtime env
- `RAILPACK_BUILD_APT_PACKAGES="git unzip"`
- `RAILPACK_DEPLOY_APT_PACKAGES="git unzip"`
- `RAILPACK_INSTALL_CMD=corepack pnpm install --frozen-lockfile && npm install -g @openai/codex@0.118.0`
- `RAILPACK_BUILD_CMD=npx playwright install --with-deps chromium`
- `RAILPACK_START_CMD=node tools/pr-agent/start.mjs`
- `PR_AGENT_WEBHOOK_PATH=/github/webhook`
- `GITHUB_WEBHOOK_SECRET`
- `GITHUB_PR_AGENT_TOKEN` or GitHub App credentials
- `CODEX_AUTH_JSON_B64` or `OPENAI_API_KEY`
- `LINEAR_API_KEY` when Linear workpad sync is required

`railway:env:pr-agent` seeds the Railway service with the GitHub token from `gh auth token`, the current local Codex auth/config files when present, and a generated webhook secret when one is not already provided in the shell. Reuse the emitted webhook secret when creating or updating the GitHub repository webhook.

## Next hosted step
Once the Railway service exists and is linked:
1. sync worker envs from Doppler with `corepack pnpm railway:env:dev`
2. rely on the tracked [railway.toml](/Users/amritthind/code/wanderlust/railway.toml) build/start contract for `@wanderlust/temporal-worker`
3. deploy the worker with `corepack pnpm railway:deploy:worker`
4. verify it can connect to Temporal Cloud `dev`

## PR agent deployment
Once a `pr-agent` Railway service exists:
1. sync runtime vars with `corepack pnpm railway:env:pr-agent`
2. deploy the service with `corepack pnpm railway:deploy:pr-agent`
3. generate a Railway domain for the service
4. point the GitHub repository webhook at `https://<domain>/github/webhook`
5. verify `GET /healthz` returns `200`
