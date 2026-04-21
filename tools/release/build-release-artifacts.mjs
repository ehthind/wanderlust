import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { globSync } from "glob";

const repoRoot = path.resolve(import.meta.dirname, "../..");

const parseArgs = (argv) => {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith("--")) {
      continue;
    }

    const key = value.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = "true";
      continue;
    }

    args[key] = next;
    index += 1;
  }

  return args;
};

const sortUnique = (values) => [...new Set(values)].sort((a, b) => a.localeCompare(b));

const listFiles = (patterns, { ignore = [] } = {}) =>
  sortUnique(
    patterns.flatMap((pattern) =>
      globSync(pattern, {
        cwd: repoRoot,
        dot: false,
        ignore: ["**/node_modules/**", "**/.next/**", "**/dist/**", "**/coverage/**", ...ignore],
        nodir: true,
      }),
    ),
  );

const countLines = (files) =>
  files.reduce((total, relativePath) => {
    const content = fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
    return total + content.split(/\r?\n/u).length;
  }, 0);

const surfaceMetric = ({ sourceFiles, testFiles = [] }) => ({
  sourceFiles: sourceFiles.length,
  sourceLines: countLines(sourceFiles),
  testFiles: testFiles.length,
  testLines: countLines(testFiles),
});

const fileExists = (relativePath) => fs.existsSync(path.join(repoRoot, relativePath));

const createTarGz = ({ outputPath, cwd, entries }) => {
  if (entries.length === 0) {
    throw new Error(`Cannot create ${outputPath}: no entries provided`);
  }

  const result = spawnSync("tar", ["-czf", outputPath, "-C", cwd, ...entries], {
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(`Failed to create ${outputPath}\n${result.stdout ?? ""}${result.stderr ?? ""}`);
  }
};

const formatBytes = (bytes) => new Intl.NumberFormat("en-US").format(bytes);

const getCurrentGitHead = () => {
  const result = spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: repoRoot,
    encoding: "utf8",
  });

  return result.status === 0 ? result.stdout.trim() : undefined;
};

const assertReleaseInput = ({ version, gitHead }) => {
  if (!version) {
    throw new Error("Missing required --version argument");
  }

  if (!gitHead) {
    throw new Error("Missing required --git-head argument or GITHUB_SHA environment variable");
  }
};

const buildGrowthSnapshot = () => {
  const iosSource = listFiles(["apps/ios/Wanderlust/**/*.swift"]);
  const iosTests = listFiles([
    "apps/ios/WanderlustTests/**/*.swift",
    "apps/ios/WanderlustUITests/**/*.swift",
  ]);
  const webSource = listFiles(["apps/web/src/**/*.{ts,tsx}"], {
    ignore: ["apps/web/**/*.test.{ts,tsx}", "apps/web/**/*.spec.{ts,tsx}"],
  });
  const webTests = listFiles(["apps/web/**/*.{test,spec}.{ts,tsx}"]);
  const domainSource = listFiles(["packages/domains/**/*.{ts,tsx}"], {
    ignore: ["packages/domains/**/*.{test,spec}.{ts,tsx}"],
  });
  const domainTests = listFiles(["packages/domains/**/*.{test,spec}.{ts,tsx}"]);
  const schemaFiles = listFiles(["packages/shared/schemas/**/*.{ts,tsx}"]);
  const docs = listFiles(["docs/**/*.md", "*.md"]);
  const activePlans = listFiles(["plans/active/*.md"]);

  return {
    ios: surfaceMetric({ sourceFiles: iosSource, testFiles: iosTests }),
    web: {
      ...surfaceMetric({ sourceFiles: webSource, testFiles: webTests }),
      routes: listFiles(["apps/web/src/app/**/page.tsx"]).length,
    },
    domains: surfaceMetric({ sourceFiles: domainSource, testFiles: domainTests }),
    sharedSchemas: {
      files: schemaFiles.length,
      lines: countLines(schemaFiles),
    },
    docs: {
      files: docs.length,
      lines: countLines(docs),
      activePlans: activePlans.length,
    },
  };
};

