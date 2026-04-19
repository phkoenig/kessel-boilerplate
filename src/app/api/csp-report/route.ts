// AUTH: public (Browser-Background-Reports, Plan H-8)
import { NextResponse } from "next/server"

/**
 * CSP-Violation-Report-Endpoint (Plan H-8).
 *
 * Browser senden hier Reports zu CSP-Verletzungen. Waehrend der Report-Only-
 * Phase dient das zur Konfigurationsabstimmung, bevor die CSP auf Enforce
 * gestellt wird.
 *
 * Bewusst **public** (keine Auth): Browser senden Reports ohne User-Session
 * und fuer alle Seiten. Wir schreiben nur ins Log (bzw. spaeter Sentry);
 * keine User-Daten sichtbar.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.warn("[csp-report]", JSON.stringify(body))
  } catch {
    // Malformed reports ignorieren, kein 500
  }
  return NextResponse.json({ ok: true })
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 })
}
