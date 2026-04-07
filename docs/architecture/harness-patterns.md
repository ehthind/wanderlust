# Harness Patterns

This repo encodes four patterns taken from the Harness Engineering post and its diagrams.

## 1. Worktree-local validation loop
The app should be bootable per worktree so agents can:
- launch a local instance
- drive it with browser tooling
- compare before and after states
- rerun validation after fixes

## 2. Local observability loop
The long-term goal is a disposable observability surface per workspace:
- logs
- metrics
- traces

The first scaffold ships the interfaces, logging helpers, and runbook hooks. Full local stack provisioning can be added later.

## 3. Repository knowledge as system of record
- short root docs
- deep `docs/`
- checked-in `plans/`
- references that are versioned and discoverable by agents

## 4. Layered domains plus providers
Each domain follows:
`types -> config -> repo -> service -> runtime -> ui`

External rails enter through `packages/providers` only.
