import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { loadPrWorkflow, parsePrWorkflowSource } from "./workflow.mjs";

const createdDirs: string[] = [];

afterEach(() => {
  while (createdDirs.length > 0) {
    const dir = createdDirs.pop();
    if (dir) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("parsePrWorkflowSource", () => {
  it("extracts the JSON config block and prompt body", () => {
    const parsed = parsePrWorkflowSource(`<!-- codex-pr-agent-config
{"repository":"wanderlust","github":{"owner":"ehthind","repo":"wanderlust","sameRepoOnly":true,"optOutLabel":"codex-disabled"},"checks":{"allowed":["delivery-gate"],"rerunOnlyPatterns":[],"manualPatterns":[]},"limits":{"maxAttempts":3,"maxRuntimeMinutes":45,"maxLogBytes":1000},"workpad":{"marker":"<!-- codex-ci-workpad -->","heading":"## Codex CI Workpad"},"linear":{"enabled":true,"apiKeyEnv":"LINEAR_API_KEY","workpad":{"heading":"## Codex Workpad","remediationHeading":"### CI Remediation"}},"workspace":{"root":"~/tmp/workspaces","installCommand":"pnpm install","playwrightInstallCommand":"playwright install"},"state":{"root":"~/tmp/state"},"codex":{"command":["codex","exec"],"model":"gpt-5.3-codex","approvalPolicy":"never","sandbox":"workspace-write","config":[],"extraArgs":[]}}
-->
# Prompt

repair the PR
`);

    expect(parsed.config.repository).toBe("wanderlust");
    expect(parsed.promptTemplate).toContain("repair the PR");
  });
});

describe("loadPrWorkflow", () => {
  it("loads the repository workflow file with valid required checks", () => {
    const workflow = loadPrWorkflow(path.join(process.cwd(), "WORKFLOW.pr.md"));

    expect(workflow.config.checks.allowed).toEqual(["delivery-gate", "observability-contract"]);
    expect(workflow.promptTemplate).toContain(
      "You are Codex repairing a failed Wanderlust pull request",
    );
  });

  it("allows env overrides for workspace and state roots", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "wanderlust-pr-workflow-"));
    createdDirs.push(tempDir);

    const workflow = loadPrWorkflow(path.join(process.cwd(), "WORKFLOW.pr.md"), {
      ...process.env,
      WANDERLUST_PR_AGENT_WORKSPACE_ROOT: path.join(tempDir, "workspaces"),
      WANDERLUST_PR_AGENT_STATE_ROOT: path.join(tempDir, "state"),
    });

    expect(workflow.config.workspace.root).toBe(path.join(tempDir, "workspaces"));
    expect(workflow.config.state.root).toBe(path.join(tempDir, "state"));
  });
});
