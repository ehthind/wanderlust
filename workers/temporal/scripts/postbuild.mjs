import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const workerRoot = resolve(scriptDir, "..");
const distRoot = resolve(workerRoot, "dist");

const aliasTargets = {
  "@wanderlust/shared-config": "packages/shared/config/src/index.js",
  "@wanderlust/shared-schemas": "packages/shared/schemas/src/index.js",
  "@wanderlust/shared-supabase": "packages/shared/supabase/src/index.js",
  "@wanderlust/shared-observability": "packages/shared/observability/src/index.js",
  "@wanderlust/shared-logging": "packages/shared/logging/src/index.js",
  "@wanderlust/shared-testing": "packages/shared/testing/src/index.js",
  "@wanderlust/shared-ui": "packages/shared/ui/src/index.js",
};

const resolveAliasTarget = (specifier) => {
  if (specifier in aliasTargets) {
    return aliasTargets[specifier];
  }

  if (specifier.startsWith("@wanderlust/domains/")) {
    const domainName = specifier.slice("@wanderlust/domains/".length);
    return `packages/domains/${domainName}/src/index.js`;
  }

  if (specifier.startsWith("@wanderlust/providers/")) {
    const providerPath = specifier.slice("@wanderlust/providers/".length);
    return `packages/providers/src/${providerPath}/index.js`;
  }

  return null;
};

const normalizeRelativeSpecifier = (specifier, filePath) => {
  if (!specifier.startsWith(".")) {
    return specifier;
  }

  if (extname(specifier)) {
    const directPath = resolve(dirname(filePath), specifier);
    if (existsSync(directPath)) {
      return specifier;
    }

    if (specifier.endsWith(".js")) {
      const withoutExtension = specifier.slice(0, -3);
      const indexPath = resolve(dirname(filePath), withoutExtension, "index.js");
      if (existsSync(indexPath)) {
        return `${withoutExtension}/index.js`;
      }
    }

    return specifier;
  }

  const directPath = resolve(dirname(filePath), `${specifier}.js`);
  if (existsSync(directPath)) {
    return `${specifier}.js`;
  }

  const indexPath = resolve(dirname(filePath), specifier, "index.js");
  if (existsSync(indexPath)) {
    return `${specifier}/index.js`;
  }

  return specifier;
};

const rewriteAliases = async (filePath) => {
  const original = await readFile(filePath, "utf8");
  const rewritten = original.replaceAll(
    /(["'])(@wanderlust\/[^"']+|\.{1,2}\/[^"']+)\1/g,
    (_match, quote, specifier) => {
      const target = resolveAliasTarget(specifier);

      if (target) {
        const absoluteTarget = resolve(distRoot, target);
        const relativeTarget = relative(dirname(filePath), absoluteTarget).split("\\").join("/");
        const normalized = relativeTarget.startsWith(".") ? relativeTarget : `./${relativeTarget}`;

        return `${quote}${normalized}${quote}`;
      }

      const normalized = normalizeRelativeSpecifier(specifier, filePath);
      return `${quote}${normalized}${quote}`;
    },
  );

  if (rewritten !== original) {
    await writeFile(filePath, rewritten, "utf8");
  }
};

const walk = async (directory) => {
  const { readdir } = await import("node:fs/promises");
  const entries = await readdir(directory, { withFileTypes: true });

  await Promise.all(
    entries.map(async (entry) => {
      const entryPath = resolve(directory, entry.name);

      if (entry.isDirectory()) {
        await walk(entryPath);
        return;
      }

      if (entry.isFile() && entry.name.endsWith(".js")) {
        await rewriteAliases(entryPath);
      }
    }),
  );
};

await walk(distRoot);
