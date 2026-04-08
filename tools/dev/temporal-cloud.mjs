import { downloadSecretsSync } from "../doppler/secrets.mjs";

const command = process.argv[2] ?? "env";

if (command !== "env") {
  process.stderr.write("Usage: node tools/dev/temporal-cloud.mjs env\n");
  process.exit(1);
}

const secrets = downloadSecretsSync(process.env);

process.stdout.write(
  `${JSON.stringify(
    {
      address: secrets.TEMPORAL_ADDRESS ?? null,
      namespace: secrets.TEMPORAL_NAMESPACE ?? null,
      taskQueue: secrets.TEMPORAL_TASK_QUEUE ?? null,
      uiUrl: secrets.TEMPORAL_UI_URL ?? null,
      apiKeyConfigured: Boolean(secrets.TEMPORAL_API_KEY),
      dopplerProject: process.env.DOPPLER_PROJECT ?? "wanderlust",
      dopplerConfig: process.env.DOPPLER_CONFIG ?? null,
    },
    null,
    2,
  )}\n`,
);
