import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

import { z } from "zod";

const resolveRepoRoot = (start = process.cwd()) => {
  let current = path.resolve(start);

  while (true) {
    if (fs.existsSync(path.join(current, "pnpm-workspace.yaml"))) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return path.resolve(start);
    }

    current = parent;
  }
};

const repoRoot = resolveRepoRoot();
const execFileAsync = promisify(execFile);
const loadedEnvRoots = new Set<string>();
const loadedEnvKeysByRoot = new Map<string, Set<string>>();

const loadEnvFile = (
  filePath: string,
  {
    protectedKeys,
    allowOverride,
    loadedKeys,
    targetEnv,
  }: {
    protectedKeys: Set<string>;
    allowOverride: boolean;
    loadedKeys: Set<string>;
    targetEnv: NodeJS.ProcessEnv;
  },
) => {
  if (!fs.existsSync(filePath)) {
    return;
  }

  for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    if (!key || protectedKeys.has(key) || (!allowOverride && targetEnv[key] !== undefined)) {
      continue;
    }

    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    targetEnv[key] = value;
    loadedKeys.add(key);
  }
};

const loadRepoEnv = (
  root = repoRoot,
  {
    forceReload = false,
    targetEnv = process.env,
    useProcessCache = targetEnv === process.env,
  }: {
    forceReload?: boolean;
    targetEnv?: NodeJS.ProcessEnv;
    useProcessCache?: boolean;
  } = {},
) => {
  if (!useProcessCache) {
    const loadedKeys = new Set<string>();
    const protectedKeys = new Set(Object.keys(targetEnv));
    loadEnvFile(path.join(root, ".env"), {
      protectedKeys,
      allowOverride: false,
      loadedKeys,
      targetEnv,
    });
    loadEnvFile(path.join(root, ".env.local"), {
      protectedKeys,
      allowOverride: true,
      loadedKeys,
      targetEnv,
    });
    return;
  }

  if (!forceReload && loadedEnvRoots.has(root)) {
    return;
  }

  if (forceReload) {
    const previousKeys = loadedEnvKeysByRoot.get(root);
    if (previousKeys) {
      for (const key of previousKeys) {
        delete targetEnv[key];
      }
    }
    loadedEnvRoots.delete(root);
  }

  const loadedKeys = new Set<string>();
  const protectedKeys = new Set(Object.keys(targetEnv));
  loadEnvFile(path.join(root, ".env"), {
    protectedKeys,
    allowOverride: false,
    loadedKeys,
    targetEnv,
  });
  loadEnvFile(path.join(root, ".env.local"), {
    protectedKeys,
    allowOverride: true,
    loadedKeys,
    targetEnv,
  });
  loadedEnvRoots.add(root);
  loadedEnvKeysByRoot.set(root, loadedKeys);
};

const baseEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_NAME: z.string().default("Wanderlust"),
  SERVICE_NAME: z.string().default("wanderlust"),
  WEB_PORT: z.coerce.number().int().positive().default(3000),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  WORKSPACE_NAME: z.string().default("local"),
  SYMPHONY_ISSUE_IDENTIFIER: z.string().default("local"),
  SYMPHONY_RUN_ID: z.string().default("manual"),
  WANDERLUST_SECRETS_MODE: z.enum(["doppler", "env"]).optional(),
  DOPPLER_BIN: z.string().default("doppler"),
  DOPPLER_PROJECT: z.string().optional(),
  DOPPLER_CONFIG: z.string().optional(),
  DOPPLER_SCOPE: z.string().optional(),
  DOPPLER_TOKEN: z.string().optional(),
});

const secretSchema = z.object({
  TEMPORAL_ADDRESS: z.string().min(1),
  TEMPORAL_NAMESPACE: z.string().min(1),
  TEMPORAL_TASK_QUEUE: z.string().min(1),
  TEMPORAL_UI_URL: z.string().url().or(z.string().startsWith("http://127.0.0.1")),
  TEMPORAL_API_KEY: z.string().optional(),
  SUPABASE_URL: z.string().url().or(z.string().startsWith("http://127.0.0.1")),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().optional(),
  INTERCOM_ACCESS_TOKEN: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  POSTHOG_HOST: z.string().url().optional(),
  POSTHOG_KEY: z.string().optional(),
  LINEAR_API_KEY: z.string().optional(),
  GITHUB_TOKEN: z.string().optional(),
  EXPEDIA_RAPID_API_KEY: z.string().optional(),
  EXPEDIA_RAPID_SHARED_SECRET: z.string().optional(),
  EXPEDIA_RAPID_BASE_URL: z.string().url().optional(),
});

export type BaseEnv = Omit<z.infer<typeof baseEnvSchema>, "DOPPLER_TOKEN"> & {
  WANDERLUST_SECRETS_MODE: "doppler" | "env";
};
export type AppSecrets = z.infer<typeof secretSchema>;
export type AppEnv = BaseEnv & AppSecrets;

