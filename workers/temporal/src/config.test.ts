import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { loadAppEnv, resetAppEnvCache } from "@wanderlust/shared-config";

const createdDirs: string[] = [];

const createTempRepo = () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "wanderlust-temporal-config-"));
  createdDirs.push(tempDir);
  return tempDir;
};

const restoreEnv = (snapshot: NodeJS.ProcessEnv) => {
  for (const key of Object.keys(process.env)) {
    if (!(key in snapshot)) {
      delete process.env[key];
    }
  }

  Object.assign(process.env, snapshot);
};

describe("loadAppEnv", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    restoreEnv(originalEnv);
    resetAppEnvCache();

    while (createdDirs.length > 0) {
      const tempDir = createdDirs.pop();
      if (tempDir) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }
  });

  it("loads secrets directly from env in env mode", async () => {
    const env = await loadAppEnv({
      forceRefresh: true,
      source: {
        NODE_ENV: "test",
        APP_NAME: "Wanderlust",
        SERVICE_NAME: "wanderlust",
        WEB_PORT: "3000",
        WANDERLUST_SECRETS_MODE: "env",
        TEMPORAL_ADDRESS: "localhost:7233",
        TEMPORAL_NAMESPACE: "default",
        TEMPORAL_TASK_QUEUE: "wanderlust",
        TEMPORAL_UI_URL: "http://127.0.0.1:8233",
        SUPABASE_URL: "http://127.0.0.1:54321",
        SUPABASE_ANON_KEY: "anon",
        SUPABASE_SERVICE_ROLE_KEY: "service-role",
        POSTHOG_HOST: "https://app.posthog.test",
      },
    });

    expect(env.WANDERLUST_SECRETS_MODE).toBe("env");
    expect(env.SUPABASE_URL).toBe("http://127.0.0.1:54321");
    expect(env.TEMPORAL_ADDRESS).toBe("localhost:7233");
    expect(env.TEMPORAL_TASK_QUEUE).toBe("wanderlust");
  });

  it("caches the startup secret fetch for the default process env", async () => {
    Object.assign(process.env, {
      NODE_ENV: "development",
      APP_NAME: "Wanderlust",
      SERVICE_NAME: "wanderlust",
      WEB_PORT: "3000",
      WANDERLUST_SECRETS_MODE: "doppler",
      DOPPLER_TOKEN: "dp.st.test",
    });

    let calls = 0;
    const secretLoader = async () => {
      calls += 1;
      return {
        TEMPORAL_ADDRESS: "localhost:7233",
        TEMPORAL_NAMESPACE: "default",
        TEMPORAL_TASK_QUEUE: "wanderlust",
        TEMPORAL_UI_URL: "http://127.0.0.1:8233",
        SUPABASE_URL: "http://127.0.0.1:54321",
        SUPABASE_ANON_KEY: "anon",
        SUPABASE_SERVICE_ROLE_KEY: "service-role",
      };
    };

    await loadAppEnv({ secretLoader });
    await loadAppEnv({ secretLoader });

    expect(calls).toBe(1);
  });

  it("fails fast when Doppler mode is active without a token or scoped config", async () => {
    const tempDir = createTempRepo();

    await expect(
      loadAppEnv({
        forceRefresh: true,
        source: {
          NODE_ENV: "development",
          WANDERLUST_SECRETS_MODE: "doppler",
        },
        repoRoot: tempDir,
      }),
    ).rejects.toThrow(/DOPPLER_TOKEN|DOPPLER_PROJECT/);
  });
});
