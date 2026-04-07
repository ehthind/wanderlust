import fs from "node:fs";
import path from "node:path";

const workspace = process.cwd();
const markerPath = path.join(workspace, ".symphony-ready.json");

const marker = {
  createdAt: new Date().toISOString(),
  commands: ["corepack enable", "corepack pnpm install"],
};

fs.writeFileSync(markerPath, JSON.stringify(marker, null, 2));
process.stdout.write(`prepared workspace marker at ${markerPath}\n`);
