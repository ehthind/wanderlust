#!/usr/bin/env bash
set -euo pipefail

UPSTREAM_ROOT="${SYMPHONY_UPSTREAM_ROOT:-$HOME/code/symphony/elixir}"
MISE_BIN="${MISE_BIN:-/opt/homebrew/bin/mise}"

if [[ ! -d "$UPSTREAM_ROOT" ]]; then
  echo "Missing upstream Symphony checkout at $UPSTREAM_ROOT" >&2
  echo "Clone https://github.com/openai/symphony to $HOME/code/symphony or set SYMPHONY_UPSTREAM_ROOT." >&2
  exit 1
fi

cd "$UPSTREAM_ROOT"
"$MISE_BIN" trust
"$MISE_BIN" install
"$MISE_BIN" exec -- mix setup
"$MISE_BIN" exec -- mix build
