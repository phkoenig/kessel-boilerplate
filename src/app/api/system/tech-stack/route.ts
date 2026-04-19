// AUTH: authenticated
/**
 * GET /api/system/tech-stack
 *
 * Gibt den aktuellen Tech Stack als JSON zurueck.
 * Analysiert package.json zur Laufzeit - immer aktuell.
 *
 * Auth: nur fuer eingeloggte User (Plan H-9). Die Daten sind nicht streng
 * geheim, aber es gibt keinen Grund, sie oeffentlich zu exponieren.
 */

import { requireAuth } from "@/lib/auth/guards"
import { analyzeTechStack } from "@/lib/tech-stack/analyzer"

export async function GET(): Promise<Response> {
  try {
    const userOrErr = await requireAuth()
    if (userOrErr instanceof Response) return userOrErr
    const techStack = analyzeTechStack()
    return Response.json(techStack)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return Response.json(
      { error: "Fehler beim Analysieren des Tech Stacks", details: message },
      { status: 500 }
    )
  }
}
