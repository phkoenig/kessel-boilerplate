/**
 * Tech Stack Analyzer
 *
 * Server-only Modul zur Analyse der Projekt-Dependencies.
 * NICHT in Client-Komponenten importieren!
 */

import { readFileSync } from "node:fs"
import { join } from "node:path"
import type { TechStack, TechStackEntry, TechCategory, UsageType } from "./types"

interface PackageJson {
  name: string
  version: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

interface BoilerplateJson {
  name: string
  version: string
}

interface CategoryMapping {
  category: TechCategory
  subcategory?: string
  description: string
  docsUrl?: string
}

// Package -> Category Mapping (erweiterbar pro Projekt)
const CATEGORIES: Record<string, CategoryMapping> = {
  // Framework
  next: {
    category: "framework",
    description: "React Framework mit App Router",
    docsUrl: "https://nextjs.org/docs",
  },
  react: { category: "framework", description: "UI Library", docsUrl: "https://react.dev" },
  "react-dom": { category: "framework", description: "React DOM Renderer" },

  // AI
  ai: { category: "ai", description: "Vercel AI SDK", docsUrl: "https://sdk.vercel.ai" },
  "@ai-sdk/openai": { category: "ai", description: "OpenAI Provider" },
  "@ai-sdk/google": { category: "ai", description: "Google Gemini Provider" },
  "@ai-sdk/anthropic": { category: "ai", description: "Anthropic Provider" },
  "@ai-sdk/react": { category: "ai", description: "React Hooks fuer AI SDK" },
  "@openrouter/ai-sdk-provider": { category: "ai", description: "OpenRouter Provider" },
  "@assistant-ui/react": { category: "ai", description: "AI Chat UI Components" },
  "@assistant-ui/react-ai-sdk": { category: "ai", description: "Assistant UI Integration" },
  "@assistant-ui/react-markdown": { category: "ai", description: "Markdown fuer Assistant UI" },
  "react-markdown": { category: "ai", description: "Markdown Renderer" },
  "remark-gfm": { category: "ai", description: "GitHub Flavored Markdown" },
  html2canvas: { category: "ai", description: "HTML to Canvas Converter" },
  "modern-screenshot": { category: "ai", description: "Screenshot Capture fuer AI" },

  // Database
  "@supabase/supabase-js": {
    category: "database",
    description: "Supabase Client",
    docsUrl: "https://supabase.com/docs",
  },
  "@supabase/ssr": { category: "database", description: "Supabase SSR Integration" },
  "@supabase/auth-ui-react": { category: "database", description: "Supabase Auth UI" },
  "@supabase/auth-ui-shared": { category: "database", description: "Supabase Auth Shared" },
  pg: { category: "database", description: "PostgreSQL Client" },
  swr: {
    category: "database",
    description: "Data Fetching Library",
    docsUrl: "https://swr.vercel.app",
  },

  // UI Components
  "lucide-react": {
    category: "ui",
    subcategory: "icons",
    description: "Icon Library",
    docsUrl: "https://lucide.dev",
  },
  "@remixicon/react": { category: "ui", subcategory: "icons", description: "Remix Icons" },
  "radix-ui": { category: "ui", description: "Radix UI Primitives" },
  "@tanstack/react-table": { category: "ui", subcategory: "data", description: "Data Table" },
  recharts: { category: "ui", subcategory: "charts", description: "React Charts" },
  sonner: { category: "ui", subcategory: "components", description: "Toast Notifications" },
  "embla-carousel-react": { category: "ui", subcategory: "components", description: "Carousel" },
  "react-resizable-panels": {
    category: "ui",
    subcategory: "components",
    description: "Resizable Panels",
  },
  "react-day-picker": { category: "ui", subcategory: "components", description: "Date Picker" },
  "input-otp": { category: "ui", subcategory: "components", description: "OTP Input" },
  cmdk: { category: "ui", subcategory: "components", description: "Command Menu" },
  vaul: { category: "ui", subcategory: "components", description: "Drawer Component" },
  "react-colorful": { category: "ui", subcategory: "components", description: "Color Picker" },
  "@dnd-kit/core": { category: "ui", subcategory: "drag-drop", description: "Drag & Drop" },
  "@dnd-kit/modifiers": { category: "ui", subcategory: "drag-drop", description: "DnD Modifiers" },
  "@dnd-kit/utilities": { category: "ui", subcategory: "drag-drop", description: "DnD Utilities" },
  "@headless-tree/core": {
    category: "ui",
    subcategory: "components",
    description: "Tree Component",
  },
  "@headless-tree/react": { category: "ui", subcategory: "components", description: "Tree React" },
  motion: { category: "ui", subcategory: "animation", description: "Framer Motion" },

  // Styling
  tailwindcss: {
    category: "styling",
    description: "Utility-First CSS",
    docsUrl: "https://tailwindcss.com",
  },
  "@tailwindcss/postcss": { category: "styling", description: "Tailwind PostCSS" },
  "@tailwindcss/typography": { category: "styling", description: "Tailwind Typography" },
  "tailwind-merge": { category: "styling", description: "Class Merger" },
  clsx: { category: "styling", description: "Conditional Classes" },
  "class-variance-authority": { category: "styling", description: "Variant Utilities" },
  "tw-animate-css": { category: "styling", description: "Tailwind Animations" },
  "next-themes": { category: "styling", description: "Dark Mode Provider" },
  color: { category: "styling", description: "Color Manipulation" },
  culori: { category: "styling", description: "Color Conversion" },

  // State
  zustand: {
    category: "state",
    description: "State Management",
    docsUrl: "https://zustand-demo.pmnd.rs",
  },

  // Forms
  "react-hook-form": {
    category: "forms",
    description: "Form Management",
    docsUrl: "https://react-hook-form.com",
  },
  "@hookform/resolvers": { category: "forms", description: "Form Resolvers" },
  zod: { category: "forms", description: "Schema Validation", docsUrl: "https://zod.dev" },

  // Testing
  vitest: { category: "testing", description: "Unit Testing", docsUrl: "https://vitest.dev" },
  "@vitest/coverage-v8": { category: "testing", description: "Coverage Reporter" },
  "@playwright/test": {
    category: "testing",
    description: "E2E Testing",
    docsUrl: "https://playwright.dev",
  },
  "@testing-library/react": { category: "testing", description: "React Testing" },
  "@testing-library/jest-dom": { category: "testing", description: "DOM Matchers" },
  "@testing-library/user-event": { category: "testing", description: "User Events" },
  jsdom: { category: "testing", description: "DOM Implementation" },

  // Build
  typescript: {
    category: "build",
    description: "TypeScript",
    docsUrl: "https://www.typescriptlang.org",
  },
  vite: { category: "build", description: "Build Tool", docsUrl: "https://vitejs.dev" },
  tsx: { category: "build", description: "TypeScript Execute" },
  eslint: { category: "build", description: "Linter", docsUrl: "https://eslint.org" },
  "eslint-config-next": { category: "build", description: "Next.js ESLint" },
  "eslint-config-prettier": { category: "build", description: "Prettier Config" },
  "eslint-plugin-prettier": { category: "build", description: "Prettier Plugin" },
  prettier: { category: "build", description: "Formatter", docsUrl: "https://prettier.io" },
  "prettier-plugin-tailwindcss": { category: "build", description: "Tailwind Prettier" },
  husky: { category: "build", description: "Git Hooks" },
  "lint-staged": { category: "build", description: "Staged Linting" },
  "@t3-oss/env-nextjs": { category: "build", description: "Env Validation" },
  chalk: { category: "build", description: "Terminal Colors" },
  dotenv: { category: "build", description: "Env Variables" },
  storybook: {
    category: "build",
    description: "Component Dev",
    docsUrl: "https://storybook.js.org",
  },
  "@storybook/react": { category: "build", description: "Storybook React" },
  "@storybook/react-vite": { category: "build", description: "Storybook Vite" },
  "@storybook/nextjs-vite": { category: "build", description: "Storybook Next.js" },
  "@storybook/addon-a11y": { category: "build", description: "Storybook A11y" },
  "@storybook/addon-docs": { category: "build", description: "Storybook Docs" },
  "@storybook/addon-links": { category: "build", description: "Storybook Links" },
  "@storybook/addon-onboarding": { category: "build", description: "Storybook Onboarding" },
  "eslint-plugin-storybook": { category: "build", description: "Storybook Plugin" },

  // Other
  "date-fns": { category: "other", description: "Date Utilities" },
}

// Wildcard patterns for @radix-ui/* etc.
const WILDCARD_PATTERNS: Array<{ pattern: RegExp; mapping: CategoryMapping }> = [
  {
    pattern: /^@radix-ui\//,
    mapping: { category: "ui", subcategory: "primitives", description: "Radix UI" },
  },
  { pattern: /^@supabase\//, mapping: { category: "database", description: "Supabase" } },
  { pattern: /^@types\//, mapping: { category: "build", description: "TypeScript Types" } },
  { pattern: /^@ai-sdk\//, mapping: { category: "ai", description: "AI SDK" } },
  { pattern: /^@storybook\//, mapping: { category: "build", description: "Storybook" } },
]

function getMapping(pkgName: string): CategoryMapping | null {
  // Exact match
  if (CATEGORIES[pkgName]) return CATEGORIES[pkgName]

  // Wildcard match
  for (const { pattern, mapping } of WILDCARD_PATTERNS) {
    if (pattern.test(pkgName)) return mapping
  }

  return null
}

function cleanVersion(version: string): string {
  return version.replace(/^[\^~>=<]+/, "")
}

/**
 * Analysiert den Tech Stack des Projekts
 */
export function analyzeTechStack(): TechStack {
  const cwd = process.cwd()

  // Read package.json
  const pkgPath = join(cwd, "package.json")
  const pkgContent = readFileSync(pkgPath, "utf-8")
  const pkg = JSON.parse(pkgContent) as PackageJson

  // Read boilerplate.json (optional)
  let boilerplate: BoilerplateJson = { name: "unknown", version: "0.0.0" }
  try {
    const bpPath = join(cwd, "boilerplate.json")
    const bpContent = readFileSync(bpPath, "utf-8")
    boilerplate = JSON.parse(bpContent) as BoilerplateJson
  } catch {
    // No boilerplate.json
  }

  const entries: TechStackEntry[] = []

  // Process dependencies
  const processDeps = (deps: Record<string, string> | undefined, usage: UsageType) => {
    if (!deps) return

    for (const [name, version] of Object.entries(deps)) {
      const mapping = getMapping(name)
      if (!mapping) continue // Skip unknown packages

      entries.push({
        name,
        version: cleanVersion(version),
        category: mapping.category,
        subcategory: mapping.subcategory,
        description: mapping.description,
        usage,
        docsUrl: mapping.docsUrl,
      })
    }
  }

  processDeps(pkg.dependencies, "core")
  processDeps(pkg.devDependencies, "dev")
  processDeps(pkg.peerDependencies, "optional")

  // Sort by category, then name
  entries.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category)
    return a.name.localeCompare(b.name)
  })

  return {
    generatedAt: new Date().toISOString(),
    projectName: pkg.name,
    projectVersion: pkg.version,
    boilerplate,
    nodeVersion: process.version,
    packageManager: "pnpm",
    entries,
  }
}
