import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.ts", "src/**/*.{test,spec}.tsx"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**", "src/components/**/*.ts"],
      exclude: ["src/**/*.tsx", "src/services/**", "src/store/**", "src/hooks/**"],
      thresholds: {
        lines: 80,
        statements: 80,
        branches: 70,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
