#!/usr/bin/env node
/**
 * CI-Guard (Plan H-3): Failed, wenn in Vercel-Production-/Preview-Env die
 * Dev-Bypass-Flag gesetzt ist oder wenn noch Referenzen auf das alte
 * `NEXT_PUBLIC_AUTH_BYPASS` im Code existieren.
 *
 * Usage in CI:
 *   node scripts/ci/check-no-dev-routes.mjs
 *
 * Exit-Codes:
 *   0 = OK
 *   1 = Drift (Bypass gesetzt oder alter Flag gefunden)
 */

import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

const ROOT = process.cwd()
const SCAN_DIRS = ["src", "scripts"]
const LEGACY_FLAG = "NEXT_PUBLIC_AUTH_BYPASS"

let failed = false

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      if (entry === "node_modules" || entry === ".next" || entry === "dist") continue
      walk(full)
    } else if (/\.(ts|tsx|js|mjs|cjs)$/.test(entry)) {
      const content = readFileSync(full, "utf-8")
      if (content.includes(LEGACY_FLAG)) {
        console.error(`[drift] Alter Flag '${LEGACY_FLAG}' in ${full}`)
        failed = true
      }
    }
  }
}

for (const d of SCAN_DIRS) {
  try {
    walk(join(ROOT, d))
  } catch {
    // Verzeichnis existiert nicht — kein Abbruch
  }
}

// In Production-Env-Check (Vercel-Runtime setzt VERCEL_ENV=production|preview)
const vercelEnv = process.env.VERCEL_ENV
if (
  (vercelEnv === "production" || vercelEnv === "preview") &&
  process.env.BOILERPLATE_AUTH_BYPASS
) {
  console.error(
    `[drift] BOILERPLATE_AUTH_BYPASS ist in VERCEL_ENV=${vercelEnv} gesetzt. Darf nur in dev.`
  )
  failed = true
}

if (failed) {
  console.error("\nCI-Guard fehlgeschlagen.")
  process.exit(1)
}
console.log("CI-Guard OK: keine Dev-Bypass-Drift gefunden.")
