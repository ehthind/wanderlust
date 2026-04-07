import crypto from "node:crypto";
import path from "node:path";

export const derivePort = ({ cwd = process.cwd(), base = 3000, spread = 200 } = {}) => {
  const worktreeName = path.basename(cwd);
  const digest = crypto.createHash("sha1").update(worktreeName).digest("hex");
  const offset = Number.parseInt(digest.slice(0, 4), 16) % spread;

  return base + offset;
};
