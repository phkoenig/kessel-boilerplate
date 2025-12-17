#!/usr/bin/env tsx
/**
 * Theme-Validierungs-Script
 * =========================
 *
 * Validiert die gesamte Theme-Konfiguration auf Konsistenz und Korrektheit.
 *
 * Prüfungen:
 * 1. Alle --font-sans/mono/serif in tokens.css verwenden var(--font-*) Syntax
 * 2. Alle referenzierten Font-Variablen existieren in layout.tsx
 * 3. Jedes Theme in tokens.css hat einen Eintrag in registry.ts
 * 4. Jedes Theme hat einen Light- und Dark-Mode-Block
 *
 * Verwendung:
 *   pnpm validate:themes
 *   tsx scripts/validate-themes.ts
 *
 * Exit Codes:
 *   0 - Alle Validierungen bestanden
 *   1 - Validierungsfehler gefunden
 */

import { readFileSync, existsSync } from "fs"
import { join } from "path"
import { validateCSSFontSyntax, KNOWN_FONT_VARIABLES } from "../src/lib/fonts"

/**
 * Validierungsfehler mit Kontext.
 */
interface ValidationError {
  type: "error" | "warning"
  file: string
  line?: number
  message: string
  suggestion?: string
}

/**
 * Validierungsergebnis.
 */
interface ValidationResult {
  passed: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  summary: {
    themesInTokens: string[]
    themesInRegistry: string[]
    fontsInLayout: string[]
  }
}

/**
 * Liest eine Datei relativ zum Projekt-Root.
 */
const readProjectFile = (relativePath: string): string => {
  const fullPath = join(process.cwd(), relativePath)
  if (!existsSync(fullPath)) {
    throw new Error(`Datei nicht gefunden: ${relativePath}`)
  }
  return readFileSync(fullPath, "utf-8")
}

/**
 * Extrahiert Theme-IDs aus tokens.css.
 * Sucht nach :root[data-theme="..."] und .dark[data-theme="..."] Selektoren.
 * Ignoriert Zeilen, die mit * beginnen (Kommentare).
 */
const extractThemesFromTokens = (tokensCSS: string): { light: string[]; dark: string[] } => {
  const lightThemes: string[] = []
  const darkThemes: string[] = []

  // Teile in Zeilen auf und filtere Kommentare heraus
  const lines = tokensCSS.split("\n")

  for (const line of lines) {
    // Überspringe Kommentarzeilen
    const trimmedLine = line.trim()
    if (
      trimmedLine.startsWith("*") ||
      trimmedLine.startsWith("/*") ||
      trimmedLine.startsWith("//")
    ) {
      continue
    }

    // Light Mode Themes
    const lightMatch = line.match(/:root\[data-theme="([^"]+)"\]/)
    if (lightMatch && !lightThemes.includes(lightMatch[1])) {
      lightThemes.push(lightMatch[1])
    }

    // Dark Mode Themes
    const darkMatch = line.match(/\.dark\[data-theme="([^"]+)"\]/)
    if (darkMatch && !darkThemes.includes(darkMatch[1])) {
      darkThemes.push(darkMatch[1])
    }
  }

  return { light: lightThemes, dark: darkThemes }
}

/**
 * Extrahiert Theme-IDs aus registry.ts.
 */
const extractThemesFromRegistry = (registryTS: string): string[] => {
  const themes: string[] = []
  const matches = registryTS.matchAll(/id:\s*["']([^"']+)["']/g)

  for (const match of matches) {
    themes.push(match[1])
  }

  return themes
}

/**
 * Extrahiert Font-Variablen aus layout.tsx.
 * Sucht nach variable: "--font-xyz" Definitionen.
 */
