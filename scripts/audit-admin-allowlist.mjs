#!/usr/bin/env node
/**
 * Admin-Allowlist-Audit (Plan H-4)
 *
 * Prueft, ob alle in `BOILERPLATE_ADMIN_EMAILS` gelisteten E-Mail-Adressen
 * im Core-Store mit Rolle `admin` (oder `superuser`) persistiert sind.
 *
 * Usage:
 *   node scripts/audit-admin-allowlist.mjs            # Report-only
 *   node scripts/audit-admin-allowlist.mjs --fix      # Schreibt fehlende
 *
 * Repariert zudem Profile mit `unknown@clerk.local`-Email, wenn Clerk
 * die korrekte Adresse liefert.
 *
 * Exit-Codes:
 *   0 = OK (alle Allowlist-Users sind Admin; im Fix-Mode: Fixes applied)
 *   1 = Drift gefunden (Report-Mode) oder Fehler waehrend Fix
 */

import { config } from "dotenv"
import { fileURLToPath } from "node:url"
import path from "node:path"

config({ path: ".env.local" })

const FIX_MODE = process.argv.includes("--fix")
const ROOT = path.dirname(fileURLToPath(import.meta.url))

const bold = (s) => `\x1b[1m${s}\x1b[0m`
const green = (s) => `\x1b[32m${s}\x1b[0m`
const red = (s) => `\x1b[31m${s}\x1b[0m`
const yellow = (s) => `\x1b[33m${s}\x1b[0m`

function parseAllowlist() {
  const raw = process.env.BOILERPLATE_ADMIN_EMAILS
  if (!raw) return []
  return raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0)
}

function isAdminRole(role) {
  const normalized = (role ?? "").trim().toLowerCase()
  return normalized === "admin" || normalized === "superuser" || normalized === "super-user"
}

async function loadCoreStore() {
  // Dynamische Imports, damit dotenv bereits geladen ist
  process.env.NEXT_PUBLIC_BOILERPLATE_CORE_DRIVER ??= "spacetime"
  const { getCoreStore } = await import(path.join(ROOT, "..", "src", "lib", "core", "index.ts"))
  return getCoreStore()
}

async function main() {
  console.log(bold("\n=== Admin-Allowlist Audit (Plan H-4) ===\n"))

  const allowlist = parseAllowlist()
  if (allowlist.length === 0) {
    console.log(yellow("BOILERPLATE_ADMIN_EMAILS ist leer oder nicht gesetzt."))
    console.log(
      "Setze BOILERPLATE_ADMIN_EMAILS=<email1>,<email2> in .env.local damit Audit sinnvoll ist."
    )
    process.exit(0)
  }

  console.log(`Allowlist (${allowlist.length} Eintrag/Eintraege):`)
  for (const e of allowlist) console.log(`  - ${e}`)
  console.log()

  let store
  try {
    store = await loadCoreStore()
  } catch (err) {
    console.error(red("Core-Store konnte nicht geladen werden:"), err)
    process.exit(1)
  }

  const users = await store.listUsers()
  const byEmail = new Map(users.map((u) => [u.email?.toLowerCase() ?? "", u]))

  const drift = []
  for (const email of allowlist) {
    const user = byEmail.get(email)
    if (!user) {
      drift.push({ email, kind: "missing-profile", user: null })
      continue
    }
    if (!isAdminRole(user.role)) {
      drift.push({ email, kind: "wrong-role", user })
    }
  }

  const unknownEmailProfiles = users.filter((u) => u.email === "unknown@clerk.local")

  if (drift.length === 0 && unknownEmailProfiles.length === 0) {
    console.log(green("OK — alle Allowlist-Users sind Admin, keine unknown@clerk.local-Profile."))
    process.exit(0)
  }

  console.log(bold("Drift-Report:"))
  for (const d of drift) {
    if (d.kind === "missing-profile") {
      console.log(
        yellow(
          `  [missing]  ${d.email} — kein Core-Profil (User hat sich evtl. noch nie eingeloggt)`
        )
      )
    } else {
      console.log(
        red(
          `  [wrong-role] ${d.email} — role='${d.user.role}' (expected: admin) · clerkId=${d.user.clerkUserId}`
        )
      )
    }
  }
  if (unknownEmailProfiles.length > 0) {
    console.log()
    console.log(bold(`unknown@clerk.local-Profile (${unknownEmailProfiles.length}):`))
    for (const u of unknownEmailProfiles) {
      console.log(red(`  [unknown-email] clerkId=${u.clerkUserId} id=${u.id}`))
    }
  }

  if (!FIX_MODE) {
    console.log()
    console.log(yellow("Dry-run. Verwende --fix zum Schreiben."))
    process.exit(1)
  }

  console.log(bold("\nFix-Phase:\n"))

  for (const d of drift) {
    if (d.kind === "missing-profile") {
      console.log(yellow(`  [skip] ${d.email} — kann nicht ohne Clerk-User-ID gefixt werden.`))
      continue
    }
    try {
      await store.upsertUserFromClerk({
        clerkUserId: d.user.clerkUserId,
        email: d.user.email,
        displayName: d.user.displayName,
        avatarUrl: d.user.avatarUrl,
        role: "admin",
        tenantId: d.user.tenantId ?? null,
      })
      console.log(green(`  [fixed]  ${d.email} -> admin`))
    } catch (err) {
      console.log(red(`  [error]  ${d.email}: ${err?.message ?? err}`))
    }
  }

  if (unknownEmailProfiles.length > 0) {
    console.log()
    console.log(
      yellow(
        "unknown@clerk.local-Profile koennen nur per Clerk-Backend-API repariert werden. " +
          "Das automatische Repair laeuft beim naechsten Login dieses Users via " +
          "`getAuthenticatedUser.repairUnknownEmail`. Siehe Plan H-4."
      )
    )
  }

  console.log(green("\nFix-Phase abgeschlossen.\n"))
  process.exit(0)
}

main().catch((err) => {
  console.error(red("Unerwarteter Fehler:"), err)
  process.exit(1)
})
