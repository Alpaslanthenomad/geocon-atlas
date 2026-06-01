import { defineConfig } from "vitest/config";

// Minimal Vitest setup — Node environment by default since our first
// unit tests target pure utility functions in lib/. When a test needs
// the DOM (Testing Library + React component), set environment: 'jsdom'
// at the test-file level via vitest's environment comment:
//   // @vitest-environment jsdom
//
// Playwright lives separately under e2e/ and uses its own runner.

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.{js,jsx,ts,tsx}"],
    exclude: [
      "node_modules/**",
      ".next/**",
      "e2e/**",                 // Playwright owns this
      "tests/**/*.skip.*",
    ],
    coverage: {
      reporter: ["text", "html"],
      include: ["lib/**", "components/ui/**"],
      exclude: ["**/*.config.*", "**/*.d.ts"],
    },
  },
});
