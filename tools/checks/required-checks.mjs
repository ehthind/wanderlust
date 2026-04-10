import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const SURFACE_DIRS = {
  ci: ".ci-artifacts",
  workspace: ".symphony",
};

export const REQUIRED_CHECKS = Object.freeze([
  Object.freeze({
    name: "delivery-gate",
    command: "corepack pnpm check:delivery",
    description: "Runs the full delivery validation gate used for protected PRs.",
  }),
  Object.freeze({
    name: "observability-contract",
    command: "corepack pnpm check:observability",
    description: "Validates the repository observability contract and proof hooks.",
  }),
]);

export const listRequiredChecks = () => REQUIRED_CHECKS.map((check) => ({ ...check }));

export const getRequiredCheck = (name) => {
  const check = REQUIRED_CHECKS.find((candidate) => candidate.name === name);
  if (!check) {
    throw new Error(`Unknown required check: ${name}`);
  }

  return check;
};

export const getRequiredCheckArtifactPaths = ({ repoRoot, checkName, surface = "ci" }) => {
  const artifactDirName = SURFACE_DIRS[surface];
  if (!artifactDirName) {
    throw new Error(`Unsupported required check surface: ${surface}`);
  }

  const artifactDir = path.join(repoRoot, artifactDirName);
  return {
    artifactDir,
    logPath: path.join(artifactDir, `${checkName}.log`),
    resultPath: path.join(artifactDir, `${checkName}.json`),
    summaryPath: path.join(artifactDir, `${checkName}.summary.md`),
  };
};

export const renderRequiredCheckSummary = ({ check, result, surface = "ci" }) => {
  const statusIcon = result.status === "passed" ? "PASS" : "FAIL";

  return [
    `### ${check.name}`,
    "",
    `- status: ${statusIcon}`,
    `- command: \`${check.command}\``,
    `- duration_ms: ${result.durationMs}`,
    `- exit_code: ${result.exitCode}`,
    `- surface: \`${surface}\``,
    `- log_path: \`${result.logPath}\``,
    `- result_path: \`${result.resultPath}\``,
  ].join("\n");
};

export const runRequiredCheck = ({
  repoRoot,
  checkName,
  surface = "ci",
  env = process.env,
  appendStepSummary = true,
}) => {
  const check = getRequiredCheck(checkName);
  const startedAt = Date.now();
  const artifactPaths = getRequiredCheckArtifactPaths({ repoRoot, checkName, surface });

  fs.mkdirSync(artifactPaths.artifactDir, { recursive: true });

  const child = spawnSync("/bin/zsh", ["-lc", check.command], {
    cwd: repoRoot,
    env,
    encoding: "utf8",
  });

  const stdout = child.stdout ?? "";
  const stderr = child.stderr ?? "";

  if (stdout) {
    process.stdout.write(stdout);
  }

  if (stderr) {
    process.stderr.write(stderr);
  }

  fs.writeFileSync(artifactPaths.logPath, `${stdout}${stderr}`);

  const result = {
    name: check.name,
    command: check.command,
    description: check.description,
    status: child.status === 0 ? "passed" : "failed",
    exitCode: child.status ?? 1,
    durationMs: Date.now() - startedAt,
    logPath: artifactPaths.logPath,
    resultPath: artifactPaths.resultPath,
    summaryPath: artifactPaths.summaryPath,
  };

  fs.writeFileSync(artifactPaths.resultPath, `${JSON.stringify(result, null, 2)}\n`);

  const summary = renderRequiredCheckSummary({
    check,
    result,
    surface,
  });
  fs.writeFileSync(artifactPaths.summaryPath, `${summary}\n`);

  if (appendStepSummary && env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(env.GITHUB_STEP_SUMMARY, `${summary}\n\n`);
  }

  return result;
};
