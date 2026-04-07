import fs from "node:fs";
import path from "node:path";

const required = ["AGENTS.md", "ARCHITECTURE.md", "PLANS.md", "WORKFLOW.md"];

for (const file of required) {
  if (!fs.existsSync(path.join(process.cwd(), file))) {
    process.stderr.write(
      `Missing ${file}. Fix the repo map before starting an implementation run.\n`,
    );
    process.exit(1);
  }
}

process.stdout.write("workspace preflight passed\n");
