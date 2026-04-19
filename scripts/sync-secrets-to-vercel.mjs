#!/usr/bin/env node
/**
 * Sync Secrets to Vercel
 *
 * Liest Secrets aus 1Password und schreibt sie via Vercel REST API nach Vercel.
 * Non-interaktiv, fuer CI und lokale Nutzung.
 *
 * Voraussetzungen:
 * - OP_SERVICE_ACCOUNT_TOKEN gesetzt (fuer op read)
 * - VERCEL_TOKEN gesetzt (Vercel API Token von vercel.com/account/tokens)
 * - 1Password CLI installiert
 *
 * Nutzung:
 *   pnpm sync-vercel           # Sync ausfuehren
 *   pnpm sync-vercel --dry-run # Nur anzeigen, nichts schreiben
 */

import { execSync } from "child_process"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, "..")

const VERCEL_API = "https://api.vercel.com"
const TARGET = ["production"]

function getProjectName() {
  const pkgPath = path.join(PROJECT_ROOT, "package.json")
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"))
  if (!pkg.name) {
    console.error("package.json hat kein 'name' Feld.")
    process.exit(1)
  }
  return pkg.name
}

function opRead(opReference) {
  try {
    const out = execSync(`op read "${opReference}"`, {
      encoding: "utf-8",
      env: process.env,
    })
    return out.trim().replace(/\r\n/g, "\n").replace(/\r/g, "")
  } catch {
    return null
  }
}

function loadManifest() {
  const p = path.join(PROJECT_ROOT, "scripts", "pull-env.manifest.json")
  const raw = fs.readFileSync(p, "utf-8")
  return JSON.parse(raw)
}

async function main() {
  const dryRun = process.argv.includes("--dry-run")

  if (!process.env.OP_SERVICE_ACCOUNT_TOKEN && !dryRun) {
    console.error("OP_SERVICE_ACCOUNT_TOKEN fehlt. Setze die Umgebungsvariable.")
    process.exit(1)
  }

  if (!process.env.VERCEL_TOKEN && !dryRun) {
    console.error("VERCEL_TOKEN fehlt. Hole Token von vercel.com/account/tokens")
    process.exit(1)
  }

  const manifest = loadManifest()
  const entries = manifest.entries.filter(
    (e) => e.source === "1password" && e.opReference && e.vercel === true
  )

  if (dryRun) {
    console.log("Dry-Run: Wuerde", entries.length, "Variablen nach Vercel syncen:")
    entries.forEach((e) => console.log("  -", e.envName))
    return
  }

  const envVars = []
  const skipped = []

  for (const entry of entries) {
    const value = opRead(entry.opReference)
    if (!value) {
      skipped.push(entry.envName)
      continue
    }
    envVars.push({
      key: entry.envName,
      value,
      type: "sensitive",
      target: TARGET,
    })
  }

  if (skipped.length > 0) {
    console.warn("Uebersprungen (nicht in 1Password oder leer):", skipped.join(", "))
  }

  if (envVars.length === 0) {
    console.error("Keine Variablen zum Syncen.")
    process.exit(1)
  }

  const projectName = getProjectName()
  console.log("Projekt:", projectName)

  const url = `${VERCEL_API}/v10/projects/${encodeURIComponent(projectName)}/env?upsert=true`
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(envVars),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error("Vercel API Fehler:", res.status, text)
    process.exit(1)
  }

  const data = await res.json()
  const created = Array.isArray(data?.created)
    ? data.created.length
    : Array.isArray(data)
      ? data.length
      : envVars.length
  console.log("Erfolgreich:", created, "von", envVars.length, "Variablen nach Vercel gesynct.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
