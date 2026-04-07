---
tracker:
  kind: linear
  api_key: $LINEAR_API_KEY
  project_slug: wanderlust-a9fe18476a47
  active_states:
    - Todo
    - In Progress
  terminal_states:
    - Done
    - Closed
    - Cancelled
    - Canceled
    - Duplicate
polling:
  interval_ms: 30000
workspace:
  root: ~/code/wanderlust-workspaces
hooks:
  after_create: |
    SOURCE_REPO_URL="${WANDERLUST_SOURCE_REPO_URL:-https://github.com/ehthind/wanderlust.git}"
    git clone "$SOURCE_REPO_URL" .
    corepack enable
    corepack pnpm install
    corepack pnpm supabase:prepare
    node tools/symphony/after-create.mjs
  before_run: |
    node tools/symphony/before-run.mjs
  after_run: |
    node tools/symphony/after-run.mjs
  before_remove: |
    node tools/symphony/before-remove.mjs
  timeout_ms: 60000
agent:
  max_concurrent_agents: 1
  max_turns: 8
codex:
  command: codex app-server
  model: gpt-5.1-codex-mini
  approval_policy: on-request
  thread_sandbox: workspace-write
  turn_timeout_ms: 3600000
---

# Wanderlust implementation run

You are working on a Wanderlust Linear issue inside an isolated workspace clone of the repository.

Issue context:
Identifier: {{ issue.identifier }}
Title: {{ issue.title }}
Current status: {{ issue.state }}
Labels: {{ issue.labels }}
URL: {{ issue.url }}

Description:
{% if issue.description %}
{{ issue.description }}
{% else %}
No description provided.
{% endif %}

## Required workflow
1. Read `AGENTS.md`, `ARCHITECTURE.md`, and `PLANS.md`.
2. Read the relevant plan under `plans/active/`.
3. Read `docs/runbooks/delivery-loop.md` and `docs/runbooks/observability.md` before attempting delivery or cleanup.
4. Use the repo-local docs as the source of truth before making assumptions.
5. Work only inside this workspace clone.
6. Prove the work with local checks and concise evidence in the workspace artifacts.

## Required outcomes
- preserve domain layering and provider boundaries
- update docs or plans when behavior changes
- leave proof-of-work artifacts that another agent can inspect
- keep `.symphony/run.json`, `.symphony/checks.json`, `.symphony/observability.json`, and `.symphony/proof.json` consistent
- prepare a branch, commit, and PR-ready delivery record when the run reaches a clean handoff point

## Delivery contract
- Claim `Todo` work by moving it to `In Progress`.
- Stay in `In Progress` while local checks, PR validation, or merge monitoring are still active.
- Use the issue branch when Linear provides one; otherwise derive a deterministic issue branch.
- Prefer draft PRs until the local validation suite is green.
- Enable GitHub auto-merge instead of bypassing branch protection.
- Move the issue to `Done` only after the protected `main` branch merge succeeds.
- If the run is blocked, leave the issue in `In Progress` and record the blocker in the run artifacts.

## Observability contract
- Treat local observability as the primary debugging surface for agent runs.
- Emit structured logs, readiness data, and service context for the web app, domain layer, Temporal worker, and the Symphony run itself.
- Keep local observability disposable and workspace-scoped.
- Treat managed exports such as Sentry and PostHog as secondary sinks; local runs must still work without them.
