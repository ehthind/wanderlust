# 0007 Hosted Supabase Dev Schema

## Summary
Create the first real Supabase schema for Wanderlust and make hosted `dev` database applies repeatable from the repo.

## Decisions
- Start with a narrow core schema that matches the current shared/domain contracts instead of over-modeling future product features.
- Seed the same Paris-centric records the in-memory repos already expose so local and hosted environments stay aligned.
- Use Doppler `wanderlust/dev` as the source of truth for the hosted database password and any future direct database connection values.
- Keep hosted schema application as a repo script so agents and humans can run the same path repeatedly.
- Force hosted helper scripts to use `DOPPLER_SCOPE=/Users/amritthind/code` so they read the broader admin login instead of the repo-scoped `local_main` token.

## Progress
- [x] add the first tracked Supabase migration for destinations, travelers, trip drafts, booking intents, partner profiles, and inbox threads
- [x] seed the core Paris records
- [x] add a hosted `db push` path that reads the remote database password from Doppler `dev`
- [x] store a durable hosted dev database password in Doppler
- [x] apply the schema and seed to the linked hosted `wanderlust-dev` project
