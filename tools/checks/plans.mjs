import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const activePlansDir = path.join(repoRoot, "plans/active");

for (const fileName of fs.readdirSync(activePlansDir)) {
  if (!fileName.endsWith(".md")) {
    continue;
  }

  const content = fs.readFileSync(path.join(activePlansDir, fileName), "utf8");
  if (!content.startsWith("# ")) {
    process.stderr.write(
      `${fileName} must start with a top-level title so agents can summarize the plan reliably.\n`,
    );
    process.exitCode = 1;
  }
  if (!content.includes("## Summary")) {
    process.stderr.write(`${fileName} must include a Summary section.\n`);
    process.exitCode = 1;
  }
  if (!content.includes("## Progress")) {
    process.stderr.write(`${fileName} must include a Progress section.\n`);
    process.exitCode = 1;
  }
}

if (!process.exitCode) {
  process.stdout.write("plan checks passed\n");
}
