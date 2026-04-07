import { execWithSecretsGuard } from "../doppler/secrets.mjs";

const [, , ...argv] = process.argv;
const command = argv[0] === "--" ? argv.slice(1) : argv;

if (command.length === 0) {
  process.stderr.write("Usage: node tools/dev/guard-secrets.mjs -- <command>\n");
  process.exit(1);
}

execWithSecretsGuard(command);
