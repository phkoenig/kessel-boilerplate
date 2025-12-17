/**
 * Debug API: Screenshot speichern
 *
 * Speichert Screenshots temporär für Debugging-Zwecke.
 */

import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

export async function POST(req: Request) {
  try {
    const { screenshot } = await req.json()

    if (!screenshot) {
      return new Response(JSON.stringify({ error: "No screenshot provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
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

    console.log("[Debug] Screenshot saved:", filepath)
    console.log("[Debug] View at:", publicUrl)

    return new Response(
      JSON.stringify({
        success: true,
        filename,
        url: publicUrl,
        size: buffer.length,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    )
  } catch (error) {
    console.error("[Debug] Failed to save screenshot:", error)
    return new Response(JSON.stringify({ error: "Failed to save screenshot" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
