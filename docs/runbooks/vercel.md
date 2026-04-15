# Vercel Runbook

## Goal
Deploy only the Wanderlust web app to Vercel while keeping the Temporal worker and other long-running runtime outside Vercel.

## Deployment model
- Vercel owns `apps/web` only.
- The worker stays external and the web app treats it as an external dependency through `TEMPORAL_ADDRESS` and `TEMPORAL_NAMESPACE`.
- Doppler remains the source of truth for runtime config.
- Vercel environment variables are a projection of Doppler, not a separate secrets authority.
- Preview and production deployments should come from the Git-connected project flow.
- Manual CLI deploys exist as a fallback, not the primary delivery path.

## Local Vercel state
- the repo stores Vercel CLI state under `.vercel-agent/`
- the wrapper scripts also force `XDG_CACHE_HOME` into `.vercel-agent/cache`
- this keeps Vercel agent-friendly and avoids home-directory cache drift

## One-time setup
1. Finish the core repo setup in [`setup.md`](./setup.md).
2. Authenticate:
   - `corepack pnpm vercel:login`
3. Create or link the repo project:
   - `corepack pnpm vercel:link`
4. In the Vercel project, use the Next.js app at `apps/web` as the project root directory.
5. Sync runtime envs from Doppler:
   - `corepack pnpm vercel:env:development`
   - `corepack pnpm vercel:env:preview`
   - `corepack pnpm vercel:env:prod`

## Runtime env contract
Preview and development pull from Doppler `wanderlust/dev`.

Production pulls from Doppler `wanderlust/prd`.

Managed envs synced into Vercel:
- `APP_NAME`
- `SERVICE_NAME=wanderlust-web`
- `WANDERLUST_SECRETS_MODE=env`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TEMPORAL_ADDRESS`
- `TEMPORAL_NAMESPACE`
- `OPENAI_API_KEY` when the web app needs it
- `INTERCOM_ACCESS_TOKEN`
- `SENDGRID_API_KEY`
- `SENTRY_DSN`
- `POSTHOG_HOST`
- `POSTHOG_KEY`

The web app derives the browser-facing Sentry DSN, release, and environment from these managed envs during the Next.js build. No separate Doppler key is required for browser Sentry.

Values intentionally not synced:
- local-only metadata such as `WORKSPACE_NAME`, `SYMPHONY_*`, `WEB_PORT`
- database admin secrets such as `SUPABASE_DB_PASSWORD`
- Doppler credentials

## Commands
- `corepack pnpm vercel:whoami`
- `corepack pnpm vercel:login`
- `corepack pnpm vercel:link`
- `corepack pnpm vercel:pull:preview`
- `corepack pnpm vercel:pull:production`
- `corepack pnpm vercel:env:development`
- `corepack pnpm vercel:env:preview`
- `corepack pnpm vercel:env:prod`
- `corepack pnpm vercel:deploy:preview`
- `corepack pnpm vercel:deploy:prod`

## Notes
- `vercel:link` uses the repo root so the monorepo stays intact. The linked Vercel project should still point at `apps/web` as its root directory.
- Use `vercel:pull:*` after linking to materialize local project metadata and confirm the project/environment mapping.
- Preview deployments should be the normal PR surface once the Git integration is connected.
- Sentry stays additive to the local observability loop; the web app still boots without `SENTRY_DSN`.
