import { spawn, spawnSync } from "node:child_process";

const DEFAULT_BIN = "doppler";
const DEFAULT_MODE = "doppler";

const buildArgs = (source = process.env) => {
  const args = ["secrets", "download", "--no-file", "--format", "json"];

  if (source.DOPPLER_PROJECT) {
    args.push("--project", source.DOPPLER_PROJECT);
  }

  if (source.DOPPLER_CONFIG) {
    args.push("--config", source.DOPPLER_CONFIG);
  }

  return args;
};

export const resolveSecretsMode = (source = process.env) => {
  if (source.WANDERLUST_SECRETS_MODE === "doppler" || source.WANDERLUST_SECRETS_MODE === "env") {
    return source.WANDERLUST_SECRETS_MODE;
  }

  return source.NODE_ENV === "test" ? "env" : DEFAULT_MODE;
};

export const getDopplerBin = (source = process.env) => source.DOPPLER_BIN ?? DEFAULT_BIN;

export const assertDopplerReadySync = (source = process.env) => {
  if (resolveSecretsMode(source) === "env") {
    return;
  }

  if (!source.DOPPLER_TOKEN) {
    throw new Error("DOPPLER_TOKEN is required when WANDERLUST_SECRETS_MODE is set to doppler.");
  }

  const result = spawnSync(getDopplerBin(source), ["--version"], {
    encoding: "utf8",
    env: source,
  });

  if (result.status !== 0) {
    throw new Error(
      `Doppler CLI is unavailable. Install it and ensure ${getDopplerBin(source)} is on PATH.`,
    );
  }
};

export const downloadSecretsSync = (source = process.env) => {
  assertDopplerReadySync(source);

  if (resolveSecretsMode(source) === "env") {
    return { ...source };
  }

  const result = spawnSync(getDopplerBin(source), buildArgs(source), {
    encoding: "utf8",
    env: source,
  });

  if (result.status !== 0) {
    const stderr = result.stderr?.trim();
    throw new Error(stderr || "Failed to download secrets from Doppler.");
  }

  if (!result.stdout?.trim()) {
    throw new Error("Doppler returned an empty secrets payload.");
  }

  return JSON.parse(result.stdout);
};

export const getManagedSinkStatusSync = (source = process.env) => {
  try {
    const values = downloadSecretsSync(source);

    return {
      sentry: {
        enabled: Boolean(values.SENTRY_DSN),
      },
      posthog: {
        enabled: Boolean(values.POSTHOG_KEY && values.POSTHOG_HOST),
        host: values.POSTHOG_HOST ?? "",
      },
      source: resolveSecretsMode(source),
    };
  } catch {
    return {
      sentry: {
        enabled: false,
      },
      posthog: {
        enabled: false,
        host: "",
      },
      source: "unavailable",
    };
  }
};

export const execWithSecretsGuard = (argv, source = process.env) => {
  assertDopplerReadySync(source);

  const child = spawn(argv[0], argv.slice(1), {
    stdio: "inherit",
    env: source,
  });

  child.on("exit", (code) => {
    process.exitCode = code ?? 0;
  });
};