const extractFontsFromLayout = (layoutTSX: string): string[] => {
  const fonts: string[] = []
  const matches = layoutTSX.matchAll(/variable:\s*["'](-{2}font-[a-z0-9-]+)["']/g)

  for (const match of matches) {
    fonts.push(match[1])
  }

  return fonts
}

/**
 * Extrahiert Font-Referenzen aus tokens.css.
 * Sucht nach var(--font-xyz) Referenzen.
 */
const extractFontReferencesFromTokens = (tokensCSS: string): string[] => {
  const fonts: string[] = []
  const matches = tokensCSS.matchAll(/var\((--font-[a-z0-9-]+)\)/g)

  for (const match of matches) {
    if (!fonts.includes(match[1])) {
      fonts.push(match[1])
    }
  }

  return fonts
}

/**
 * Führt alle Validierungen durch.
 */
const validateThemes = (): ValidationResult => {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  // Lade Dateien
  let tokensCSS: string
  let registryTS: string
  let layoutTSX: string

  try {
    tokensCSS = readProjectFile("src/themes/tokens.css")
    registryTS = readProjectFile("src/themes/registry.ts")
    layoutTSX = readProjectFile("src/app/layout.tsx")
  } catch (error) {
    return {
      passed: false,
      errors: [
        {
          type: "error",
          file: "project",
          message:
            error instanceof Error ? error.message : "Unbekannter Fehler beim Laden der Dateien",
        },
      ],
      warnings: [],
      summary: { themesInTokens: [], themesInRegistry: [], fontsInLayout: [] },
    }
  }

  // 1. Validiere Font-Syntax in tokens.css
  const fontErrors = validateCSSFontSyntax(tokensCSS)
  for (const fontError of fontErrors) {
    errors.push({
      type: "error",
      file: "src/themes/tokens.css",
      line: fontError.line,
      message: fontError.message,
      suggestion: `Ersetze "${fontError.value}" mit "var(--font-xyz)"`,
    })
  }

  // 2. Prüfe, ob alle referenzierten Font-Variablen in layout.tsx existieren
  const fontsInLayout = extractFontsFromLayout(layoutTSX)
  const fontReferencesInTokens = extractFontReferencesFromTokens(tokensCSS)

  for (const fontRef of fontReferencesInTokens) {
    if (!fontsInLayout.includes(fontRef)) {
      errors.push({
        type: "error",
        file: "src/themes/tokens.css",
        message: `Font-Variable "${fontRef}" wird verwendet, aber nicht in layout.tsx geladen`,
        suggestion: `Füge die Font-Definition in src/app/layout.tsx hinzu`,
      })
    }
  }

  // 3. Prüfe Theme-Registry-Konsistenz
  const tokensThemes = extractThemesFromTokens(tokensCSS)
  const registryThemes = extractThemesFromRegistry(registryTS)

  // Themes in tokens.css aber nicht in registry.ts
  for (const theme of tokensThemes.light) {
    if (theme !== "default" && !registryThemes.includes(theme)) {
      errors.push({
        type: "error",
        file: "src/themes/registry.ts",
        message: `Theme "${theme}" existiert in tokens.css, aber nicht in registry.ts`,
        suggestion: `Füge einen Registry-Eintrag für "${theme}" hinzu`,
      })
    }
  }

  // Themes in registry.ts aber nicht in tokens.css
  for (const theme of registryThemes) {
    if (theme !== "default" && !tokensThemes.light.includes(theme)) {
      errors.push({
        type: "error",
        file: "src/themes/tokens.css",
        message: `Theme "${theme}" existiert in registry.ts, aber nicht in tokens.css`,
        suggestion: `Füge einen CSS-Block für "${theme}" in tokens.css hinzu`,
      })
    }
  }

  // 4. Prüfe, ob jedes Theme einen Light- und Dark-Mode hat
  for (const theme of tokensThemes.light) {
    if (!tokensThemes.dark.includes(theme)) {
      warnings.push({
        type: "warning",
        file: "src/themes/tokens.css",
        message: `Theme "${theme}" hat keinen Dark-Mode-Block`,
        suggestion: `Füge einen .dark[data-theme="${theme}"] Block hinzu`,
      })
    }
  }

  // 5. Prüfe auf unbekannte Font-Variablen in tokens.css
  for (const fontRef of fontReferencesInTokens) {
    if (!KNOWN_FONT_VARIABLES.includes(fontRef as (typeof KNOWN_FONT_VARIABLES)[number])) {
      warnings.push({
        type: "warning",
        file: "src/themes/tokens.css",
        message: `Font-Variable "${fontRef}" ist nicht in der Font-Registry registriert`,
        suggestion: `Registriere die Font in src/lib/fonts/registry.ts`,
      })
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
    summary: {
      themesInTokens: tokensThemes.light,
      themesInRegistry: registryThemes,
      fontsInLayout,
    },
  }
}

/**
 * Formatiert und gibt das Validierungsergebnis aus.
 */
const printResult = (result: ValidationResult): void => {
  console.log("\n" + "=".repeat(60))
  console.log("🎨 Theme-Validierung")
  console.log("=".repeat(60) + "\n")

  // Summary
  console.log("📊 Zusammenfassung:")
  console.log(`   Themes in tokens.css: ${result.summary.themesInTokens.length}`)
  console.log(`   Themes in registry.ts: ${result.summary.themesInRegistry.length}`)
  console.log(`   Fonts in layout.tsx: ${result.summary.fontsInLayout.length}`)
  console.log("")

  // Errors
  if (result.errors.length > 0) {
    console.log("❌ Fehler:")
    for (const error of result.errors) {
      const location = error.line ? `${error.file}:${error.line}` : error.file
      console.log(`   [${location}] ${error.message}`)
      if (error.suggestion) {
        console.log(`   💡 ${error.suggestion}`)
      }
    }
    console.log("")
  }

  // Warnings
  if (result.warnings.length > 0) {
    console.log("⚠️  Warnungen:")
    for (const warning of result.warnings) {
      const location = warning.line ? `${warning.file}:${warning.line}` : warning.file
      console.log(`   [${location}] ${warning.message}`)
      if (warning.suggestion) {
        console.log(`   💡 ${warning.suggestion}`)
      }
    }
    console.log("")
  }

  // Result
  if (result.passed) {
    console.log("✅ Alle Validierungen bestanden!")
  } else {
    console.log(`❌ ${result.errors.length} Fehler gefunden`)
  }

  console.log("\n" + "=".repeat(60) + "\n")
}

// Hauptprogramm
const main = (): void => {
  try {
    const result = validateThemes()
    printResult(result)
    process.exit(result.passed ? 0 : 1)
  } catch (error) {
    console.error("Fehler bei der Validierung:", error)
    process.exit(1)
  }
}

// Exportiere für Tests
export {
  validateThemes,
  extractThemesFromTokens,
  extractThemesFromRegistry,
  extractFontsFromLayout,
  extractFontReferencesFromTokens,
  type ValidationError,
  type ValidationResult,
}

// Führe nur aus, wenn direkt aufgerufen (nicht beim Import für Tests)
// In ESM wird import.meta.url verwendet
const isDirectRun =
  typeof process !== "undefined" &&
  process.argv[1] &&
  (process.argv[1].endsWith("validate-themes.ts") || process.argv[1].endsWith("validate-themes.js"))

if (isDirectRun) {
  main()
}
