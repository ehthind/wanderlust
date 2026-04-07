import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { loadAppEnv, resetAppEnvCache } from "./index";

const managedKeys = [
  "APP_NAME",
  "WANDERLUST_SECRETS_MODE",
  "DOPPLER_TOKEN",
  "TEMPORAL_ADDRESS",
  "TEMPORAL_NAMESPACE",
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
  it("lets .env.local override non-secret base values loaded from .env", async () => {
    const tempDir = createTempRepo({
      ".env": "APP_NAME=Base Wanderlust\nSUPABASE_URL=http://127.0.0.1:54321\n",
      ".env.local": "APP_NAME=Local Wanderlust\n",
    });

    const env = await loadAppEnv({
      source: {
        WANDERLUST_SECRETS_MODE: "env",
        TEMPORAL_ADDRESS: "localhost:7233",
        TEMPORAL_NAMESPACE: "default",
        SUPABASE_URL: "http://127.0.0.1:56530",
        SUPABASE_ANON_KEY: "anon",
        SUPABASE_SERVICE_ROLE_KEY: "service",
      },
      repoRoot: tempDir,
      forceReload: true,
    });

    expect(env.APP_NAME).toBe("Local Wanderlust");
    expect(env.SUPABASE_URL).toBe("http://127.0.0.1:56530");
  });

  it("preserves shell-provided values over .env files", async () => {
    const tempDir = createTempRepo({
      ".env": "APP_NAME=Base Wanderlust\n",
      ".env.local":
        "APP_NAME=Local Wanderlust\nSUPABASE_ANON_KEY=anon\nSUPABASE_SERVICE_ROLE_KEY=service\n",
    });

    const env = await loadAppEnv({
      source: {
        APP_NAME: "Shell Wanderlust",
        WANDERLUST_SECRETS_MODE: "env",
        TEMPORAL_ADDRESS: "localhost:7233",
        TEMPORAL_NAMESPACE: "default",
        SUPABASE_URL: "http://127.0.0.1:56530",
        SUPABASE_ANON_KEY: "shell-anon",
        SUPABASE_SERVICE_ROLE_KEY: "shell-service",
      },
      repoRoot: tempDir,
      forceReload: true,
    });

    expect(env.APP_NAME).toBe("Shell Wanderlust");
  });

  it("keeps Doppler secrets authoritative over local env file values", async () => {
    const tempDir = createTempRepo({
      ".env.local":
        "APP_NAME=Local Wanderlust\nSUPABASE_URL=http://127.0.0.1:56530\nSUPABASE_ANON_KEY=file-anon\nSUPABASE_SERVICE_ROLE_KEY=file-service\n",
    });

    const env = await loadAppEnv({
      source: {
        WANDERLUST_SECRETS_MODE: "doppler",
        DOPPLER_TOKEN: "dp.st.local_main.test",
      },
      repoRoot: tempDir,
      forceRefresh: true,
      secretLoader: async () => ({
        TEMPORAL_ADDRESS: "localhost:7233",
        TEMPORAL_NAMESPACE: "default",
        SUPABASE_URL: "http://127.0.0.1:55421",
        SUPABASE_ANON_KEY: "doppler-anon",
        SUPABASE_SERVICE_ROLE_KEY: "doppler-service",
      }),
    });

    expect(env.APP_NAME).toBe("Local Wanderlust");
    expect(env.SUPABASE_URL).toBe("http://127.0.0.1:55421");
    expect(env.SUPABASE_ANON_KEY).toBe("doppler-anon");
    expect(env.SUPABASE_SERVICE_ROLE_KEY).toBe("doppler-service");
  });

  it("reloads previously file-backed values when forceReload is requested", async () => {
    const tempDir = createTempRepo({
      ".env.local": "APP_NAME=First Wanderlust\n",
    });
    const source = {
      WANDERLUST_SECRETS_MODE: "env",
      TEMPORAL_ADDRESS: "localhost:7233",
      TEMPORAL_NAMESPACE: "default",
      SUPABASE_URL: "http://127.0.0.1:56530",
      SUPABASE_ANON_KEY: "anon",
      SUPABASE_SERVICE_ROLE_KEY: "service",
    };

    const firstEnv = await loadAppEnv({
      source,
      repoRoot: tempDir,
      forceReload: true,
    });

    expect(firstEnv.APP_NAME).toBe("First Wanderlust");
    expect(firstEnv.SUPABASE_URL).toBe("http://127.0.0.1:56530");

    fs.writeFileSync(path.join(tempDir, ".env.local"), "APP_NAME=Reloaded Wanderlust\n", "utf8");

    const reloadedEnv = await loadAppEnv({
      source,
      repoRoot: tempDir,
      forceReload: true,
    });

    expect(reloadedEnv.APP_NAME).toBe("Reloaded Wanderlust");
    expect(reloadedEnv.SUPABASE_URL).toBe("http://127.0.0.1:56530");
  });
});
