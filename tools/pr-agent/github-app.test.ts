import { describe, expect, it, vi } from "vitest";

import { createGitHubAppClient } from "./github-app.mjs";

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });

describe("createGitHubAppClient", () => {
  it("falls back to a commit status when check-runs require GitHub App auth", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(
          {
            message: "You must authenticate via a GitHub App.",
          },
          403,
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          id: 901,
          state: "pending",
        }),
      );

    const client = createGitHubAppClient({
      owner: "ehthind",
      repo: "wanderlust",
      token: "token",
      apiBaseUrl: "https://api.github.test",
      fetchImpl,
    });

    const created = await client.createCheckRun({
      name: "codex-remediation",
      head_sha: "abc123",
      status: "in_progress",
      output: {
        title: "Investigating",
        summary: "Investigating observability-contract",
      },
    });

    expect(created.id).toBe("status:abc123:codex-remediation");
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      "https://api.github.test/repos/ehthind/wanderlust/statuses/abc123",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("updates a synthetic remediation status by creating a new commit status entry", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        id: 902,
        state: "success",
      }),
    );

    const client = createGitHubAppClient({
      owner: "ehthind",
      repo: "wanderlust",
      token: "token",
      apiBaseUrl: "https://api.github.test",
      fetchImpl,
    });

    await client.updateCheckRun("status:def456:codex-remediation", {
      status: "completed",
      conclusion: "success",
      output: {
        title: "Done",
        summary: "Required checks are green on the latest PR head SHA.",
      },
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.github.test/repos/ehthind/wanderlust/statuses/def456",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });
});
