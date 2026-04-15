import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  env: {
    NEXT_PUBLIC_SENTRY_DSN: process.env.SENTRY_DSN ?? "",
    NEXT_PUBLIC_SENTRY_ENVIRONMENT: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    NEXT_PUBLIC_SENTRY_RELEASE:
      process.env.VERCEL_GIT_COMMIT_SHA ??
      process.env.GITHUB_SHA ??
      process.env.SOURCE_VERSION ??
      "",
  },
};

export default withSentryConfig(nextConfig, {
  release: {
    create: false,
    finalize: false,
  },
  sourcemaps: {
    disable: true,
  },
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
