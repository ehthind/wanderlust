import { spawn, spawnSync } from "node:child_process";

const DEFAULT_BIN = "doppler";
const DEFAULT_MODE = "doppler";

const withProjectAndConfig = (args, source = process.env) => {
  const scopedArgs = [...args];

  if (source.DOPPLER_SCOPE) {
    scopedArgs.push("--scope", source.DOPPLER_SCOPE);
  }

  if (source.DOPPLER_PROJECT) {
    scopedArgs.push("--project", source.DOPPLER_PROJECT);
  }

  if (source.DOPPLER_CONFIG) {
    scopedArgs.push("--config", source.DOPPLER_CONFIG);
  }

  return scopedArgs;
};

export const resolveSecretsMode = (source = process.env) => {
  if (source.WANDERLUST_SECRETS_MODE === "doppler" || source.WANDERLUST_SECRETS_MODE === "env") {
    return source.WANDERLUST_SECRETS_MODE;
  }

  return source.NODE_ENV === "test" ? "env" : DEFAULT_MODE;
};

export const getDopplerBin = (source = process.env) => source.DOPPLER_BIN ?? DEFAULT_BIN;

const shellEscape = (value) => `'${String(value).replace(/'/g, `'\\''`)}'`;

const runDopplerSync = (args, source = process.env) => {
  const env = { ...source };
  const scope = source.DOPPLER_SCOPE ?? process.cwd();
  const command = [
    "cd",
    shellEscape(scope),
    "&&",
    shellEscape(getDopplerBin(source)),
    ...args.map(shellEscape),
  ].join(" ");

  delete env.DOPPLER_SCOPE;

  return spawnSync("/bin/zsh", ["-lc", command], {
    encoding: "utf8",
    env,
  });
};

export const assertDopplerReadySync = (source = process.env) => {
  if (resolveSecretsMode(source) === "env") {
    return;
  }

  if (!source.DOPPLER_TOKEN && (!source.DOPPLER_PROJECT || !source.DOPPLER_CONFIG)) {
    throw new Error(
      "Set DOPPLER_TOKEN or provide both DOPPLER_PROJECT and DOPPLER_CONFIG when WANDERLUST_SECRETS_MODE is set to doppler.",
    );
  }

  const result = runDopplerSync(["--version"], source);

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

  const result = runDopplerSync(
    withProjectAndConfig(["secrets", "download", "--no-file", "--format", "json"], source),
    source,
  );

  if (result.status !== 0) {
    const stderr = result.stderr?.trim();
    throw new Error(stderr || "Failed to download secrets from Doppler.");
  }

  if (!result.stdout?.trim()) {
    throw new Error("Doppler returned an empty secrets payload.");
  }

  return JSON.parse(result.stdout);
};

export const setSecretsSync = (values, source = process.env) => {
  assertDopplerReadySync(source);

  const entries = Object.entries(values).filter(
    ([, value]) => value !== undefined && value !== null && String(value).length > 0,
  );

  if (entries.length === 0) {
    return [];
  }

  const args = withProjectAndConfig(
    [
      "secrets",
      "set",
      "--no-interactive",
      ...entries.map(([key, value]) => `${key}=${String(value)}`),
    ],
    source,
  );
  const result = runDopplerSync(args, source);

  if (result.status !== 0) {
    const stderr = result.stderr?.trim();
    const project = source.DOPPLER_PROJECT ?? "wanderlust";
    const config = source.DOPPLER_CONFIG ?? "local_main";
    throw new Error(
      stderr ||
        `Failed to update Doppler secrets. Configure a write-capable token with \`doppler configure set token=... project=${project} config=${config} --scope <repo-or-worktree>\`.`,
    );
  }

  return entries.map(([key]) => key);
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
