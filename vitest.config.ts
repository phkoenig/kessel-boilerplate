import { defineConfig } from "vitest/config"
import { resolve } from "path"

/**
 * Vitest-Konfiguration für das Theme-System.
 *
 * Diese Konfiguration ermöglicht Unit-Tests für:
 * - Font-Registry und Mapping-Funktionen
 * - Theme-Import-API
 * - Validierungs-Scripts
 */
export const vitestConfig = defineConfig({
  test: {
    // Globale Test-Umgebung
    environment: "node",

    // Glob-Patterns für Testdateien
    include: [
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "scripts/**/*.test.ts",
      "eslint/rules/**/*.test.ts",
    ],

    // Ausgeschlossene Verzeichnisse
    exclude: ["node_modules", ".next", "dist"],

    // Coverage-Konfiguration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: [
        "src/lib/fonts/**/*.ts",
        "src/lib/ai-chat/**/*.ts",
        "src/app/api/themes/**/*.ts",
        "src/app/api/chat/**/*.ts",
        "src/hooks/**/*.ts",
        "src/components/shell/AIChatPanel.tsx",
        "scripts/**/*.ts",
      ],
      exclude: ["**/*.test.ts", "**/*.test.tsx", "**/__tests__/**"],
    },

    // TypeScript-Unterstützung
    globals: true,

    // Timeout für Tests
    testTimeout: 10000,
  },

  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
})

export default vitestConfig
