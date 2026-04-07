# 0001 Repo Scaffold

## Summary
Create the initial Wanderlust monorepo scaffold with:
- harness-friendly root docs
- Symphony-compatible workflow contracts
- upstream Symphony integration hooks and wrappers
- web and worker boot shells
- provider and domain contracts
- mechanical repo checks

## Decisions
- Next.js app + Temporal worker
- Supabase for app state
- LangGraph for agent runtime
- Symphony compatibility is first-class, and the upstream scheduler is the preferred implementation

## Progress
- [x] repo skeleton created
- [x] upstream Symphony wrapper and workflow contract added
- [ ] app and worker shells boot locally
- [x] checks and smoke tests pass
- [ ] CI runs the baseline suite