const renderSummary = ({ version, tag, gitHead, generatedAt, growth, assets }) => {
  const rows = [
    [
      "iOS",
      growth.ios.sourceFiles,
      growth.ios.sourceLines,
      growth.ios.testFiles,
      growth.ios.testLines,
    ],
    [
      "Web",
      growth.web.sourceFiles,
      growth.web.sourceLines,
      growth.web.testFiles,
      growth.web.testLines,
    ],
    [
      "Domains",
      growth.domains.sourceFiles,
      growth.domains.sourceLines,
      growth.domains.testFiles,
      growth.domains.testLines,
    ],
  ];

  const assetRows = assets.map(
    (asset) => `| ${asset.name} | ${asset.description} | ${formatBytes(asset.sizeBytes)} |`,
  );

  return [
    `# Wanderlust Release Snapshot ${tag}`,
    "",
    `- version: ${version}`,
    `- tag: ${tag}`,
    `- git_head: ${gitHead}`,
    `- generated_at: ${generatedAt}`,
    "",
    "## Growth Snapshot",
    "",
    "| Surface | Source files | Source lines | Test files | Test lines |",
    "| --- | ---: | ---: | ---: | ---: |",
    ...rows.map((row) => `| ${row.join(" | ")} |`),
    "",
    `- web_routes: ${growth.web.routes}`,
    `- schema_contract_files: ${growth.sharedSchemas.files}`,
    `- schema_contract_lines: ${growth.sharedSchemas.lines}`,
    `- docs_files: ${growth.docs.files}`,
    `- docs_lines: ${growth.docs.lines}`,
    `- active_plans: ${growth.docs.activePlans}`,
    "",
    "## Release Assets",
    "",
    "| Asset | Purpose | Size bytes |",
    "| --- | --- | ---: |",
    ...assetRows,
    "",
  ].join("\n");
};

const args = parseArgs(process.argv.slice(2));
const version = args.version;
const tag = args.tag ?? `v${version}`;
const gitHead = args["git-head"] ?? process.env.GITHUB_SHA ?? getCurrentGitHead();
const shortSha = gitHead?.slice(0, 7);
const artifactSuffix = `${tag}-${shortSha}`.replace(/[^0-9A-Za-z._-]+/g, "-");
const artifactDir = path.resolve(repoRoot, args["artifact-dir"] ?? ".release-artifacts");
const checkArtifactsDir = path.resolve(
  repoRoot,
  args["check-artifacts-dir"] ?? ".release-inputs/required-checks",
);

assertReleaseInput({ version, gitHead });

fs.rmSync(artifactDir, { recursive: true, force: true });
fs.mkdirSync(artifactDir, { recursive: true });

const webBuildEntries = [
  "apps/web/.next",
  "apps/web/package.json",
  "apps/web/next.config.ts",
  "package.json",
  "pnpm-lock.yaml",
].filter(fileExists);

if (!webBuildEntries.includes("apps/web/.next")) {
  throw new Error(
    "Missing apps/web/.next. Run `corepack pnpm --filter @wanderlust/web build` first.",
  );
}

if (!fs.existsSync(checkArtifactsDir)) {
  throw new Error(
    `Missing required-check artifacts at ${path.relative(repoRoot, checkArtifactsDir)}.`,
  );
}

const requiredCheckEntries = fs
  .readdirSync(checkArtifactsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() || entry.isFile())
  .map((entry) => entry.name);

if (requiredCheckEntries.length === 0) {
  throw new Error(`No required-check artifacts found in ${checkArtifactsDir}.`);
}

const growth = buildGrowthSnapshot();
const generatedAt = new Date().toISOString();
const webBuildPath = path.join(artifactDir, `wanderlust-web-build-${artifactSuffix}.tgz`);
const requiredChecksPath = path.join(
  artifactDir,
  `wanderlust-required-checks-${artifactSuffix}.tgz`,
);

createTarGz({
  outputPath: webBuildPath,
  cwd: repoRoot,
  entries: webBuildEntries,
});

createTarGz({
  outputPath: requiredChecksPath,
  cwd: path.dirname(checkArtifactsDir),
  entries: [path.basename(checkArtifactsDir)],
});

const assets = [
  {
    name: path.basename(webBuildPath),
    description: "Next.js web build output plus package context",
    sizeBytes: fs.statSync(webBuildPath).size,
  },
  {
    name: path.basename(requiredChecksPath),
    description: "Required-check CI proof artifacts",
    sizeBytes: fs.statSync(requiredChecksPath).size,
  },
];

const metadata = {
  version,
  tag,
  gitHead,
  shortSha,
  generatedAt,
  growth,
  assets,
};

const metadataPath = path.join(artifactDir, `wanderlust-release-metadata-${artifactSuffix}.json`);
fs.writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);

assets.unshift({
  name: path.basename(metadataPath),
  description: "Machine-readable release metadata and growth counters",
  sizeBytes: fs.statSync(metadataPath).size,
});

const summaryPath = path.join(artifactDir, `wanderlust-growth-snapshot-${artifactSuffix}.md`);
fs.writeFileSync(
  summaryPath,
  renderSummary({ version, tag, gitHead, generatedAt, growth, assets }),
);

const summaryAsset = {
  name: path.basename(summaryPath),
  description: "Human-readable release growth snapshot",
  sizeBytes: fs.statSync(summaryPath).size,
};
assets.splice(1, 0, summaryAsset);

fs.writeFileSync(
  summaryPath,
  renderSummary({ version, tag, gitHead, generatedAt, growth, assets }),
);
summaryAsset.sizeBytes = fs.statSync(summaryPath).size;

fs.writeFileSync(metadataPath, `${JSON.stringify({ ...metadata, assets }, null, 2)}\n`);

process.stdout.write(
  `release artifacts written to ${path.relative(repoRoot, artifactDir)} for ${tag}\n`,
);
