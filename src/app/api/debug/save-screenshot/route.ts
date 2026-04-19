// AUTH: dev-only (nicht erreichbar in Production)
/**
 * Debug API: Screenshot speichern
 *
 * Speichert Screenshots temporaer fuer Debugging-Zwecke.
 * Nur in Development, nur fuer eingeloggte User.
 * Plan L-14a: Modul-Guard + redirect in next.config.ts.
 */

import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { requireAuth } from "@/lib/auth/guards"
import { NextResponse } from "next/server"

if (process.env.NODE_ENV === "production") {
  throw new Error("[security] /api/debug/save-screenshot darf in Production nicht geladen werden")
}

export async function POST(req: Request): Promise<NextResponse | Response> {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Nur im Entwicklungsmodus verfügbar" }, { status: 403 })
  }

  const userOrErr = await requireAuth()
  if (userOrErr instanceof Response) return userOrErr

  try {
    const { screenshot } = await req.json()

    if (!screenshot) {
      return NextResponse.json({ error: "No screenshot provided" }, { status: 400 })
    }

    // Zielordner: public/debug-screenshots (damit man sie im Browser ansehen kann)
    const debugDir = join(process.cwd(), "public", "debug-screenshots")

    // Ordner erstellen falls nicht vorhanden
    await mkdir(debugDir, { recursive: true })

    // Dateiname mit Timestamp
    const filename = `screenshot-${Date.now()}.jpg`
    const filepath = join(debugDir, filename)

    // Base64 zu Buffer konvertieren und speichern
    const buffer = Buffer.from(screenshot, "base64")
    await writeFile(filepath, buffer)

    const publicUrl = `/debug-screenshots/${filename}`

    return NextResponse.json({
      success: true,
      filename,
      url: publicUrl,
      size: buffer.length,
    })
  } catch (error) {
    console.error("[Debug] Failed to save screenshot:", error)
    return NextResponse.json({ error: "Failed to save screenshot" }, { status: 500 })
  }
}
