import fs from "node:fs";

import { createController } from "./controller.mjs";
import { createGitHubAppClient } from "./github-app.mjs";
import { createStateStore } from "./state-store.mjs";
import { loadPrWorkflow } from "./workflow.mjs";

const [eventName, payloadPath] = process.argv.slice(2);

if (!eventName || !payloadPath) {
  process.stderr.write("Usage: node tools/pr-agent/handle-event.mjs <event-name> <payload-path>\n");
  process.exit(1);
}

const workflow = loadPrWorkflow();
const stateStore = createStateStore(workflow.config.state.root);
const controller = createController({
  workflow,
  stateStore,
  githubClientFactory: ({ owner, repo, installationId }) =>
    createGitHubAppClient({
      owner,
      repo,
      installationId,
      token: process.env.GITHUB_PR_AGENT_TOKEN,
      appId: process.env.GITHUB_APP_ID,
      privateKey: process.env.GITHUB_APP_PRIVATE_KEY,
    }),
});

controller
  .handleWebhookEvent({
    eventName,
    payload: JSON.parse(fs.readFileSync(payloadPath, "utf8")),
  })
  .catch((error) => {
    process.stderr.write(
      `${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`,
    );
    process.exit(1);
  });
