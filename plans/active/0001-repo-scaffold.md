# 0001 Repo Scaffold

## Summary
Create the initial Wanderlust monorepo scaffold with:
- harness-friendly root docs
- Symphony-compatible workflow contracts
- colocated Elixir operator skeleton for Symphony
- web and worker boot shells
- provider and domain contracts
- mechanical repo checks

## Decisions
- Next.js app + Temporal worker
- Supabase for app state
- LangGraph for agent runtime
- Symphony compatibility is first-class, but the external scheduler is optional

## Progress
- [x] repo skeleton created
- [x] colocated Elixir Symphony control-plane scaffolded
- [ ] app and worker shells boot locally
- [ ] checks and smoke tests pass
- [ ] CI runs the baseline suite
