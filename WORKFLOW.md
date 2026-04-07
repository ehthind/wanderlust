---
tracker:
  kind: linear
  api_key: $LINEAR_API_KEY
  project_slug: wanderlust
  active_states:
    - Todo
    - In Progress
  terminal_states:
    - Done
    - Closed
    - Cancelled
    - Canceled
    - Duplicate
workspace:
  root: .symphony/workspaces
hooks:
  after_create: node tools/symphony/after-create.mjs
  before_run: node tools/symphony/before-run.mjs
  after_run: node tools/symphony/after-run.mjs
  before_remove: node tools/symphony/before-remove.mjs
  timeout_ms: 60000
agent:
  max_concurrent_agents: 1
  max_turns: 8
  allow_subagents: false
codex:
  command: codex app-server
  model: gpt-5.1-codex-mini
  approval_policy: on-request
  thread_sandbox: workspace-write
  turn_timeout_ms: 3600000
---

# Wanderlust implementation run

You are working in the Wanderlust monorepo.

## Expected workflow
1. Read `AGENTS.md`, `ARCHITECTURE.md`, and `PLANS.md`.
2. Read the relevant plan under `plans/active/`.
3. Use the repo-local docs as the source of truth before making assumptions.
4. Keep all changes inside the assigned workspace.
5. Prove the work with local checks and concise evidence.

## Required outcomes
- preserve domain layering and provider boundaries
- update docs or plans when behavior changes
- leave proof-of-work artifacts that another agent can inspect
