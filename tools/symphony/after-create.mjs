import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const buildWorkspaceMarker = (workspace = process.cwd()) => {
  const generatedArtifacts = [".env.local", "supabase/config.toml"].filter((relativePath) =>
    fs.existsSync(path.join(workspace, relativePath)),
  );

  return {
    createdAt: new Date().toISOString(),
    commands: ["corepack enable", "corepack pnpm install", "corepack pnpm supabase:prepare"],
    artifacts: generatedArtifacts,
  };
};

export const writeWorkspaceMarker = (workspace = process.cwd()) => {
  const markerPath = path.join(workspace, ".symphony-ready.json");
  const marker = buildWorkspaceMarker(workspace);
  fs.writeFileSync(markerPath, JSON.stringify(marker, null, 2));
  return markerPath;
};

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const markerPath = writeWorkspaceMarker();
  process.stdout.write(`prepared workspace marker at ${markerPath}\n`);
}
