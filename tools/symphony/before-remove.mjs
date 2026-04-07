import fs from "node:fs";
import path from "node:path";

const markerPath = path.join(process.cwd(), ".symphony-ready.json");

if (fs.existsSync(markerPath)) {
  fs.rmSync(markerPath);
}

process.stdout.write("workspace cleanup complete\n");
