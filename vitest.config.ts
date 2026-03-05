import { defineConfig } from "vitest/config"
import { resolve } from "path"
import { realpathSync } from "fs"
import { execSync } from "child_process"
import { config as dotenvConfig } from "dotenv"

// Lade .env.local für Tests
dotenvConfig({ path: resolve(__dirname, ".env.local") })
const workspacePath = resolve(__dirname)
const workspaceRealPath = realpathSync(workspacePath)
const gitRoot = (() => {
  try {
    return execSync("git rev-parse --show-toplevel", {
      cwd: workspacePath,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim()
  } catch {
    return workspacePath
  }
})()
const projectRoot = resolve(gitRoot)
const projectRealPath = realpathSync(projectRoot)

// Verhindert gemischte Modulauflösung (D:-Workspace vs B:-Git-Root) unter Windows.
if (process.cwd() !== projectRoot) {
  process.chdir(projectRoot)
}

/**
 * Vitest-Konfiguration für das Theme-System.
 *
 * Diese Konfiguration ermöglicht Unit-Tests für:
 * - Font-Registry und Mapping-Funktionen
 * - Theme-Import-API
 * - Validierungs-Scripts
 */
export const vitestConfig = defineConfig({
  root: projectRoot,
  server: {
    fs: {
      strict: false,
      allow: [workspacePath, workspaceRealPath, projectRoot, projectRealPath],
    },
  },
  test: {
    // Globale Test-Umgebung
    // Für React-Komponenten-Tests: "jsdom", für andere: "node"
    environment: "node",
    // Per-Test Environment-Override möglich via /// @vitest-environment jsdom

    // Setup-File für Testing Library Matchers
    setupFiles: ["@testing-library/jest-dom/vitest"],

    // Erzwingt konsistente Modul-Auflösung für React in jsdom-Tests.
    deps: {
      inline: ["react", "react-dom", "@testing-library/react"],
    },

    // Glob-Patterns für Testdateien
    include: [
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "scripts/**/*.test.ts",
      "eslint/rules/**/*.test.ts",
      "supabase/**/*.test.ts",
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
    preserveSymlinks: true,
    dedupe: ["react", "react-dom"],
    alias: {
      "@": resolve(projectRoot, "./src"),
      react: resolve(projectRoot, "node_modules/react"),
      "react-dom": resolve(projectRoot, "node_modules/react-dom"),
      "react/jsx-runtime": resolve(projectRoot, "node_modules/react/jsx-runtime"),
      "react/jsx-dev-runtime": resolve(projectRoot, "node_modules/react/jsx-dev-runtime"),
    },
  },
})

export default vitestConfig
