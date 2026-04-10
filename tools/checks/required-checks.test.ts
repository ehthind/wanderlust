import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { runRequiredCheck } from "./required-checks.mjs";

const tempDirs = [];

const makeRepo = () => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "wanderlust-required-checks-"));
  tempDirs.push(repoRoot);
  return repoRoot;
};

afterEach(() => {
  for (const repoRoot of tempDirs.splice(0)) {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
});

describe("runRequiredCheck", () => {
  it("writes CI artifacts when the shell cannot be spawned", () => {
    const repoRoot = makeRepo();
    const stderrWrite = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const result = runRequiredCheck({
      repoRoot,
      checkName: "observability-contract",
      appendStepSummary: false,
      spawn: () => ({
        status: null,
        stdout: "",
        stderr: "",
        error: new Error("spawn /bin/zsh ENOENT"),
      }),
    });
    stderrWrite.mockRestore();

    expect(result.status).toBe("failed");
    expect(result.exitCode).toBe(1);
    expect(result.spawnError).toContain("spawn /bin/zsh ENOENT");
    expect(fs.existsSync(path.join(repoRoot, ".ci-artifacts", "observability-contract.log"))).toBe(
      true,
    );
    expect(
      fs.readFileSync(path.join(repoRoot, ".ci-artifacts", "observability-contract.log"), "utf8"),
    ).toContain("spawn /bin/zsh ENOENT");
  });
});
