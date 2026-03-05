/**
 * Navigation Update API Route
 *
 * POST-Endpoint der Navigation-Einträge hinzufügt und Seiten erstellt.
 * WICHTIG: Diese Route funktioniert nur im Entwicklungsmodus!
 *
 * @module api/navigation/update
 */

import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { z } from "zod"

import type { NavigationSuggestion } from "@/lib/ai/types/tool-metadata"
import {
  generateNavigationCode,
  insertNavItem,
  addIconImport,
  validateNavigationSuggestion,
} from "@/lib/navigation/code-generator"

/**
 * Request-Schema für Navigation-Updates
 */
const NavigationUpdateSchema = z.object({
  parentPath: z.string().min(1),
  suggestedLabel: z.string().min(2),
  suggestedId: z.string().regex(/^[a-z0-9-]+$/),
  icon: z.string().optional(),
  description: z.string().optional(),
})

/**
 * Response-Typen
 */
interface SuccessResponse {
  success: true
  message: string
  createdFiles: string[]
  modifiedFiles: string[]
  generatedHref: string
}

interface ErrorResponse {
  success: false
  error: string
  details?: string[]
}

/**
 * Prüft ob wir im Entwicklungsmodus sind
 */
function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development"
}

/**
 * Findet den Workspace-Root-Pfad
 */
function getWorkspaceRoot(): string {
  // In Next.js ist process.cwd() der Projekt-Root
  return process.cwd()
}

/**
 * POST /api/navigation/update
 *
 * Fügt einen neuen Navigation-Eintrag hinzu und erstellt die zugehörige Seite.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  // Sicherheitscheck: Nur im Development-Modus erlaubt
  if (!isDevelopment()) {
    return NextResponse.json(
      {
        success: false,
        error: "Diese API ist nur im Entwicklungsmodus verfügbar",
      },
      { status: 403 }
    )
  }

  try {
    // 1. Request validieren
    const body = await request.json()
    const parseResult = NavigationUpdateSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Ungültige Anfrage",
          details: parseResult.error.errors.map((e) => e.message),
        },
        { status: 400 }
      )
    }

    const suggestion: NavigationSuggestion = parseResult.data

    // 2. NavigationSuggestion validieren
    const validation = validateNavigationSuggestion(suggestion)
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: "Ungültige Navigation-Suggestion",
          details: validation.errors,
        },
        { status: 400 }
      )
    }

    // 3. Code generieren
    const generated = generateNavigationCode(suggestion)

    // 4. Workspace-Pfade berechnen
    const workspaceRoot = getWorkspaceRoot()
    const navigationFilePath = path.join(workspaceRoot, "src/config/navigation.ts")
    const pageFilePath = path.join(workspaceRoot, generated.pagePath)

    // 5. Prüfen ob navigation.ts existiert
    let navigationContent: string
    try {
      navigationContent = await fs.readFile(navigationFilePath, "utf-8")
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "navigation.ts nicht gefunden",
          details: [`Erwartet unter: ${navigationFilePath}`],
        },
        { status: 404 }
      )
    }

    // 6. Prüfen ob das NavItem bereits existiert
    if (navigationContent.includes(`id: "${suggestion.suggestedId}"`)) {
      return NextResponse.json(
        {
          success: false,
          error: "Navigation-Eintrag existiert bereits",
          details: [`ID: ${suggestion.suggestedId}`],
        },
        { status: 409 }
      )
    }

    // 7. Prüfen ob die Seite bereits existiert
    try {
      await fs.access(pageFilePath)
      return NextResponse.json(
        {
          success: false,
          error: "Seite existiert bereits",
          details: [`Pfad: ${generated.pagePath}`],
        },
        { status: 409 }
      )
    } catch {
      // Datei existiert nicht - das ist gut!
    }

    // 8. NavItem in navigation.ts einfügen
    let updatedNavigationContent = insertNavItem(navigationContent, suggestion)

    if (!updatedNavigationContent) {
      return NextResponse.json(
        {
          success: false,
          error: "Konnte Insert-Position nicht finden",
          details: [
            `Parent-Pfad: ${suggestion.parentPath}`,
            "Prüfe ob der Parent-Pfad existiert und ein children-Array hat",
          ],
        },
        { status: 400 }
      )
    }

    // 9. Icon-Import hinzufügen wenn nötig
    if (suggestion.icon) {
      updatedNavigationContent = addIconImport(updatedNavigationContent, suggestion.icon)
    }

    // 10. Verzeichnis für die neue Seite erstellen
    const pageDir = path.dirname(pageFilePath)
    await fs.mkdir(pageDir, { recursive: true })

    // 11. Dateien schreiben
    const createdFiles: string[] = []
    const modifiedFiles: string[] = []

    // navigation.ts aktualisieren
    await fs.writeFile(navigationFilePath, updatedNavigationContent, "utf-8")
    modifiedFiles.push("src/config/navigation.ts")

    // page.tsx erstellen
    await fs.writeFile(pageFilePath, generated.pageCode, "utf-8")
    createdFiles.push(generated.pagePath)

    // 12. Erfolg zurückgeben
    return NextResponse.json({
      success: true,
      message: `Navigation-Eintrag "${suggestion.suggestedLabel}" wurde erstellt`,
      createdFiles,
      modifiedFiles,
      generatedHref: generated.generatedHref,
    })
  } catch (error) {
    console.error("[Navigation Update API] Fehler:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Interner Serverfehler",
        details: [error instanceof Error ? error.message : String(error)],
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/navigation/update
 *
 * Gibt Informationen über die API zurück (für Debugging).
 */
export async function GET(): Promise<NextResponse> {
  if (!isDevelopment()) {
    return NextResponse.json(
      { error: "Diese API ist nur im Entwicklungsmodus verfügbar" },
      { status: 403 }
    )
  }

  return NextResponse.json({
    name: "Navigation Update API",
    description: "Fügt Navigation-Einträge hinzu und erstellt Seiten",
    endpoint: "/api/navigation/update",
    method: "POST",
    schema: {
      parentPath: "string (required) - z.B. '/galaxy/kataloge'",
      suggestedLabel: "string (required) - z.B. 'DIN 276'",
      suggestedId: "string (required) - z.B. 'galaxy-kataloge-din-276'",
      icon: "string (optional) - Lucide Icon Name, z.B. 'BookMarked'",
      description: "string (optional) - Beschreibung für die Seite",
    },
    example: {
      parentPath: "/galaxy/kataloge",
      suggestedLabel: "DIN 276",
      suggestedId: "galaxy-kataloge-din-276",
      icon: "BookMarked",
      description: "Kostengliederung nach DIN 276",
    },
  })
}
