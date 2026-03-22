import { defineConfig } from "vitest/config";
import path from "node:path";

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
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