export type SecretLoader = (options: {
  source: NodeJS.ProcessEnv;
  baseEnv: BaseEnv;
}) => Promise<Record<string, unknown>>;

const getSecretsMode = (source: NodeJS.ProcessEnv): "doppler" | "env" => {
  if (source.WANDERLUST_SECRETS_MODE === "doppler" || source.WANDERLUST_SECRETS_MODE === "env") {
    return source.WANDERLUST_SECRETS_MODE;
  }

  return source.NODE_ENV === "test" ? "env" : "doppler";
};

export const getBaseEnv = (source: NodeJS.ProcessEnv = process.env): BaseEnv => {
  const parsed = baseEnvSchema.parse(source);

  return {
    NODE_ENV: parsed.NODE_ENV,
    APP_NAME: parsed.APP_NAME,
    SERVICE_NAME: parsed.SERVICE_NAME,
    WEB_PORT: parsed.WEB_PORT,
    OTEL_EXPORTER_OTLP_ENDPOINT: parsed.OTEL_EXPORTER_OTLP_ENDPOINT,
    WORKSPACE_NAME: parsed.WORKSPACE_NAME,
    SYMPHONY_ISSUE_IDENTIFIER: parsed.SYMPHONY_ISSUE_IDENTIFIER,
    SYMPHONY_RUN_ID: parsed.SYMPHONY_RUN_ID,
    DOPPLER_BIN: parsed.DOPPLER_BIN,
    DOPPLER_PROJECT: parsed.DOPPLER_PROJECT,
    DOPPLER_CONFIG: parsed.DOPPLER_CONFIG,
    DOPPLER_SCOPE: parsed.DOPPLER_SCOPE,
    WANDERLUST_SECRETS_MODE: getSecretsMode(source),
  };
};

export const downloadDopplerSecrets: SecretLoader = async ({ source, baseEnv }) => {
  if (!source.DOPPLER_TOKEN && (!baseEnv.DOPPLER_PROJECT || !baseEnv.DOPPLER_CONFIG)) {
    throw new Error(
      "Set DOPPLER_TOKEN or provide both DOPPLER_PROJECT and DOPPLER_CONFIG when WANDERLUST_SECRETS_MODE is doppler.",
    );
  }

  const args = ["secrets", "download", "--no-file", "--format", "json"];

  if (baseEnv.DOPPLER_PROJECT) {
    args.push("--project", baseEnv.DOPPLER_PROJECT);
  }

  if (baseEnv.DOPPLER_CONFIG) {
    args.push("--config", baseEnv.DOPPLER_CONFIG);
  }

  if (baseEnv.DOPPLER_SCOPE) {
    args.push("--scope", baseEnv.DOPPLER_SCOPE);
  }

  let result: { stdout: string; stderr: string };

  try {
    result = await execFileAsync(baseEnv.DOPPLER_BIN, args, {
      env: source,
      maxBuffer: 1024 * 1024 * 5,
    });
  } catch (error) {
    const message =
      error instanceof Error && "stderr" in error && typeof error.stderr === "string"
        ? error.stderr.trim() || error.message
        : error instanceof Error
          ? error.message
          : "Failed to download secrets from Doppler.";
    throw new Error(message);
  }

  if (!result.stdout.trim()) {
    throw new Error("Doppler returned an empty secrets payload.");
  }

  return JSON.parse(result.stdout) as Record<string, unknown>;
};

const resolveSecrets = async (
  source: NodeJS.ProcessEnv,
  baseEnv: BaseEnv,
  secretLoader: SecretLoader,
): Promise<AppSecrets> => {
  if (baseEnv.WANDERLUST_SECRETS_MODE === "env") {
    return secretSchema.parse(source);
  }

  return secretSchema.parse(await secretLoader({ source, baseEnv }));
};

let cachedAppEnvPromise: Promise<AppEnv> | null = null;

export const resetAppEnvCache = () => {
  cachedAppEnvPromise = null;
};

export const loadAppEnv = async ({
  source = process.env,
  forceRefresh = false,
  secretLoader = downloadDopplerSecrets,
  repoRoot: root = repoRoot,
}: {
  source?: NodeJS.ProcessEnv;
  forceRefresh?: boolean;
  secretLoader?: SecretLoader;
  repoRoot?: string;
} = {}): Promise<AppEnv> => {
  const useCache = source === process.env && !forceRefresh;

  if (useCache && cachedAppEnvPromise) {
    return cachedAppEnvPromise;
  }

  const pending = (async () => {
    const resolvedSource = source === process.env ? source : { ...source };

    loadRepoEnv(root, {
      forceReload: forceRefresh,
      targetEnv: resolvedSource,
      useProcessCache: source === process.env,
    });

    const baseEnv = getBaseEnv(resolvedSource);
    const secrets = await resolveSecrets(resolvedSource, baseEnv, secretLoader);

    return {
      ...baseEnv,
      ...secrets,
    };
  })();

  if (useCache) {
    cachedAppEnvPromise = pending;
  }

  return pending;
};
