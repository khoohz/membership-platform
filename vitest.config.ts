import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup-env.ts"],
  },
  resolve: {
    alias: {
      // "server-only" throws unconditionally outside a bundler's react-server
      // condition; tests run in plain Node, so alias it to the package's own
      // no-op stub instead of Next.js's build-time guard.
      "server-only": path.resolve(__dirname, "node_modules/server-only/empty.js"),
      "@": path.resolve(__dirname, "."),
    },
  },
});
