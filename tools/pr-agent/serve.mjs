import http from "node:http";

import { createController } from "./controller.mjs";
import { createGitHubAppClient, verifyGitHubWebhookSignature } from "./github-app.mjs";
import { createStateStore } from "./state-store.mjs";
import { loadPrWorkflow } from "./workflow.mjs";

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

const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
if (!webhookSecret) {
  throw new Error("GITHUB_WEBHOOK_SECRET is required to run the PR repair agent server.");
}

const port = Number(process.env.PORT ?? "8787");
const webhookPath = process.env.PR_AGENT_WEBHOOK_PATH ?? "/github/webhook";

const server = http.createServer((request, response) => {
  if (request.method === "GET" && (request.url === "/" || request.url === "/healthz")) {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(
      JSON.stringify({
        status: "ok",
        webhookPath,
      }),
    );
    return;
  }

  if (request.url !== webhookPath) {
    response.writeHead(404, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: "not_found" }));
    return;
  }

  if (request.method !== "POST") {
    response.writeHead(405, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: "method_not_allowed" }));
    return;
  }

  const eventName = request.headers["x-github-event"];
  const signature = request.headers["x-hub-signature-256"];
  if (typeof eventName !== "string" || typeof signature !== "string") {
    response.writeHead(400, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: "missing_github_headers" }));
    return;
  }

  const chunks = [];
  request.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
  request.on("end", async () => {
    const payloadBuffer = Buffer.concat(chunks);
    if (
      !verifyGitHubWebhookSignature({
        secret: webhookSecret,
        payload: payloadBuffer,
        signatureHeader: signature,
      })
    ) {
      response.writeHead(401, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "invalid_signature" }));
      return;
    }

    try {
      await controller.handleWebhookEvent({
        eventName,
        payload: JSON.parse(payloadBuffer.toString("utf8")),
      });
      response.writeHead(202, { "content-type": "application/json" });
      response.end(JSON.stringify({ status: "accepted" }));
    } catch (error) {
      response.writeHead(500, { "content-type": "application/json" });
      response.end(
        JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    }
  });
});

server.listen(port, () => {
  process.stdout.write(`Wanderlust PR repair agent listening on ${port}${webhookPath}\n`);
});
