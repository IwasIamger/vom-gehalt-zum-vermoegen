import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Tests laufen ohne Browser: Der Rechenkern ist bewusst frei von React und
 * Browser-APIs, damit genau das möglich ist.
 */
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
