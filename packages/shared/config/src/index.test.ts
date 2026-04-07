import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { loadAppEnv, resetAppEnvCache } from "./index";

const managedKeys = [
  "APP_NAME",
  "WANDERLUST_SECRETS_MODE",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const createdDirs: string[] = [];

const createTempRepo = (files: Record<string, string>) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "wanderlust-config-"));
  createdDirs.push(tempDir);

  for (const [relativePath, content] of Object.entries(files)) {
    const filePath = path.join(tempDir, relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, "utf8");
  }

  return tempDir;
};

afterEach(() => {
  for (const key of managedKeys) {
    delete process.env[key];
  }

  resetAppEnvCache();

  while (createdDirs.length > 0) {
    const tempDir = createdDirs.pop();
    if (tempDir) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
});

describe("loadAppEnv", () => {
  it("lets .env.local override values loaded from .env", async () => {
    const tempDir = createTempRepo({
      ".env": "APP_NAME=Base Wanderlust\nSUPABASE_URL=http://127.0.0.1:54321\n",
      ".env.local":
        "APP_NAME=Local Wanderlust\nSUPABASE_URL=http://127.0.0.1:56530\nSUPABASE_ANON_KEY=anon\nSUPABASE_SERVICE_ROLE_KEY=service\n",
    });

    process.env.WANDERLUST_SECRETS_MODE = "env";

    const env = await loadAppEnv({
      source: process.env,
      repoRoot: tempDir,
      forceReload: true,
    });

    expect(env.APP_NAME).toBe("Local Wanderlust");
    expect(env.SUPABASE_URL).toBe("http://127.0.0.1:56530");
  });

  it("preserves shell-provided values over .env files", async () => {
    const tempDir = createTempRepo({
      ".env": "APP_NAME=Base Wanderlust\n",
      ".env.local": "APP_NAME=Local Wanderlust\nSUPABASE_ANON_KEY=anon\nSUPABASE_SERVICE_ROLE_KEY=service\n",
    });

    process.env.APP_NAME = "Shell Wanderlust";
    process.env.WANDERLUST_SECRETS_MODE = "env";
    process.env.SUPABASE_URL = "http://127.0.0.1:56530";
    process.env.SUPABASE_ANON_KEY = "shell-anon";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "shell-service";

    const env = await loadAppEnv({
      source: process.env,
      repoRoot: tempDir,
      forceReload: true,
    });

    expect(env.APP_NAME).toBe("Shell Wanderlust");
  });

  it("reloads previously file-backed values when forceReload is requested", async () => {
    const tempDir = createTempRepo({
      ".env.local":
        "APP_NAME=First Wanderlust\nSUPABASE_URL=http://127.0.0.1:56530\nSUPABASE_ANON_KEY=anon\nSUPABASE_SERVICE_ROLE_KEY=service\n",
    });

    process.env.WANDERLUST_SECRETS_MODE = "env";

    const firstEnv = await loadAppEnv({
      source: process.env,
      repoRoot: tempDir,
      forceReload: true,
    });

    expect(firstEnv.APP_NAME).toBe("First Wanderlust");
    expect(firstEnv.SUPABASE_URL).toBe("http://127.0.0.1:56530");

    fs.writeFileSync(
      path.join(tempDir, ".env.local"),
      "APP_NAME=Reloaded Wanderlust\nSUPABASE_URL=http://127.0.0.1:56531\nSUPABASE_ANON_KEY=anon\nSUPABASE_SERVICE_ROLE_KEY=service\n",
      "utf8",
    );

    const reloadedEnv = await loadAppEnv({
      source: process.env,
      repoRoot: tempDir,
      forceReload: true,
    });

    expect(reloadedEnv.APP_NAME).toBe("Reloaded Wanderlust");
    expect(reloadedEnv.SUPABASE_URL).toBe("http://127.0.0.1:56531");
  });
});
