/**
 * GET /api/system/tech-stack
 *
 * Gibt den aktuellen Tech Stack als JSON zurueck.
 * Analysiert package.json zur Laufzeit - immer aktuell.
 */

import { analyzeTechStack } from "@/lib/tech-stack/analyzer"

export async function GET(): Promise<Response> {
  try {
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
