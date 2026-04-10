import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ensureDir = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
};

const readJson = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
};

const writeJson = (filePath, value) => {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
};

const repoKey = (owner, repo) => `${owner}__${repo}`.replace(/[^a-zA-Z0-9._-]+/g, "-");

export const generateRunId = () =>
  `${new Date().toISOString().replace(/[:.]/g, "-")}-${crypto.randomBytes(4).toString("hex")}`;

export const createStateStore = (root) => {
  const baseRoot = ensureDir(root);
  const prDir = ensureDir(path.join(baseRoot, "prs"));
  const runDir = ensureDir(path.join(baseRoot, "runs"));

  const prStatePath = ({ owner, repo, prNumber }) =>
    path.join(prDir, repoKey(owner, repo), `pr-${prNumber}.json`);

  const runContextPath = (runId) => path.join(runDir, `${runId}.json`);

  return {
    root: baseRoot,
    loadPrState: (identity) => readJson(prStatePath(identity)),
    savePrState: (state) => {
      writeJson(
        prStatePath({
          owner: state.owner,
          repo: state.repo,
          prNumber: state.prNumber,
        }),
        state,
      );
      return state;
    },
    writeRunContext: (runId, context) => {
      const filePath = runContextPath(runId);
      writeJson(filePath, context);
      return filePath;
    },
    readRunContext: (runId) => readJson(runContextPath(runId)),
    deleteRunContext: (runId) => {
      const filePath = runContextPath(runId);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    },
  };
};
