import { execWithSecretsGuard } from "../doppler/secrets.mjs";

const [, , dopplerConfig, ...argv] = process.argv;
const command = argv[0] === "--" ? argv.slice(1) : argv;

if (!dopplerConfig || command.length === 0) {
  process.stderr.write(
    "Usage: node tools/dev/run-with-doppler-config.mjs <doppler-config> -- <command>\n",
  );
  process.exit(1);
}

execWithSecretsGuard(command, {
  ...process.env,
  DOPPLER_PROJECT: process.env.DOPPLER_PROJECT ?? "wanderlust",
  DOPPLER_CONFIG: dopplerConfig,
});
