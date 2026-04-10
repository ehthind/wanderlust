FROM node:24-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates git unzip \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .

RUN corepack enable \
  && corepack pnpm install --frozen-lockfile \
  && npm install -g @openai/codex@0.118.0 \
  && npx playwright install --with-deps chromium

CMD ["node", "tools/pr-agent/start.mjs"]
