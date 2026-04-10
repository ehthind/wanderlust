import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

const { spawnSyncMock, spawnShellSyncMock } = vi.hoisted(() => ({
  spawnSyncMock: vi.fn(),
  spawnShellSyncMock: vi.fn(),
}));

vi.mock("node:child_process", () => ({
  spawnSync: spawnSyncMock,
}));

vi.mock("../shared/shell.mjs", () => ({
  getSpawnErrorMessage: () => null,
  spawnShellSync: spawnShellSyncMock,
}));

import { preparePrWorkspace } from "./workspace.mjs";

const buildTokenizedUrl = (repositoryUrl: string, token: string) => {
  const parsed = new URL(repositoryUrl);
  parsed.username = "x-access-token";
  parsed.password = token;
  return parsed.toString();
};

describe("preparePrWorkspace", () => {
  afterEach(() => {
    spawnSyncMock.mockReset();
    spawnShellSyncMock.mockReset();
  });

  it("uses the GitHub token for the initial clone in a fresh workspace", () => {
    spawnSyncMock.mockImplementation((command: string, args: string[]) => {
      if (command === "git" && args[0] === "rev-parse") {
        return {
          status: 0,
          stdout: "abc1234\n",
          stderr: "",
        };
      }

      return {
        status: 0,
        stdout: "",
        stderr: "",
      };
    });
    spawnShellSyncMock.mockReturnValue({
      status: 0,
      stdout: "",
      stderr: "",
    });

    const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "wanderlust-pr-agent-"));
    const repositoryUrl = "https://github.com/acme/wanderlust.git";
    const token = "ghs_test_token";
    const expectedUrl = buildTokenizedUrl(repositoryUrl, token);

    preparePrWorkspace({
      workspaceRoot,
      repositoryUrl,
      owner: "acme",
      repo: "wanderlust",
      prNumber: 42,
      headRef: "feature/test-fix",
      headSha: "abc1234",
      token,
      installCommand: "corepack pnpm install --frozen-lockfile",
      playwrightInstallCommand: "npx playwright install --with-deps chromium",
    });

    const cloneCall = spawnSyncMock.mock.calls.find(
      ([command, args]) => command === "git" && args[0] === "clone",
    );
    const setUrlCall = spawnSyncMock.mock.calls.find(
      ([command, args]) => command === "git" && args[0] === "remote" && args[1] === "set-url",
    );

    expect(cloneCall?.[1][1]).toBe(expectedUrl);
    expect(setUrlCall?.[1][3]).toBe(expectedUrl);
  });
});
