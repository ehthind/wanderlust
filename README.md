# Wanderlust

Wanderlust is an agent-first travel product scaffold built to be legible to coding agents, Symphony, and human reviewers at the same time.

## What this repo optimizes for
- small root instructions and deep repo-local knowledge
- explicit domain layering and provider boundaries
- checked-in execution plans
- worktree-local app boot and proof-of-work collection
- Symphony-compatible workflow contracts without making Symphony a runtime dependency
- a colocated Elixir control-plane for Symphony orchestration

## Core commands
- `corepack pnpm install`
- `corepack pnpm dev`
- `corepack pnpm test`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm check`
- `cd ops/symphony/elixir && mix setup`

## Conservative Codex defaults
- one active issue at a time
- low default turn budget
- subagents disabled by default
- `gpt-5.1-codex-mini` as the default model hint in `WORKFLOW.md`

## First slice
- `apps/web`: public product shell with Discover placeholder and health route
- `workers/temporal`: sample Temporal worker and workflow
- `packages/domains`: layered business-domain source
- `packages/providers`: stable provider interfaces plus local fakes
- `packages/shared`: schemas, config, observability, logging, testing, and UI helpers
- `WORKFLOW.md`: Symphony contract for isolated implementation runs
- `ops/symphony/elixir`: colocated Elixir scheduler skeleton for Symphony-style work orchestration
