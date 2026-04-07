import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const markerPath = path.join(process.cwd(), ".symphony-ready.json");

if (fs.existsSync(markerPath)) {
  fs.rmSync(markerPath);
}

const observabilityPath = path.join(process.cwd(), ".symphony", "observability.json");

if (fs.existsSync(observabilityPath)) {
  const observability = JSON.parse(fs.readFileSync(observabilityPath, "utf8"));
  if (observability.local?.status === "started") {
    const result = spawnSync(
      "/bin/zsh",
      [
        "-lc",
        `docker compose -f ops/observability/compose.yml -p ${observability.local.projectName} down -v`,
      ],
      {
        cwd: process.cwd(),
        encoding: "utf8",
      },
    );

    if (result.status !== 0) {
      process.stdout.write(
        "observability stack teardown failed; keep the workspace artifacts for inspection first\n",
      );
    }
  }
}

process.stdout.write("workspace cleanup complete\n");
