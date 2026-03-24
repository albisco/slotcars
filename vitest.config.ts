import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    dir: "./tests",
    exclude: ["**/*.spec.ts"],
    timeout: 10000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
