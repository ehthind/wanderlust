import { describe, expect, it } from "vitest";

import {
  buildDopplerSupabaseSecrets,
  deriveSupabaseLocalSettings,
  formatManagedEnvBlock,
  formatSupabaseRuntimeFailure,
  parseStatusEnv,
  renderSupabaseTemplate,
  upsertManagedBlock,
} from "./supabase-local.mjs";

describe("deriveSupabaseLocalSettings", () => {
  it("derives a stable worktree-specific port block", () => {
    const settings = deriveSupabaseLocalSettings({
      cwd: "/tmp/GOT-40",
      existingEnv: {},
    });

    expect(settings.projectId).toBe("got-40");
    expect(settings.siteUrl).toBe(`http://127.0.0.1:${settings.webPort}`);
    expect(settings.supabaseUrl).toBe(`http://127.0.0.1:${settings.apiPort}`);
    expect(settings.dbPort).toBe(settings.apiPort + 1);
    expect(settings.inbucketPort).toBe(settings.apiPort + 4);
  });
});

describe("renderSupabaseTemplate", () => {
  it("fills the tracked placeholders", () => {
    const settings = deriveSupabaseLocalSettings({
      cwd: "/tmp/GOT-40",
      existingEnv: {},
    });

    const rendered = renderSupabaseTemplate(
      'project_id = "{{SUPABASE_PROJECT_ID}}"\nport = {{SUPABASE_API_PORT}}\nsite_url = "{{WANDERLUST_SITE_URL}}"',
      settings,
    );

    expect(rendered).toContain('project_id = "got-40"');
    expect(rendered).toContain(`port = ${settings.apiPort}`);
    expect(rendered).toContain(`site_url = "${settings.siteUrl}"`);
  });
});

describe("upsertManagedBlock", () => {
  it("replaces the managed block without dropping custom env entries", () => {
    const settings = deriveSupabaseLocalSettings({
      cwd: "/tmp/GOT-40",
      existingEnv: {},
    });
    const original =
      "CUSTOM_VALUE=1\n\n# BEGIN WANDERLUST SUPABASE\nOLD_VALUE=1\n# END WANDERLUST SUPABASE\n";
    const updated = upsertManagedBlock(original, formatManagedEnvBlock(settings));

    expect(updated).toContain("CUSTOM_VALUE=1");
    expect(updated).not.toContain("OLD_VALUE=1");
    expect(updated).toContain("DOPPLER_PROJECT=wanderlust");
    expect(updated).toContain("DOPPLER_CONFIG=local_main");
    expect(updated).toContain(`SUPABASE_API_PORT=${settings.apiPort}`);
    expect(updated).not.toContain("SUPABASE_URL=");
  });
});

describe("buildDopplerSupabaseSecrets", () => {
  it("maps runtime Supabase values into the Doppler secret set", () => {
    const settings = deriveSupabaseLocalSettings({
      cwd: "/tmp/GOT-40",
      existingEnv: {},
    });

    expect(buildDopplerSupabaseSecrets(settings)).toMatchObject({
      SUPABASE_URL: `http://127.0.0.1:${settings.apiPort}`,
      SUPABASE_DB_URL: `postgresql://postgres:postgres@127.0.0.1:${settings.dbPort}/postgres`,
      SUPABASE_STUDIO_URL: `http://127.0.0.1:${settings.studioPort}`,
      SUPABASE_INBUCKET_URL: `http://127.0.0.1:${settings.inbucketPort}`,
      SUPABASE_ANON_KEY: "local-anon-key",
      SUPABASE_SERVICE_ROLE_KEY: "local-service-role-key",
    });
  });
});

describe("parseStatusEnv", () => {
  it("parses Supabase env output into a key-value map", () => {
    const parsed = parseStatusEnv(
      "API_URL=http://127.0.0.1:54321\nANON_KEY=test-anon\nSERVICE_ROLE_KEY=test-service\n",
    );

    expect(parsed.API_URL).toBe("http://127.0.0.1:54321");
    expect(parsed.ANON_KEY).toBe("test-anon");
    expect(parsed.SERVICE_ROLE_KEY).toBe("test-service");
  });

  it("unwraps shell-quoted values from the Supabase CLI", () => {
    const parsed = parseStatusEnv(
      'API_URL="http://127.0.0.1:55012"\nANON_KEY="test-anon"\nSINGLE_QUOTED=\'test-service\'\n',
    );

    expect(parsed.API_URL).toBe("http://127.0.0.1:55012");
    expect(parsed.ANON_KEY).toBe("test-anon");
    expect(parsed.SINGLE_QUOTED).toBe("test-service");
  });
});

describe("formatSupabaseRuntimeFailure", () => {
  it("normalizes daemon-unavailable output from the Supabase CLI", () => {
    const message = formatSupabaseRuntimeFailure({
      stdout: "",
      stderr: `failed to inspect service: Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?
Docker Desktop is a prerequisite for local development. Follow the official docs to install: https://docs.docker.com/desktop`,
    });

    expect(message).toBe(
      "Docker is required for Supabase local runtime commands and does not appear to be ready. Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running? Docker Desktop is a prerequisite for local development. Follow the official docs to install: https://docs.docker.com/desktop",
    );
  });

  it("preserves non-Docker failures for direct debugging", () => {
    const message = formatSupabaseRuntimeFailure({
      stdout: "",
      stderr: "failed to parse config: unexpected token",
    });

    expect(message).toBe("failed to parse config: unexpected token");
  });
});
