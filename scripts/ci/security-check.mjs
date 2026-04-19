#!/usr/bin/env node
/**
 * security:check (Plan X-1).
 *
 * Statisches Security-Gate, das in CI vor jedem Merge laufen sollte. Es fasst
 * die wichtigsten manuellen Invarianten aus dem Security-Hardening-Plan zu
 * einem einzigen `pnpm security:check`-Kommando zusammen.
 *
 * Geprueft wird:
 * 1. Keine Referenzen auf `NEXT_PUBLIC_AUTH_BYPASS` mehr im Code.
 * 2. `BOILERPLATE_AUTH_BYPASS` nicht in production/preview gesetzt.
 * 3. Admin-Allowlist-Audit gruen (`audit:allowlist`, nur in CI / mit FORCE-Flag).
 * 4. Keine direkten SpacetimeDB-Reducer-Imports in Client-Code (approximativ
 *    via Text-Suche, als zusaetzliche Leitplanke zur ESLint-Rule).
 * 5. Jede `route.ts` unter `src/app/api/**` traegt eine `// AUTH:`-Annotation
 *    mit gueltigem Level (Plan H-9).
 * 6. Optional via `RUN_FULL_SECURITY_CHECK=true`: lint, tsc, test:run und
 *    nav:check (Plan X-1 — wird im CI-Pipeline-Job aufgerufen).
 *
 * Keine Exit-Codes werden fuer Warnungen gesetzt; harte Fehler brechen ab.
 */
import { spawnSync } from "node:child_process"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

const ROOT = process.cwd()
const failures = []
const warnings = []

function runStep(name, command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: process.platform === "win32" })
  if (result.status !== 0) {
    failures.push(`${name} exited with ${result.status}`)
  }
}

function walk(dir, predicate, matches) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next" || entry === "dist") continue
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      walk(full, predicate, matches)
    } else if (predicate(full)) {
      matches.push(full)
    }
  }
}

// 1. Check: keine NEXT_PUBLIC_AUTH_BYPASS Referenzen mehr
{
  const files = []
  walk(
    join(ROOT, "src"),
    (f) => /\.(ts|tsx|js|mjs|cjs)$/.test(f) && !f.includes("__tests__"),
    files
  )
  for (const file of files) {
    const content = readFileSync(file, "utf8")
    const codeLines = content
      .split("\n")
      .filter((line) => {
        const trimmed = line.trim()
        return (
          trimmed.length > 0 &&
          !trimmed.startsWith("//") &&
          !trimmed.startsWith("*") &&
          !trimmed.startsWith("/*")
        )
      })
      .join("\n")
    if (codeLines.includes("NEXT_PUBLIC_AUTH_BYPASS")) {
      failures.push(
        `Gefundene NEXT_PUBLIC_AUTH_BYPASS Referenz in ${file}. Plan H-3: muss auf BOILERPLATE_AUTH_BYPASS umbenannt sein.`
      )
    }
  }
}

// 2. Env-Check
{
  const envLike = process.env
  const nodeEnv = envLike.NODE_ENV || "development"
  const vercelEnv = envLike.VERCEL_ENV || ""
  const bypass = envLike.BOILERPLATE_AUTH_BYPASS
  if ((nodeEnv === "production" || vercelEnv === "production") && bypass === "true") {
    failures.push("BOILERPLATE_AUTH_BYPASS darf in Production niemals 'true' sein. Plan H-3.")
  }
  if (vercelEnv === "preview" && bypass === "true") {
    warnings.push("BOILERPLATE_AUTH_BYPASS ist in Preview-Env gesetzt. Pruefen, ob bewusst.")
  }
}

// 3. Admin-Allowlist-Audit (nur in CI gruen, wenn Netzwerk vorhanden).
if (process.env.CI === "true" || process.env.FORCE_ALLOWLIST_AUDIT === "true") {
  runStep("audit:allowlist", "pnpm", ["audit:allowlist"])
}

// 4. Direkte Reducer-Imports in Client-Code (approximativ, ergaenzend zu
//    eslint-rule no-spacetime-reducers-in-client).
{
  const clientDirs = [join(ROOT, "src/components"), join(ROOT, "src/app")]
  for (const dir of clientDirs) {
    try {
      const files = []
      walk(dir, (f) => /\.(ts|tsx)$/.test(f), files)
      for (const file of files) {
        const content = readFileSync(file, "utf8")
        const hasUseClient = content.includes('"use client"') || content.includes("'use client'")
        if (!hasUseClient) continue
        if (/from\s+["']@\/lib\/spacetime\/module-bindings/.test(content)) {
          failures.push(
            `Client-Datei ${file} importiert direkt aus module-bindings. Plan C-1 Stufe 1: nur client-bindings.ts verwenden.`
          )
        }
      }
    } catch {
      // ignore missing dirs
    }
  }
}

// 5. Plan H-9: Jede API-Route muss eine // AUTH:-Annotation mit gueltigem Level haben.
{
  const ALLOWED = new Set(["public", "authenticated", "admin", "webhook", "dev-only"])
  const apiRoot = join(ROOT, "src/app/api")
  const files = []
  try {
    walk(apiRoot, (f) => /route\.(ts|js)$/.test(f), files)
  } catch {
    // ignore if api dir missing
  }
  for (const file of files) {
    const head = readFileSync(file, "utf8").slice(0, 400)
    const match = head.match(/^\/\/\s*AUTH:\s*([a-z-]+)/m)
    if (!match) {
      failures.push(
        `Route ${file} hat keine // AUTH:-Annotation. Plan H-9: erlaubt sind ${[...ALLOWED].join("|")}.`
      )
      continue
    }
    if (!ALLOWED.has(match[1])) {
      failures.push(
        `Route ${file} hat ungueltigen AUTH-Level "${match[1]}". Erlaubt: ${[...ALLOWED].join("|")}.`
      )
    }
  }
}

// 6. Optional: Vollstaendiger CI-Lauf (Plan X-1).
if (process.env.RUN_FULL_SECURITY_CHECK === "true") {
  runStep("lint", "pnpm", ["lint", "--max-warnings=0"])
  runStep("tsc", "pnpm", ["tsc", "--noEmit"])
  runStep("nav:check", "pnpm", ["nav:check"])
  runStep("test:run", "pnpm", ["test:run"])
}

if (warnings.length > 0) {
  console.warn("[security:check] Warnungen:")
  for (const w of warnings) console.warn("  -", w)
}

if (failures.length > 0) {
  console.error("[security:check] FEHLER:")
  for (const f of failures) console.error("  -", f)
  process.exit(1)
}

console.log("[security:check] OK — alle Security-Invarianten erfuellt.")
