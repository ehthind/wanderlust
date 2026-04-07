import crypto from "node:crypto";
import path from "node:path";

const getWorktreeOffset = ({ cwd = process.cwd(), spread = 200 } = {}) => {
  const worktreeName = path.basename(cwd);
  const digest = crypto.createHash("sha1").update(worktreeName).digest("hex");
  return Number.parseInt(digest.slice(0, 4), 16) % spread;
};

export const derivePort = ({ cwd = process.cwd(), base = 3000, spread = 200 } = {}) =>
  base + getWorktreeOffset({ cwd, spread });

export const derivePortBlock = ({
  cwd = process.cwd(),
  base = 55000,
  size = 6,
  spread = 400,
} = {}) => {
  const start = base + getWorktreeOffset({ cwd, spread }) * size;
  return Array.from({ length: size }, (_, index) => start + index);
};
