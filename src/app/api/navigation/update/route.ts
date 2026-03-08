/**
 * Navigation Update API Route
 *
 * Dev-Endpoint, der neue Navigationseintraege im Core anlegt und optional
 * eine Seiten-Datei scaffoldet. Der produktive Live-Pfad der Navigation
 * liest ausschliesslich aus SpacetimeDB und nicht mehr aus navigation.ts.
 *
 * @module api/navigation/update
 */

import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { z } from "zod"

import { requireAdmin } from "@/lib/auth/guards"
import { getCoreStore } from "@/lib/core"
import type { NavigationSuggestion } from "@/lib/ai/types/tool-metadata"
import {
  generateNavigationCode,
  validateNavigationSuggestion,
} from "@/lib/navigation/code-generator"
import { ensureNavigationBootstrapped } from "@/lib/navigation/bootstrap"

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
  modifiedCoreRecords: string[]
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
 * Fügt einen neuen Core-Navigationseintrag hinzu und erstellt optional
 * die zugehörige Seite als Dev-Scaffold.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  if (!isDevelopment()) {
    return NextResponse.json(
      {
        success: false,
        error: "Diese API ist nur im Entwicklungsmodus verfügbar",
      },
      { status: 403 }
    )
  }

  const userOrErr = await requireAdmin()
  if (userOrErr instanceof Response) return userOrErr

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
    await ensureNavigationBootstrapped()
    const coreStore = getCoreStore()
    const navigationItems = await coreStore.listNavigationItems()

    const existingItem = navigationItems.find((item) => item.id === suggestion.suggestedId)
    if (existingItem) {
      return NextResponse.json(
        {
          success: false,
          error: "Navigation-Eintrag existiert bereits",
          details: [`ID: ${suggestion.suggestedId}`],
        },
        { status: 409 }
      )
    }

    const parentItem = navigationItems.find((item) => item.href === suggestion.parentPath)
    if (!parentItem) {
      return NextResponse.json(
        {
          success: false,
          error: "Parent-Pfad wurde im Core nicht gefunden",
          details: [`Parent-Pfad: ${suggestion.parentPath}`],
        },
        { status: 400 }
      )
    }

    const siblingOrder = navigationItems
      .filter((item) => item.parentId === parentItem.id)
      .reduce((maxValue, item) => Math.max(maxValue, item.orderIndex), -1)

    // 4. Workspace-Pfade berechnen
    const workspaceRoot = getWorkspaceRoot()
    const pageFilePath = path.join(workspaceRoot, generated.pagePath)

    // 5. Prüfen ob die Seite bereits existiert
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

    // 6. Verzeichnis für die neue Seite erstellen
    const pageDir = path.dirname(pageFilePath)
    await fs.mkdir(pageDir, { recursive: true })

    // 7. Dateien/Core schreiben
    const createdFiles: string[] = []
    const modifiedCoreRecords: string[] = []

    await fs.writeFile(pageFilePath, generated.pageCode, "utf-8")
    createdFiles.push(generated.pagePath)

    await coreStore.upsertNavigationItem({
      id: suggestion.suggestedId,
      parentId: parentItem.id,
      scope: parentItem.scope,
      nodeType: "page",
      label: suggestion.suggestedLabel,
      sectionTitle: null,
      slugSegment: generated.generatedHref.split("/").filter(Boolean).pop() ?? null,
      href: generated.generatedHref,
      iconName: suggestion.icon ?? "FileText",
      requiredRoles: parentItem.requiredRoles,
      orderIndex: siblingOrder + 1,
      alwaysVisible: false,
    })
    modifiedCoreRecords.push(suggestion.suggestedId)

    // 8. Erfolg zurückgeben
    return NextResponse.json({
      success: true,
      message: `Navigation-Eintrag "${suggestion.suggestedLabel}" wurde im Core erstellt`,
      createdFiles,
      modifiedCoreRecords,
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
    description: "Fügt Core-Navigationseinträge hinzu und erstellt Seiten-Scaffolds",
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
