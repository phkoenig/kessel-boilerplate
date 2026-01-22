/**
 * Tech Stack Types
 *
 * Shared Types fuer Server und Client.
 */

export type TechCategory =
  | "framework"
  | "ui"
  | "styling"
  | "state"
  | "forms"
  | "ai"
  | "database"
  | "testing"
  | "build"
  | "other"

export type UsageType = "core" | "dev" | "optional"

export interface TechStackEntry {
  name: string
  version: string
  category: TechCategory
  subcategory?: string
  description: string
  usage: UsageType
  docsUrl?: string
}

export interface TechStack {
  generatedAt: string
  projectName: string
  projectVersion: string
  boilerplate: { name: string; version: string }
  nodeVersion: string
  packageManager: string
  entries: TechStackEntry[]
}

export interface OutdatedPackage {
  name: string
  current: string
  latest: string
  wanted?: string
}

export interface UpdatesResponse {
  status: "ok" | "disabled" | "error"
  packages: OutdatedPackage[]
  message?: string
}

export interface SecurityVulnerability {
  severity: "critical" | "high" | "moderate" | "low"
  title: string
  url?: string
  patchedVersion?: string
}

export interface AuditResponse {
  status: "ok" | "disabled" | "error"
  vulnerabilities: Record<string, SecurityVulnerability[]>
  summary: {
    critical: number
    high: number
    moderate: number
    low: number
    total: number
  }
  message?: string
}

/**
 * Kategorie-Labels fuer die UI
 */
export const CATEGORY_LABELS: Record<TechCategory, string> = {
  framework: "Framework",
  ui: "UI Components",
  styling: "Styling",
  state: "State Management",
  forms: "Forms & Validation",
  ai: "AI Integration",
  database: "Database & Data",
  testing: "Testing",
  build: "Build & Dev Tools",
  other: "Other",
}
