import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createStateStore } from "./state-store.mjs";

const createdDirs: string[] = [];

afterEach(() => {
  while (createdDirs.length > 0) {
    const dir = createdDirs.pop();
    if (dir) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("createStateStore", () => {
  it("persists PR state and run contexts on disk", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "wanderlust-pr-state-"));
    createdDirs.push(root);
    const store = createStateStore(root);

    store.savePrState({
      owner: "ehthind",
      repo: "wanderlust",
      prNumber: 42,
      status: "repairing",
    });
    const contextPath = store.writeRunContext("run-1", {
      runId: "run-1",
      prNumber: 42,
    });

    expect(store.loadPrState({ owner: "ehthind", repo: "wanderlust", prNumber: 42 })).toMatchObject(
      {
        status: "repairing",
      },
    );
    expect(store.readRunContext("run-1")).toMatchObject({
      runId: "run-1",
    });
    expect(fs.existsSync(contextPath)).toBe(true);
  });
});
