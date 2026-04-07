import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "apps/web/tests/**/*.ts",
      "packages/**/*.test.ts",
      "workers/**/*.test.ts",
      "tools/**/*.test.ts",
    ],
  },
});
