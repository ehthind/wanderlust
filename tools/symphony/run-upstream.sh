#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
UPSTREAM_ROOT="${SYMPHONY_UPSTREAM_ROOT:-$HOME/code/symphony/elixir}"
MISE_BIN="${MISE_BIN:-/opt/homebrew/bin/mise}"
WORKFLOW_PATH="${1:-$REPO_ROOT/WORKFLOW.md}"

if [[ ! -d "$UPSTREAM_ROOT" ]]; then
  echo "Missing upstream Symphony checkout at $UPSTREAM_ROOT" >&2
  echo "Run tools/symphony/setup-upstream.sh after cloning https://github.com/openai/symphony." >&2
  exit 1
fi

shift || true

cd "$UPSTREAM_ROOT"
exec "$MISE_BIN" exec -- ./bin/symphony --i-understand-that-this-will-be-running-without-the-usual-guardrails "$WORKFLOW_PATH" "$@"
