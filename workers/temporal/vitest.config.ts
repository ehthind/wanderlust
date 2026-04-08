import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@wanderlust/domains/trips": path.resolve(
        import.meta.dirname,
        "../../packages/domains/trips/src/index.ts",
      ),
      "@wanderlust/providers/booking": path.resolve(
        import.meta.dirname,
        "../../packages/providers/src/booking/index.ts",
      ),
      "@wanderlust/providers/workflow": path.resolve(
        import.meta.dirname,
        "../../packages/providers/src/workflow/index.ts",
      ),
      "@wanderlust/shared-config": path.resolve(
        import.meta.dirname,
        "../../packages/shared/config/src/index.ts",
      ),
      "@wanderlust/shared-logging": path.resolve(
        import.meta.dirname,
        "../../packages/shared/logging/src/index.ts",
      ),
      "@wanderlust/shared-observability": path.resolve(
        import.meta.dirname,
        "../../packages/shared/observability/src/index.ts",
      ),
      "@wanderlust/shared-schemas": path.resolve(
        import.meta.dirname,
        "../../packages/shared/schemas/src/index.ts",
      ),
      "@wanderlust/shared-supabase": path.resolve(
        import.meta.dirname,
        "../../packages/shared/supabase/src/index.ts",
      ),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
