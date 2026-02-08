import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { mapRawFontToVariable, validateFontNames } from "@/lib/fonts"
import { getTenantStoragePath } from "@/lib/utils/tenant"

/**
 * Import-Statistiken für detailliertes Feedback.
 */
interface ImportStats {
  colors: { imported: number; total: number }
  radius: { imported: boolean; value?: string }
  spacing: { imported: boolean; value?: string }
  shadows: { imported: number; total: number }
  fonts: {
    sans: { requested: string; resolved: string | null; success: boolean }
    mono: { requested: string; resolved: string | null; success: boolean }
    serif: { requested: string; resolved: string | null; success: boolean }
  }
}

/**
 * Erweiterte Response für den Theme-Import mit Warnungen.
 */
interface ThemeImportResponse {
  success: boolean
  theme?: {
    id: string
    name: string
    description: string
  }
  stats?: ImportStats
  warnings?: string[]
  missingFonts?: string[]
  fontConversions?: Array<{ from: string; to: string }>
  error?: string
  message?: string
}

/**
 * API-Route zum Importieren eines Themes aus TweakCN CSS.
 *
 * Speichert Themes in Supabase:
 * - Metadaten in `themes` Tabelle
 * - CSS in `themes` Storage Bucket
 */
export async function POST(request: NextRequest) {
  try {
    const { css, name } = await request.json()

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Theme-Name ist erforderlich" }, { status: 400 })
    }

    if (!css || typeof css !== "string") {
      return NextResponse.json({ error: "CSS-Code ist erforderlich" }, { status: 400 })
    }

    const supabase = await createClient()

    // Parse CSS und extrahiere Variablen, verwende den übergebenen Namen
    const themeData = parseTweakCNCSS(css, name.trim())

    if (!themeData.themeId || !themeData.name) {
      return NextResponse.json({ error: "Theme konnte nicht verarbeitet werden" }, { status: 400 })
    }

    // Prüfe, ob Theme bereits existiert (in Supabase)
    const { data: existingTheme } = await supabase
      .from("themes")
      .select("id")
      .eq("id", themeData.themeId)
      .single()

    if (existingTheme) {
      return NextResponse.json(
        { error: `Theme mit ID "${themeData.themeId}" existiert bereits` },
        { status: 400 }
      )
    }

    // Konvertiere Font-Namen zu CSS-Variablen und sammle Warnungen
    const fontConversionResult = convertFontVariables(themeData)
    const { warnings, missingFonts, conversions } = fontConversionResult

    // Generiere CSS-Block für das neue Theme (mit konvertierten Fonts)
    const lightBlock = generateThemeCSSBlock(themeData, false)
    const darkBlock = generateThemeCSSBlock(themeData, true)

    // Kombiniere Light und Dark CSS
    const fullCSS = `/* Theme: ${themeData.name} */\n\n/* Light Mode */\n${lightBlock}\n\n/* Dark Mode */\n${darkBlock}`

    // Validiere dynamische Fonts
    const validatedFonts: string[] = []
    const fontValidationWarnings: string[] = []

    if (missingFonts.length > 0) {
      const validationResults = await validateFontNames(missingFonts, true)

      for (const result of validationResults) {
        if (result.isGeneric) {
          fontValidationWarnings.push(
            `"${result.cleanedName}" ist ein generischer Font und wird übersprungen`
          )
        } else if (!result.isValidFormat) {
          fontValidationWarnings.push(
            result.error || `"${result.cleanedName}" hat ungültiges Format`
          )
        } else if (!result.existsAtGoogle) {
          fontValidationWarnings.push(
            `"${result.cleanedName}" wurde bei Google Fonts nicht gefunden`
          )
        } else {
          validatedFonts.push(result.cleanedName)
        }
      }
    }

    warnings.push(...fontValidationWarnings)

    // 1. CSS in Supabase Storage speichern (Multi-Tenant: tenant-spezifischer Ordner)
    const storagePath = getTenantStoragePath(`${themeData.themeId}.css`)
    const { error: storageError } = await supabase.storage
      .from("themes")
      .upload(storagePath, fullCSS, {
        contentType: "text/css",
        upsert: false,
      })

    if (storageError) {
      console.error("Fehler beim Speichern des Theme-CSS:", storageError)
      return NextResponse.json(
        { error: `CSS-Speicherung fehlgeschlagen: ${storageError.message}` },
        { status: 500 }
      )
    }

    // 2. Metadaten in Supabase Datenbank speichern
    const { error: dbError } = await supabase.from("themes").insert({
      id: themeData.themeId,
      name: themeData.name,
      description: themeData.description || "Importiertes Theme von TweakCN",
      dynamic_fonts: validatedFonts,
      is_builtin: false,
    })

    if (dbError) {
      console.error("Fehler beim Speichern der Theme-Metadaten:", dbError)
      // Rollback: CSS löschen (gleicher tenant-spezifischer Pfad)
      await supabase.storage.from("themes").remove([storagePath])
      return NextResponse.json(
        { error: `Metadaten-Speicherung fehlgeschlagen: ${dbError.message}` },
        { status: 500 }
      )
    }

    // Erstelle Import-Statistiken
    const colorVars = [
      "background",
      "foreground",
      "card",
      "card-foreground",
      "popover",
      "popover-foreground",
      "primary",
      "primary-foreground",
      "secondary",
      "secondary-foreground",
      "muted",
      "muted-foreground",
      "accent",
      "accent-foreground",
      "destructive",
      "destructive-foreground",
      "border",
      "input",
      "ring",
      "chart-1",
      "chart-2",
      "chart-3",
      "chart-4",
      "chart-5",
      "sidebar",
      "sidebar-foreground",
      "sidebar-primary",
      "sidebar-primary-foreground",
      "sidebar-accent",
      "sidebar-accent-foreground",
      "sidebar-border",
      "sidebar-ring",
    ]
    const shadowVars = [
      "shadow-2xs",
      "shadow-xs",
      "shadow-sm",
      "shadow",
      "shadow-md",
      "shadow-lg",
      "shadow-xl",
      "shadow-2xl",
    ]

    const importedColors = colorVars.filter((v) => themeData.lightVariables[v]).length
    const importedShadows = shadowVars.filter((v) => themeData.lightVariables[v]).length

    const getFontStats = (fontVar: string) => {
      const requested = themeData.lightVariables[fontVar] || ""
      const isVar = requested.startsWith("var(")
      const isRaw = requested && !isVar
      const conversion = conversions.find((c) =>
        c.from.includes(requested.split(",")[0].replace(/['"]/g, "").trim())
      )
      const isMissing = missingFonts.some((f) => requested.includes(f))

      return {
        requested: requested.split(",")[0].replace(/['"]/g, "").trim() || "nicht definiert",
        resolved: isVar ? requested : conversion?.to || (isMissing ? null : requested),
        success: isVar || (!!conversion && !isMissing) || !isRaw,
      }
    }

    const stats: ImportStats = {
      colors: { imported: importedColors, total: colorVars.length },
      radius: {
        imported: !!themeData.lightVariables["radius"],
        value: themeData.lightVariables["radius"],
      },
      spacing: {
        imported: !!themeData.lightVariables["spacing"],
        value: themeData.lightVariables["spacing"],
      },
      shadows: { imported: importedShadows, total: shadowVars.length },
      fonts: {
        sans: getFontStats("font-sans"),
        mono: getFontStats("font-mono"),
        serif: getFontStats("font-serif"),
      },
    }

    const response: ThemeImportResponse = {
      success: true,
      theme: {
        id: themeData.themeId,
        name: themeData.name,
        description: themeData.description || "Importiertes Theme von TweakCN",
      },
      stats,
    }

    if (warnings.length > 0) {
      response.warnings = warnings
    }

    if (validatedFonts.length > 0) {
      response.missingFonts = validatedFonts
    }

    if (conversions.length > 0) {
      response.fontConversions = conversions
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Fehler beim Importieren des Themes:", error)
    return NextResponse.json(
      {
        error: "Fehler beim Importieren des Themes",
        message: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      { status: 500 }
    )
  }
}

/**
 * Parst TweakCN CSS und extrahiert Theme-Daten für Light und Dark Mode separat.
 */
function parseTweakCNCSS(
  css: string,
  themeName: string
): {
  themeId: string
  name: string
  description?: string
  lightVariables: Record<string, string>
  darkVariables: Record<string, string>
} {
  const themeId = themeName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50)

  const lightVariables: Record<string, string> = {}

  let rootIndex = 0
  while ((rootIndex = css.indexOf(":root", rootIndex)) !== -1) {
    if (rootIndex > 0 && css.substring(Math.max(0, rootIndex - 10), rootIndex).includes(".dark")) {
      rootIndex += 5
      continue
    }

    const openBrace = css.indexOf("{", rootIndex)
    if (openBrace === -1) {
      rootIndex += 5
      continue
    }

    let braceCount = 0
    let closeBrace = openBrace
    for (let i = openBrace; i < css.length; i++) {
      if (css[i] === "{") braceCount++
      if (css[i] === "}") braceCount--
      if (braceCount === 0) {
        closeBrace = i
        break
      }
    }

    if (closeBrace > openBrace) {
      const blockContent = css.substring(openBrace + 1, closeBrace)
      const varMatches = blockContent.matchAll(/--([a-z0-9-]+):\s*([^;]+);/gi)
      for (const match of varMatches) {
        const [, name, value] = match
        lightVariables[name.trim()] = value.trim()
      }
    }

    rootIndex = closeBrace + 1
  }

  const darkVariables: Record<string, string> = {}

  let darkIndex = 0
  while ((darkIndex = css.indexOf(".dark", darkIndex)) !== -1) {
    const openBrace = css.indexOf("{", darkIndex)
    if (openBrace === -1) {
      darkIndex += 5
      continue
    }

    let braceCount = 0
    let closeBrace = openBrace
    for (let i = openBrace; i < css.length; i++) {
      if (css[i] === "{") braceCount++
      if (css[i] === "}") braceCount--
      if (braceCount === 0) {
        closeBrace = i
        break
      }
    }

    if (closeBrace > openBrace) {
      const blockContent = css.substring(openBrace + 1, closeBrace)
      const varMatches = blockContent.matchAll(/--([a-z0-9-]+):\s*([^;]+);/gi)
      for (const match of varMatches) {
        const [, name, value] = match
        darkVariables[name.trim()] = value.trim()
      }
    }

    darkIndex = closeBrace + 1
  }

  if (Object.keys(lightVariables).length === 0) {
    const varMatches = css.matchAll(/--([a-z0-9-]+):\s*([^;]+);/gi)
    for (const match of varMatches) {
      const [, name, value] = match
      lightVariables[name.trim()] = value.trim()
    }
  }

  if (Object.keys(lightVariables).length === 0) {
    throw new Error("Keine CSS-Variablen im bereitgestellten CSS gefunden")
  }

  return {
    themeId,
    name: themeName,
    description: `Importiertes Theme von TweakCN`,
    lightVariables,
    darkVariables,
  }
}

/**
 * Generiert CSS-Block für ein Theme.
 */
function generateThemeCSSBlock(
  themeData: {
    themeId: string
    name: string
    lightVariables: Record<string, string>
    darkVariables: Record<string, string>
  },
  isDark: boolean
): string {
  const selector = isDark
    ? `.dark[data-theme="${themeData.themeId}"]`
    : `:root[data-theme="${themeData.themeId}"]`

  const comment = `/* ============================================
 * THEME: ${themeData.name}${isDark ? " (Dark Mode)" : ""}
 * ============================================ */`

  const sourceVariables = isDark ? themeData.darkVariables : themeData.lightVariables
  const fallbackVariables = themeData.lightVariables

  const standardVariables = [
    "background",
    "foreground",
    "card",
    "card-foreground",
    "popover",
    "popover-foreground",
    "primary",
    "primary-foreground",
    "secondary",
    "secondary-foreground",
    "muted",
    "muted-foreground",
    "accent",
    "accent-foreground",
    "destructive",
    "destructive-foreground",
    "border",
    "input",
    "ring",
    "chart-1",
    "chart-2",
    "chart-3",
    "chart-4",
    "chart-5",
    "sidebar",
    "sidebar-foreground",
    "sidebar-primary",
    "sidebar-primary-foreground",
    "sidebar-accent",
    "sidebar-accent-foreground",
    "sidebar-border",
    "sidebar-ring",
    "radius",
    "spacing",
    "font-sans",
    "font-serif",
    "font-mono",
    "shadow-2xs",
    "shadow-xs",
    "shadow-sm",
    "shadow",
    "shadow-md",
    "shadow-lg",
    "shadow-xl",
    "shadow-2xl",
  ]

  const variables = standardVariables
    .map((varName) => {
      if (sourceVariables[varName]) {
        return `  --${varName}: ${sourceVariables[varName]};`
      }
      if (fallbackVariables[varName]) {
        return `  --${varName}: ${fallbackVariables[varName]};`
      }
      if (isDark) {
        if (varName === "background") return `  --${varName}: oklch(0.15 0 0);`
        if (varName === "foreground") return `  --${varName}: oklch(0.95 0 0);`
        if (varName === "card") return `  --${varName}: oklch(0.2 0 0);`
        if (varName === "primary") return `  --${varName}: oklch(0.6 0.15 250);`
      } else {
        if (varName === "background") return `  --${varName}: oklch(1 0 0);`
        if (varName === "foreground") return `  --${varName}: oklch(0.2 0 0);`
        if (varName === "card") return `  --${varName}: oklch(1 0 0);`
        if (varName === "primary") return `  --${varName}: oklch(0.6 0.15 250);`
      }
      if (varName === "radius") return `  --${varName}: 0.5rem;`
      if (varName === "font-sans") return `  --${varName}: var(--font-inter);`
      if (varName === "font-serif") return `  --${varName}: var(--font-playfair);`
      if (varName === "font-mono") return `  --${varName}: var(--font-jetbrains);`
      if (varName === "spacing") return `  --${varName}: 0.25rem;`

      if (varName === "shadow-2xs") return `  --${varName}: 0 1px 2px 0 rgb(0 0 0 / 0.05);`
      if (varName === "shadow-xs") return `  --${varName}: 0 1px 2px 0 rgb(0 0 0 / 0.05);`
      if (varName === "shadow-sm")
        return `  --${varName}: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);`
      if (varName === "shadow")
        return `  --${varName}: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);`
      if (varName === "shadow-md")
        return `  --${varName}: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);`
      if (varName === "shadow-lg")
        return `  --${varName}: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);`
      if (varName === "shadow-xl")
        return `  --${varName}: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);`
      if (varName === "shadow-2xl") return `  --${varName}: 0 25px 50px -12px rgb(0 0 0 / 0.25);`

      return `  --${varName}: oklch(0.5 0 0); /* Fallback */`
    })
    .join("\n")

  return `${comment}
${selector} {
${variables}
}`
}

/**
 * Konvertiert rohe Font-Namen in den Theme-Variablen zu CSS-Variablen.
 */
function convertFontVariables(themeData: {
  lightVariables: Record<string, string>
  darkVariables: Record<string, string>
}): {
  warnings: string[]
  missingFonts: string[]
  conversions: Array<{ from: string; to: string }>
} {
  const warnings: string[] = []
  const missingFonts: string[] = []
  const conversions: Array<{ from: string; to: string }> = []

  const fontVariableNames = ["font-sans", "font-mono", "font-serif"]

  const genericFonts = [
    "sans-serif",
    "serif",
    "monospace",
    "cursive",
    "fantasy",
    "system-ui",
    "ui-serif",
    "ui-sans-serif",
    "ui-monospace",
    "ui-rounded",
    "georgia",
    "cambria",
    "times new roman",
    "times",
    "arial",
    "helvetica",
  ]

  const cleanFontName = (rawValue: string): string | null => {
    const firstFont = rawValue.split(",")[0].trim()
    const cleaned = firstFont.replace(/['"]/g, "").trim()

    if (!cleaned || genericFonts.includes(cleaned.toLowerCase())) {
      return null
    }

    return cleaned
  }

  for (const fontVar of fontVariableNames) {
    if (themeData.lightVariables[fontVar]) {
      const rawValue = themeData.lightVariables[fontVar]

      if (rawValue.startsWith("var(")) {
        continue
      }

      const firstFont = rawValue.split(",")[0].trim().replace(/['"]/g, "").toLowerCase()
      const isGeneric = genericFonts.includes(firstFont)

      if (isGeneric) {
        continue
      }

      const result = mapRawFontToVariable(rawValue)

      if (result.success && result.variable) {
        themeData.lightVariables[fontVar] = result.variable
        conversions.push({ from: rawValue, to: result.variable })
      } else if (result.warning) {
        warnings.push(`Light-Mode: ${result.warning}`)
        const fontName = cleanFontName(rawValue)
        if (fontName && !missingFonts.includes(fontName)) {
          missingFonts.push(fontName)
        }
      }
    }
  }

  for (const fontVar of fontVariableNames) {
    if (themeData.darkVariables[fontVar]) {
      const rawValue = themeData.darkVariables[fontVar]

      if (rawValue.startsWith("var(")) {
        continue
      }

      const firstFont = rawValue.split(",")[0].trim().replace(/['"]/g, "").toLowerCase()
      const isGeneric = genericFonts.includes(firstFont)

      if (isGeneric) {
        continue
      }

      const result = mapRawFontToVariable(rawValue)

      if (result.success && result.variable) {
        themeData.darkVariables[fontVar] = result.variable
        if (!conversions.some((c) => c.from === rawValue)) {
          conversions.push({ from: rawValue, to: result.variable })
        }
      } else if (result.warning) {
        const warningMessage = `Dark-Mode: ${result.warning}`
        if (!warnings.includes(warningMessage)) {
          warnings.push(warningMessage)
        }
        const fontName = cleanFontName(rawValue)
        if (fontName && !missingFonts.includes(fontName)) {
          missingFonts.push(fontName)
        }
      }
    }
  }

  return { warnings, missingFonts, conversions }
}
