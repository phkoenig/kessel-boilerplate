/**
 * GET /api/system/tech-stack/audit
 *
 * Prueft auf Security Vulnerabilities via pnpm audit.
 * In Production deaktiviert (Sicherheit + Performance).
 */

import { exec } from "node:child_process"
import { promisify } from "node:util"
import type { AuditResponse, SecurityVulnerability } from "@/lib/tech-stack"

const execAsync = promisify(exec)

interface PnpmAuditAdvisory {
  severity: string
  title: string
  url?: string
  patched_versions?: string
  vulnerable_versions?: string
  module_name?: string
  recommendation?: string
  overview?: string
  findings?: Array<{ version: string; paths: string[] }>
}

interface PnpmAuditResult {
  advisories?: Record<string, PnpmAuditAdvisory>
  metadata?: {
    vulnerabilities?: {
      critical?: number
      high?: number
      moderate?: number
      low?: number
      total?: number
    }
  }
}

export async function GET(): Promise<Response> {
  // In Production deaktiviert
  const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production"
  if (isProd) {
    return Response.json({
      status: "disabled",
      vulnerabilities: {},
      summary: { critical: 0, high: 0, moderate: 0, low: 0, total: 0 },
      message: "Security-Audit ist in Production deaktiviert.",
    } satisfies AuditResponse)
  }

  try {
    // Verwende exec mit shell: true für Windows-Kompatibilität
    const { stdout } = await execAsync("pnpm audit --json", {
      cwd: process.cwd(),
      env: process.env,
      maxBuffer: 10 * 1024 * 1024, // 10MB für große Audit-Outputs
    })

    return Response.json(parseAuditOutput(stdout))
  } catch (error) {
    // pnpm audit gibt Exit 1 bei Vulnerabilities - stdout ist trotzdem JSON
    const stdout = extractStdout(error)
    if (stdout) {
      try {
        return Response.json(parseAuditOutput(stdout))
      } catch {
        // JSON parse failed
      }
    }

    return Response.json({
      status: "disabled",
      vulnerabilities: {},
      summary: { critical: 0, high: 0, moderate: 0, low: 0, total: 0 },
      message: "Security-Audit nicht verfuegbar.",
    } satisfies AuditResponse)
  }
}

function parseAuditOutput(stdout: string): AuditResponse {
  const trimmed = stdout.trim()
  if (!trimmed) {
    return {
      status: "ok",
      vulnerabilities: {},
      summary: { critical: 0, high: 0, moderate: 0, low: 0, total: 0 },
    }
  }

  try {
    const parsed = JSON.parse(trimmed) as PnpmAuditResult

    // Gruppiere Vulnerabilities nach Package-Name (module_name)
    const vulnerabilities: Record<string, SecurityVulnerability[]> = {}
    const severityCounts = { critical: 0, high: 0, moderate: 0, low: 0 }

    if (parsed.advisories) {
      for (const advisory of Object.values(parsed.advisories)) {
        const pkgName = advisory.module_name || "unknown"
        const severity = normalizeSeverity(advisory.severity)
        severityCounts[severity]++

        const vuln: SecurityVulnerability = {
          severity,
          title: advisory.title?.trim() || "Unknown vulnerability",
          url: advisory.url,
          patchedVersion: advisory.patched_versions,
        }

        if (!vulnerabilities[pkgName]) {
          vulnerabilities[pkgName] = []
        }
        vulnerabilities[pkgName].push(vuln)
      }
    }

    const total =
      severityCounts.critical + severityCounts.high + severityCounts.moderate + severityCounts.low
    const summary = { ...severityCounts, total }

    return { status: "ok", vulnerabilities, summary }
  } catch {
    return {
      status: "error",
      vulnerabilities: {},
      summary: { critical: 0, high: 0, moderate: 0, low: 0, total: 0 },
      message: "Audit-Output konnte nicht geparst werden.",
    }
  }
}

function normalizeSeverity(severity: string): SecurityVulnerability["severity"] {
  const s = severity.toLowerCase()
  if (s === "critical") return "critical"
  if (s === "high") return "high"
  if (s === "moderate" || s === "medium") return "moderate"
  return "low"
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
