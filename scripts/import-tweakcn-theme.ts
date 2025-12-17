#!/usr/bin/env npx ts-node

/**
 * TweakCN Theme Import Script
 * ===========================
 *
 * Konvertiert einen TweakCN CSS-Export in unser tokens.css Schema.
 *
 * Verwendung:
 *   npx ts-node scripts/import-tweakcn-theme.ts --id "mein-theme" --input ./tweakcn-export.css
 *
 * Was das Script macht:
 * 1. Liest TweakCN CSS-Export
 * 2. Extrahiert :root und .dark Blöcke
 * 3. Konvertiert zu [data-theme="x"] Selektoren
 * 4. Fügt am Ende von tokens.css ein
 * 5. Erstellt Registry-Entry Vorlage
 */

import * as fs from "fs"
import * as path from "path"

interface ParsedTheme {
  lightVars: string
  darkVars: string
}

/**
 * Parst TweakCN CSS-Export und extrahiert Variablen.
 */
function parseTweakCNExport(css: string): ParsedTheme {
  // Finde :root Block ([\s\S] statt . mit /s flag für ES2017 Kompatibilität)
  const rootMatch = css.match(/:root\s*\{([\s\S]*?)\}/)
  const lightVars = rootMatch ? rootMatch[1].trim() : ""

  // Finde .dark Block
  const darkMatch = css.match(/\.dark\s*\{([\s\S]*?)\}/)
  const darkVars = darkMatch ? darkMatch[1].trim() : ""

  return { lightVars, darkVars }
}

/**
 * Generiert den CSS-Block für tokens.css
 */
function generateTokensCSS(themeId: string, parsed: ParsedTheme): string {
  const header = `
/* ============================================
 * THEME: ${themeId} (TweakCN Import)
 * Importiert am: ${new Date().toISOString().split("T")[0]}
 * ============================================ */`

  const lightBlock = `
:root[data-theme="${themeId}"] {
  ${parsed.lightVars}
}`

  const darkBlock = `
.dark[data-theme="${themeId}"] {
  ${parsed.darkVars}
}`

  return `${header}${lightBlock}
${darkBlock}
`
}

/**
 * Generiert den Registry-Entry
 */
function generateRegistryEntry(themeId: string, name: string): string {
  return `
// Füge dies in src/themes/registry.ts ein:
{
  id: "${themeId}",
  name: "${name}",
  description: "Importiert aus TweakCN.",
},`
}

/**
 * Hauptfunktion
 */
function main(): void {
  const args = process.argv.slice(2)

  // Parse Argumente
  let themeId = ""
  let inputFile = ""
  let themeName = ""

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--id" && args[i + 1]) {
      themeId = args[i + 1]
      i++
    } else if (args[i] === "--input" && args[i + 1]) {
      inputFile = args[i + 1]
      i++
    } else if (args[i] === "--name" && args[i + 1]) {
      themeName = args[i + 1]
      i++
    }
  }

  // Validierung
  if (!themeId || !inputFile) {
    console.log(`
TweakCN Theme Import Script
===========================

Verwendung:
  npx ts-node scripts/import-tweakcn-theme.ts --id "theme-id" --input ./tweakcn-export.css [--name "Theme Name"]

Argumente:
  --id      Theme-ID (wird für data-theme Attribut verwendet)
  --input   Pfad zur TweakCN CSS-Export-Datei
  --name    (Optional) Anzeigename des Themes

Beispiel:
  npx ts-node scripts/import-tweakcn-theme.ts --id "ocean-blue" --input ./ocean-blue.css --name "Ocean Blue"
    `)
    process.exit(1)
  }

  // Setze Name auf ID falls nicht angegeben
  if (!themeName) {
    themeName = themeId
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  }

  // Lese Input-Datei
  const inputPath = path.resolve(process.cwd(), inputFile)
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Datei nicht gefunden: ${inputPath}`)
    process.exit(1)
  }

  const css = fs.readFileSync(inputPath, "utf-8")

  // Parse TweakCN Export
  const parsed = parseTweakCNExport(css)

  if (!parsed.lightVars) {
    console.error("❌ Keine :root Variablen im CSS gefunden.")
    process.exit(1)
  }

  // Generiere Output
  const tokensCSS = generateTokensCSS(themeId, parsed)
  const registryEntry = generateRegistryEntry(themeId, themeName)

  // Output
  console.log("\n✅ Theme erfolgreich geparst!\n")
  console.log("=".repeat(60))
  console.log("CSS FÜR tokens.css:")
  console.log("=".repeat(60))
  console.log(tokensCSS)
  console.log("\n" + "=".repeat(60))
  console.log("REGISTRY ENTRY:")
  console.log("=".repeat(60))
  console.log(registryEntry)
  console.log("\n")

  // Optionale: Direkt anhängen
  const tokensPath = path.resolve(process.cwd(), "src/themes/tokens.css")

  if (fs.existsSync(tokensPath)) {
    console.log(`💡 Tipp: Füge den CSS-Block manuell am Ende von ${tokensPath} ein.`)
    console.log(`   Oder verwende: echo '...' >> ${tokensPath}`)
  }
}

main()
