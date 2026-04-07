import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { buildWorkspaceMarker, writeWorkspaceMarker } from "./after-create.mjs";

const createdDirs: string[] = [];

const createWorkspace = () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "wanderlust-after-create-"));
  createdDirs.push(workspace);
  return workspace;
};

afterEach(() => {
  while (createdDirs.length > 0) {
    const workspace = createdDirs.pop();
    if (workspace) {
      fs.rmSync(workspace, { recursive: true, force: true });
    }
  }
});

describe("buildWorkspaceMarker", () => {
  it("includes generated Supabase artifacts when present", () => {
    const workspace = createWorkspace();
    fs.mkdirSync(path.join(workspace, "supabase"), { recursive: true });
    fs.writeFileSync(path.join(workspace, ".env.local"), "", "utf8");
    fs.writeFileSync(path.join(workspace, "supabase/config.toml"), "", "utf8");

    const marker = buildWorkspaceMarker(workspace);

    expect(marker.commands).toContain("corepack pnpm supabase:prepare");
    expect(marker.artifacts).toEqual([".env.local", "supabase/config.toml"]);
  });
});

describe("writeWorkspaceMarker", () => {
  it("writes the ready marker into the workspace root", () => {
    const workspace = createWorkspace();

    const markerPath = writeWorkspaceMarker(workspace);

    expect(markerPath).toBe(path.join(workspace, ".symphony-ready.json"));
    expect(JSON.parse(fs.readFileSync(markerPath, "utf8"))).toMatchObject({
      commands: ["corepack enable", "corepack pnpm install", "corepack pnpm supabase:prepare"],
      artifacts: [],
    });
  });
});
