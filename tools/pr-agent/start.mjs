import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const codexHome = path.join(os.homedir(), ".codex");
fs.mkdirSync(codexHome, { recursive: true });

const writeEnvFile = (envName, targetPath) => {
  const value = process.env[envName];
  if (!value) {
    return false;
  }

  fs.writeFileSync(targetPath, Buffer.from(value, "base64"));
  return true;
};

writeEnvFile("CODEX_AUTH_JSON_B64", path.join(codexHome, "auth.json"));
writeEnvFile("CODEX_CONFIG_TOML_B64", path.join(codexHome, "config.toml"));

if (process.env.OPENAI_API_KEY && !fs.existsSync(path.join(codexHome, "auth.json"))) {
  const login = spawnSync("codex", ["login", "--with-api-key"], {
    input: `${process.env.OPENAI_API_KEY}\n`,
    encoding: "utf8",
    env: process.env,
  });

  if (login.status !== 0) {
    throw new Error(login.stderr?.trim() || "Failed to authenticate Codex CLI.");
  }
}

await import("./serve.mjs");
