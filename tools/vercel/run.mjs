import { runVercelSync } from "./_shared.mjs";

const [, , ...args] = process.argv;

if (args.length === 0) {
  process.stderr.write("Usage: node tools/vercel/run.mjs <vercel-args...>\n");
  process.exit(1);
}

const result = runVercelSync(args);
process.exit(result.status ?? 0);
