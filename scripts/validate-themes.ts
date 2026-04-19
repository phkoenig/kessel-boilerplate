#!/usr/bin/env tsx
/**
 * Theme-Validierungs-Script (V3 / Boilerplate-DB-Agnostik)
 * ========================================================
 *
 * Seit Plan F laufen Theme-CSS-Blobs und Theme-Metadaten nicht mehr ueber
 * statische Dateien im Repo, sondern ueber `theme_css` / `theme_registry`
 * im konfigurierten Store (Spacetime/Supabase). Die alte Validierung gegen
 * `src/themes/tokens.css` + `src/themes/registry.ts` passt damit nicht mehr
 * und wurde durch die hier dokumentierten Runtime-Checks ersetzt:
 *
 *   - Unit-Tests `src/lib/themes/__tests__/snapshot-scope.test.ts` pruefen
 *     die Scope-Resolution.
 *   - Unit-Tests `src/lib/themes/__tests__/seed-default.test.ts` decken den
 *     Bootstrap-Pfad ab (`ensureDefaultBlobAsset`).
 *   - `pnpm migrate:supabase-to-spacetime` verifiziert idempotent die
 *     Theme-Registry und die zugehoerigen Blob-Assets.
 *
 * Diese Datei bleibt als npm-Script-Alias erhalten, damit CI-Workflows,
 * die `pnpm validate:themes` aufrufen, nicht brechen. Sie prueft nur noch,
 * dass die minimalen Seed-Artefakte vorhanden sind.
 */

import { existsSync } from "node:fs"
import path from "node:path"

const SEED_FILE = path.resolve("src/themes/defaults/default.css")
const CONSTANTS_FILE = path.resolve("src/lib/themes/constants.ts")

function fail(message: string): never {
  console.error(`\u274c ${message}`)
  process.exit(1)
}

console.log("[validate:themes] V3-Modus — Theme-Registry liegt im BlobStorage.")

if (!existsSync(CONSTANTS_FILE)) {
  fail(`Erwartete Datei fehlt: ${CONSTANTS_FILE}`)
}

if (!existsSync(SEED_FILE)) {
  fail(
    `Seed-Datei ${SEED_FILE} fehlt. Sie wird von ensureDefaultBlobAsset() ` +
      "benoetigt, um frische Installationen startfaehig zu machen."
  )
}

console.log(`\u2713 ${path.relative(process.cwd(), CONSTANTS_FILE)}`)
console.log(`\u2713 ${path.relative(process.cwd(), SEED_FILE)}`)
console.log(
  "\u2139 Fuer die tatsaechliche Theme-Inhaltskontrolle siehe " +
    "`pnpm migrate:supabase-to-spacetime --dry-run` und die Vitest-Suite."
)
