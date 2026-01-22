/**
 * GET /api/system/tech-stack/updates
 *
 * Prueft auf verfuegbare Package-Updates via pnpm outdated.
 * In Production deaktiviert (Sicherheit + Performance).
 */

import { execFile } from "node:child_process"
import { promisify } from "node:util"
import type { UpdatesResponse, OutdatedPackage } from "@/lib/tech-stack"

const execFileAsync = promisify(execFile)

export async function GET(): Promise<Response> {
  // In Production deaktiviert
  const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production"
  if (isProd) {
    return Response.json({
      status: "disabled",
      packages: [],
      message: "Update-Check ist in Production deaktiviert.",
    } satisfies UpdatesResponse)
  }

  try {
    // pnpm outdated gibt Exit-Code 1 zurueck wenn Updates vorhanden sind
    // Daher muessen wir auch den Error-Case behandeln
    const { stdout } = await execFileAsync("pnpm", ["outdated", "--json"], {
      cwd: process.cwd(),
      env: process.env,
    })

    const packages = parseOutdatedOutput(stdout)
    return Response.json({ status: "ok", packages } satisfies UpdatesResponse)
  } catch (error) {
    // pnpm outdated gibt Exit 1 wenn Updates vorhanden - stdout ist trotzdem JSON
    const stdout = extractStdout(error)
    if (stdout) {
      try {
        const packages = parseOutdatedOutput(stdout)
        return Response.json({ status: "ok", packages } satisfies UpdatesResponse)
      } catch {
        // JSON parse failed - fall through
      }
    }

    // Update-Check ist optional - nicht kritisch wenn es fehlschlägt
    return Response.json({
      status: "disabled",
      packages: [],
      message: "Update-Check nicht verfuegbar (pnpm outdated).",
    } satisfies UpdatesResponse)
  }
}

interface PnpmOutdatedEntry {
  current: string
  latest: string
  wanted?: string
  isDeprecated?: boolean
  dependencyType?: string
}

function parseOutdatedOutput(stdout: string): OutdatedPackage[] {
  const trimmed = stdout.trim()
  if (!trimmed) return []

  try {
    const parsed = JSON.parse(trimmed) as Record<string, PnpmOutdatedEntry>

    // pnpm outdated --json gibt ein Object mit Package-Namen als Keys zurueck
    return Object.entries(parsed)
      .filter(([, info]) => info.current !== info.latest) // Nur echte Updates
      .map(([name, info]) => ({
        name,
        current: info.current,
        latest: info.latest,
        wanted: info.wanted,
      }))
  } catch {
    return []
  }
}

function extractStdout(error: unknown): string | null {
  if (typeof error === "object" && error !== null && "stdout" in error) {
    const stdout = (error as { stdout?: unknown }).stdout
    if (typeof stdout === "string" && stdout.trim()) {
      return stdout.trim()
    }
  }
  return null
}
