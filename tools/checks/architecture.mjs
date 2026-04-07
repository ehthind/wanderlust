import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const domainsRoot = path.join(repoRoot, "packages/domains");
const layerOrder = ["types", "config", "repo", "service", "runtime", "ui"];
const pathAliasPrefix = "@wanderlust/domains/";
const providerAliasPrefix = "@wanderlust/providers/";

const readImports = (filePath) => {
  const source = fs.readFileSync(filePath, "utf8");
  return [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]);
};

const fail = (message) => {
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
};

for (const domainName of fs.readdirSync(domainsRoot)) {
  const domainSrc = path.join(domainsRoot, domainName, "src");
  if (!fs.existsSync(domainSrc)) {
    continue;
  }

  for (const entry of fs.readdirSync(domainSrc)) {
    if (!entry.endsWith(".ts") || entry === "index.ts") {
      continue;
    }

    const currentLayer = entry.replace(/\.ts$/, "");
    const currentIndex = layerOrder.indexOf(currentLayer);
    if (currentIndex === -1) {
      fail(
        `Unknown domain layer file ${path.relative(repoRoot, path.join(domainSrc, entry))}. Use one of types/config/repo/service/runtime/ui for agent legibility.`,
      );
      continue;
    }

    for (const importPath of readImports(path.join(domainSrc, entry))) {
      if (importPath.startsWith(pathAliasPrefix)) {
        const [, targetDomain, targetLayer] = importPath.split("/");
        if (!targetDomain || !targetLayer) {
          continue;
        }
        if (targetDomain !== domainName && !importPath.endsWith("/index")) {
          fail(
            `${domainName}/${entry} imports ${importPath}. Cross-domain imports must go through the public index.ts so agents can reason about stable boundaries.`,
          );
        }
        const targetIndex = layerOrder.indexOf(targetLayer);
        if (targetDomain === domainName && targetIndex > currentIndex) {
          fail(
            `${domainName}/${entry} imports ${importPath}. Domain layers may only depend on more foundational layers; move the logic down or split the contract.`,
          );
        }
      }

      if (
        importPath.startsWith(providerAliasPrefix) &&
        !["service", "runtime"].includes(currentLayer)
      ) {
        fail(
          `${domainName}/${entry} imports ${importPath}. Providers are the single integration seam and should only enter domain service or runtime layers.`,
        );
      }
    }
  }
}

if (!process.exitCode) {
  process.stdout.write("architecture checks passed\n");
}
