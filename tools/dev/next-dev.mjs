import { spawn } from "node:child_process";

import { derivePort } from "./port-utils.mjs";

const port = process.env.WEB_PORT ?? String(derivePort({ base: 3000, spread: 400 }));

const child = spawn("next", ["dev", "--port", port], {
  cwd: new URL("../../apps/web", import.meta.url),
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    WEB_PORT: port,
  },
});

child.on("exit", (code) => {
  process.exitCode = code ?? 0;
});
