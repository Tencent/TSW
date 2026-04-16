import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      include: ["lib/**/*.ts"],
      reporter: ["json", "lcov", "text"]
    },
    include: ["lib/**/*.test.ts"],
    exclude: ["node_modules", "dist"]
  }
});
