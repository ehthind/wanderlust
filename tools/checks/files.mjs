import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const ignored = new Set(["node_modules", ".next", ".turbo", "dist", ".symphony"]);

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (
      (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) &&
      fs.statSync(fullPath).size > 14_000
    ) {
      process.stderr.write(
        `${path.relative(repoRoot, fullPath)} is too large. Split it so agents can navigate and revise it safely.\n`,
      );
      process.exitCode = 1;
    }
  }
};

walk(repoRoot);

if (!process.exitCode) {
  process.stdout.write("file checks passed\n");
}
