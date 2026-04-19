#!/usr/bin/env node
/**
 * TEMP: Theme-Schema-Pre-Check (C0).
 *
 * Liest alle Themes aus dem `themes`-Bucket in Supabase und loggt die
 * erkannten `data-theme="..."`-Selektoren pro Datei. So sehen wir vor
 * dem grossen Theme-Refactoring, ob bestehende Themes kompatibel sind
 * (muessen die Regeln `:root[data-theme="id"]` und `.dark[data-theme="id"]`
 * haben).
 *
 * Verwendung:
 *   node scripts/TEMP_theme-schema-check.mjs
 *
 * Erwartet in `.env.local`:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Ref: docs/12_plans/260419-theme-persistenz-iryse-portierung.md (Phase C0)
 */

import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local")
  try {
    const raw = readFileSync(envPath, "utf8")
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/)
      if (!m) continue
      const key = m[1]
      let value = m[2]
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      if (!(key in process.env)) {
        process.env[key] = value
      }
    }
  } catch {
    // .env.local nicht gefunden — OK, process.env kann gesetzt sein
  }
}

loadEnvLocal()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error(
    "[theme-schema-check] FEHLER: NEXT_PUBLIC_SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY fehlt."
  )
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

/**
 * Listet alle Dateien im `themes`-Bucket (inkl. Tenant-Unterordner, 1 Ebene).
 */
async function listAllThemeCssPaths() {
  const paths = []

  const { data: root, error: rootErr } = await supabase.storage
    .from("themes")
    .list("", { limit: 1000 })
  if (rootErr) {
    throw new Error(`Storage.list(root) fehlgeschlagen: ${rootErr.message}`)
  }
  for (const entry of root ?? []) {
    const isFile = entry.id != null && entry.metadata != null
    if (isFile && entry.name.endsWith(".css")) {
      paths.push(entry.name)
      continue
    }
    const isFolder = entry.id == null && !entry.name.endsWith(".css")
    if (!isFolder) continue

    const { data: sub, error: subErr } = await supabase.storage
      .from("themes")
      .list(entry.name, { limit: 1000 })
    if (subErr) {
      console.warn(
        `[theme-schema-check] WARN: list(${entry.name}) fehlgeschlagen: ${subErr.message}`
      )
      continue
    }
    for (const child of sub ?? []) {
      if (child.id != null && child.name.endsWith(".css")) {
        paths.push(`${entry.name}/${child.name}`)
      }
    }
  }
  return paths
}

async function analyzeFile(path) {
  const { data, error } = await supabase.storage.from("themes").download(path)
  if (error || !data) {
    return { path, ok: false, error: error?.message ?? "no data" }
  }
  const css = await data.text()
  const selectors = [...css.matchAll(/\[data-theme\s*=\s*["']([^"']+)["']\]/g)].map((m) => m[1])
  const uniqueSelectors = [...new Set(selectors)]
  const hasLight = /:root\[data-theme=["'][^"']+["']\]/.test(css)
  const hasDark = /\.dark\[data-theme=["'][^"']+["']\]/.test(css)
  const cornerStyle = css.match(/--corner-style:\s*([^;\s]+)/)?.[1] ?? null
  return {
    path,
    ok: true,
    bytes: css.length,
    selectors: uniqueSelectors,
    hasLight,
    hasDark,
    cornerStyle,
  }
}

async function main() {
  console.log("[theme-schema-check] Starte Pre-Check (iryse-Portierung)...\n")
  const paths = await listAllThemeCssPaths()
  console.log(`[theme-schema-check] ${paths.length} CSS-Datei(en) gefunden im 'themes'-Bucket.\n`)
  if (paths.length === 0) {
    console.log("[theme-schema-check] Keine CSS-Dateien — sauberer Start. Weiter mit Phase C1.")
    return
  }

  const warnings = []
  for (const path of paths) {
    const r = await analyzeFile(path)
    if (!r.ok) {
      console.log(`❌ ${path} — Lesen fehlgeschlagen (${r.error})`)
      warnings.push({ path, reason: `download: ${r.error}` })
      continue
    }
    const tag = r.hasLight && r.hasDark ? "✅" : "⚠️"
    console.log(
      `${tag} ${path}  [${r.bytes}B]  selectors=${JSON.stringify(r.selectors)}  light=${r.hasLight}  dark=${r.hasDark}  corner=${r.cornerStyle ?? "∅"}`
    )
    if (!r.hasLight) warnings.push({ path, reason: "kein :root[data-theme] Block" })
    if (!r.hasDark) warnings.push({ path, reason: "kein .dark[data-theme] Block" })
    if (r.selectors.length === 0) warnings.push({ path, reason: "keine [data-theme]-Selektoren" })
  }

  console.log("")
  if (warnings.length === 0) {
    console.log("[theme-schema-check] ✅ Alle Themes kompatibel. Weiter mit Phase C1.")
    return
  }
  console.log(`[theme-schema-check] ⚠️  ${warnings.length} Auffaelligkeit(en):`)
  for (const w of warnings) {
    console.log(`    - ${w.path}: ${w.reason}`)
  }
  console.log(
    "\n[theme-schema-check] Kein Abbruch — Report lesen, inkompatible Themes ggf. manuell angleichen,\ndann mit Phase C1 fortfahren. Bei zerstoererisch-wirkenden Files das Theme neu exportieren."
  )
}

main().catch((err) => {
  console.error("[theme-schema-check] FEHLER:", err)
  process.exit(1)
})
