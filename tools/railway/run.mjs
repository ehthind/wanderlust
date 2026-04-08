import { spawn } from "node:child_process";

const argv = process.argv.slice(2);

if (argv.length === 0) {
  process.stderr.write("Usage: node tools/railway/run.mjs <railway-args...>\n");
  process.exit(1);
}

const child = spawn("railway", argv, {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => {
  process.exitCode = code ?? 0;
});
