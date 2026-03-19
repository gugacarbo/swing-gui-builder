import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    fileParallelism: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
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
