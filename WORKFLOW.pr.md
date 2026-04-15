<!-- codex-pr-agent-config
{
  "repository": "wanderlust",
  "github": {
    "owner": "ehthind",
    "repo": "wanderlust",
    "sameRepoOnly": true,
    "optOutLabel": "codex-disabled"
  },
  "checks": {
    "allowed": ["delivery-gate", "observability-contract"],
    "rerunOnlyPatterns": [
      "socket hang up",
      "timed out",
      "timeout",
      "ecconnreset",
      "service unavailable",
      "temporarily unavailable",
      "502 bad gateway",
      "503 service unavailable",
      "504 gateway timeout",
      "rate limit"
    ],
    "manualPatterns": [
      "doppler_token",
      "permission denied",
      "resource not accessible by integration",
      "bad credentials",
      "forbidden",
      "unauthorized",
      "missing required secret",
      "no space left on device"
    ]
  },
  "limits": {
    "maxAttempts": 3,
    "maxRuntimeMinutes": 45,
    "maxLogBytes": 40000
  },
  "workpad": {
    "marker": "<!-- codex-ci-workpad -->",
    "heading": "## Codex CI Workpad"
  },
  "linear": {
    "enabled": true,
    "apiKeyEnv": "LINEAR_API_KEY",
    "workpad": {
      "heading": "## Codex Workpad",
      "remediationHeading": "### CI Remediation"
    }
  },
  "workspace": {
    "root": "~/code/wanderlust-workspaces/pr-agent",
    "installCommand": "corepack pnpm install --frozen-lockfile",
    "playwrightInstallCommand": "npx playwright install --with-deps chromium"
  },
  "state": {
    "root": "~/.config/wanderlust/pr-agent"
  },
  "codex": {
    "command": ["codex", "exec"],
    "model": "gpt-5.3-codex",
    "approvalPolicy": "never",
    "sandbox": "workspace-write",
    "config": ["model_reasoning_effort=\"xhigh\""],
    "extraArgs": ["--skip-git-repo-check"]
  }
}
-->
# Wanderlust PR Repair Workflow

You are Codex repairing a failed Wanderlust pull request from an unattended PR remediation worker.

Instructions:

1. Work only inside the provided same-repo PR workspace clone.
2. Fix only repo-local deterministic failures for the allowed required checks.
3. Do not widen scope beyond the failing checks unless a minimal supporting change is required.
4. Prefer the existing repo contracts in `AGENTS.md`, `ARCHITECTURE.md`, `PLANS.md`, `docs/runbooks/delivery-loop.md`, and `docs/runbooks/observability.md`.
5. Treat missing credentials, upstream outages, flaky external systems, or policy restrictions as blockers. If blocked, leave the code unchanged and explain the blocker clearly.
6. Keep the final message concise and structured around:
   - diagnosis
   - files changed
   - validation result
   - blocker, if any
7. Mirror remediation status into the linked Linear issue's `## Codex Workpad` comment under `### CI Remediation` when a Linear issue identifier can be resolved from the PR branch/title/body.
8. Do not merge the PR or change review state. This worker may commit and push only to the PR head branch.
