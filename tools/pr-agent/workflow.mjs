import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { z } from "zod";

import { REQUIRED_CHECKS } from "../checks/required-checks.mjs";

const WORKFLOW_CONFIG_MARKER = /<!--\s*codex-pr-agent-config\s*\n([\s\S]*?)\n-->\s*/;
const allowedCheckNames = new Set(REQUIRED_CHECKS.map((check) => check.name));

const workflowSchema = z.object({
  repository: z.string().min(1),
  github: z.object({
    owner: z.string().min(1),
    repo: z.string().min(1),
    sameRepoOnly: z.boolean().default(true),
    optOutLabel: z.string().min(1).default("codex-disabled"),
  }),
  checks: z.object({
    allowed: z.array(z.string().min(1)).nonempty(),
    rerunOnlyPatterns: z.array(z.string()).default([]),
    manualPatterns: z.array(z.string()).default([]),
  }),
  limits: z.object({
    maxAttempts: z.number().int().positive().default(3),
    maxRuntimeMinutes: z.number().int().positive().default(45),
    maxLogBytes: z.number().int().positive().default(40000),
  }),
  workpad: z.object({
    marker: z.string().min(1),
    heading: z.string().min(1),
  }),
  linear: z.object({
    enabled: z.boolean().default(true),
    apiKeyEnv: z.string().min(1).default("LINEAR_API_KEY"),
    workpad: z.object({
      heading: z.string().min(1).default("## Codex Workpad"),
      remediationHeading: z.string().min(1).default("### CI Remediation"),
    }),
  }),
  workspace: z.object({
    root: z.string().min(1),
    installCommand: z.string().min(1),
    playwrightInstallCommand: z.string().min(1),
  }),
  state: z.object({
    root: z.string().min(1),
  }),
  codex: z.object({
    command: z.array(z.string().min(1)).nonempty(),
    model: z.string().min(1),
    approvalPolicy: z.string().min(1),
    sandbox: z.string().min(1),
    config: z.array(z.string()).default([]),
    extraArgs: z.array(z.string()).default([]),
  }),
});

const expandHome = (value) => {
  if (!value.startsWith("~/")) {
    return value;
  }

  return path.join(os.homedir(), value.slice(2));
};

const normalizeWorkflowConfig = (config, env) => ({
  ...config,
  workspace: {
    ...config.workspace,
    root: expandHome(env.WANDERLUST_PR_AGENT_WORKSPACE_ROOT ?? config.workspace.root),
  },
  state: {
    ...config.state,
    root: expandHome(env.WANDERLUST_PR_AGENT_STATE_ROOT ?? config.state.root),
  },
});

export const parsePrWorkflowSource = (source, env = process.env) => {
  const configMatch = source.match(WORKFLOW_CONFIG_MARKER);
  if (!configMatch) {
    throw new Error("WORKFLOW.pr.md is missing the codex-pr-agent-config block.");
  }

  const rawConfig = JSON.parse(configMatch[1]);
  const parsedConfig = workflowSchema.parse(rawConfig);

  for (const checkName of parsedConfig.checks.allowed) {
    if (!allowedCheckNames.has(checkName)) {
      throw new Error(`WORKFLOW.pr.md references unknown required check: ${checkName}`);
    }
  }

  return {
    config: normalizeWorkflowConfig(parsedConfig, env),
    promptTemplate: source.slice(configMatch[0].length).trim(),
  };
};

export const loadPrWorkflow = (filePath, env = process.env) =>
  parsePrWorkflowSource(
    fs.readFileSync(filePath ?? path.join(process.cwd(), "WORKFLOW.pr.md"), "utf8"),
    env,
  );
