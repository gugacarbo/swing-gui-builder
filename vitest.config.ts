import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    fileParallelism: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "json-summary", "lcov"],
      thresholds: {
        statements: 20,
        functions: 20,
        lines: 20,
        branches: 20,
      },
    },
  },
});
