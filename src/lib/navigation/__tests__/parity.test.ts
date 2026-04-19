import { readdirSync, statSync } from "node:fs"
import { dirname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

import { NAVIGATION_SEED } from "../seed"

const __dirname = dirname(fileURLToPath(import.meta.url))
/** Repo-Root: `src/lib/navigation/__tests__` → vier Ebenen hoch. */
const repoRoot = join(__dirname, "..", "..", "..", "..")
const shellAppDir = join(repoRoot, "src", "app", "(shell)")

/**
 * Rekursiv alle `page.tsx` unter `(shell)` sammeln (ohne extra Dependencies).
 */
function collectPageFiles(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) {
      out.push(...collectPageFiles(full))
    } else if (name === "page.tsx") {
      out.push(full)
    }
  }
  return out
}

/**
 * Next.js-Dateipfad → URL-Pfad (Route Groups und parallel segments entfernen).
 */
function filePathToRoute(filePath: string): string | null {
  const rel = relative(shellAppDir, filePath).replace(/\\/g, "/")
  if (!rel.startsWith(".") && !rel.includes("..")) {
    // ok
  }

  const withoutPage = rel.replace(/(^|\/)page\.tsx$/, "")
  const segments = withoutPage.split("/").filter(Boolean)

  const routeSegments: string[] = []
  for (const seg of segments) {
    if (/^\([^)]+\)$/.test(seg)) {
      continue
    }
    if (seg.startsWith("[...") && seg.endsWith("]")) {
      return null
    }
    if (seg.startsWith("[") && seg.endsWith("]")) {
      return null
    }
    routeSegments.push(seg)
  }

  if (routeSegments.length === 0) {
    return "/"
  }
  return `/${routeSegments.join("/")}`
}

const NAV_HREFS = new Set<string>(
  NAVIGATION_SEED.map((row) => row.href).filter(
    (h): h is NonNullable<typeof h> => typeof h === "string" && h.length > 0
  )
)

/** Seiten unter `(shell)` ohne Seed-`href` (Absicht / Legacy). */
const ROUTES_WITHOUT_SEED_HREF: readonly string[] = ["/", "/benutzer-menue/app-status"]

/**
 * Seed-`href` ohne eigene `page.tsx` auf exakt diesem Pfad (Sektions-„Landing“-URLs;
 * Unterseiten existieren unter Kindpfaden).
 */
const SEED_HREF_WITHOUT_PAGE: readonly string[] = [
  "/ueber-die-app",
  "/app-verwaltung",
  "/benutzer-menue",
]

describe("navigation parity: filesystem vs NAVIGATION_SEED", () => {
  it("jede statische Shell-Route ist im Seed oder in der Route-Allowlist", () => {
    const files = collectPageFiles(shellAppDir)
    const routes = new Set<string>()
    for (const f of files) {
      const r = filePathToRoute(f)
      if (r != null) {
        routes.add(r)
      }
    }

    const missing = [...routes].filter(
      (r) => !NAV_HREFS.has(r) && !ROUTES_WITHOUT_SEED_HREF.includes(r)
    )
    expect(missing, `Routes ohne Seed-Eintrag: ${missing.join(", ")}`).toEqual([])
  })

  it("jeder Seed-`href` hat eine passende Shell-Page oder steht auf der Nav-Allowlist", () => {
    const files = collectPageFiles(shellAppDir)
    const routes = new Set<string>()
    for (const f of files) {
      const r = filePathToRoute(f)
      if (r != null) {
        routes.add(r)
      }
    }

    const orphanHrefs = [...NAV_HREFS].filter(
      (h) => !routes.has(h) && !SEED_HREF_WITHOUT_PAGE.includes(h)
    )
    expect(orphanHrefs, `Seed-hrefs ohne Page: ${orphanHrefs.join(", ")}`).toEqual([])
  })
})
