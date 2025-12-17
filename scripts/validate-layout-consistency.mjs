#!/usr/bin/env node
// scripts/validate-layout-consistency.mjs
// Validiert, dass alle Seiten das zentrale Layout-System nutzen und keine eigenen Container erstellen

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, "..")

// Patterns, die auf eigene Container hinweisen (VERBOTEN in page.tsx)
const FORBIDDEN_PATTERNS = [
  {
    pattern: /className=["'][^"']*\bmax-w-[0-9a-z-]+/,
    description: "max-w-* Klassen (Container-Breite)",
    example: 'className="mx-auto max-w-4xl"',
    fix: "Entferne den Container. Das Layout stellt bereits max-w-7xl bereit.",
  },
  {
    pattern: /className=["'][^"']*\bmx-auto\b[^"']*\bmax-w-/,
    description: "mx-auto mit max-w Kombination (eigener Container)",
    example: 'className="mx-auto max-w-4xl"',
    fix: "Entferne den Container. Das Layout zentriert bereits.",
  },
  {
    pattern: /className=["'][^"']*\bmin-h-screen\b[^"']*\bp-[468]\b/,
    description: "min-h-screen mit Padding (eigener Layout-Wrapper)",
    example: 'className="min-h-screen p-8"',
    fix: "Entferne min-h-screen und Padding. Das Layout stellt bereits Padding bereit.",
  },
  {
    pattern: /<main\b/,
    description: "Verschachtelte <main> Tags",
    example: "<main>...</main>",
    fix: "Entferne <main> Tag. Das Layout stellt bereits <main> bereit.",
  },
  {
    pattern: /className=["'][^"']*\bcontainer\b/,
    description: "container Klasse (Tailwind Container)",
    example: 'className="container mx-auto"',
    fix: "Entferne container. Nutze das Layout-System.",
  },
]

// Erlaubte Patterns (in Layout-Komponenten oder speziellen Fällen)
const ALLOWED_CONTEXTS = [
  /src\/layouts\/archetypes\//, // Layout-Komponenten selbst
  /src\/components\//, // Komponenten (nicht Seiten)
  /\.test\./, // Test-Dateien
  /\.spec\./, // Spec-Dateien
]

function getAllPageFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    return fileList
  }

  const files = fs.readdirSync(dir)

  files.forEach((file) => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      // Überspringe node_modules und .next
      if (!file.startsWith(".") && file !== "node_modules") {
        getAllPageFiles(filePath, fileList)
      }
    } else if (file === "page.tsx" || file === "page.ts") {
      fileList.push(filePath)
    }
  })

  return fileList
}

function isAllowedContext(filePath) {
  const relativePath = path.relative(projectRoot, filePath).replace(/\\/g, "/")
  return ALLOWED_CONTEXTS.some((pattern) => pattern.test(relativePath))
}

function checkPageFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8")
  const errors = []

  FORBIDDEN_PATTERNS.forEach((rule) => {
    const matches = content.match(rule.pattern)
    if (matches) {
      // Prüfe, ob es in einem Kommentar ist (erlaubt)
      const lines = content.split("\n")
      matches.forEach((match) => {
        const matchIndex = content.indexOf(match)
        const lineNumber = content.substring(0, matchIndex).split("\n").length
        const line = lines[lineNumber - 1]

        // Überspringe Kommentare
        if (!line.trim().startsWith("//") && !line.includes("/*")) {
          errors.push({
            file: filePath,
            line: lineNumber,
            match: match,
            rule: rule,
            lineContent: line.trim(),
          })
        }
      })
    }
  })

  return errors
}

function main() {
  console.log("🔍 Validiere Layout-Konsistenz...\n")

  const pagesDir = path.join(projectRoot, "src/app")
  const pageFiles = getAllPageFiles(pagesDir)

  const allErrors = []

  pageFiles.forEach((filePath) => {
    // Überspringe erlaubte Kontexte (Layout-Komponenten selbst)
    if (isAllowedContext(filePath)) {
      return
    }

    const errors = checkPageFile(filePath)
    if (errors.length > 0) {
      allErrors.push(...errors)
    }
  })

  if (allErrors.length > 0) {
    console.error("❌ Layout-Konsistenz-Fehler gefunden:\n")

    // Gruppiere nach Datei
    const errorsByFile = {}
    allErrors.forEach((error) => {
      const relativePath = path.relative(projectRoot, error.file).replace(/\\/g, "/")
      if (!errorsByFile[relativePath]) {
        errorsByFile[relativePath] = []
      }
      errorsByFile[relativePath].push(error)
    })

    Object.entries(errorsByFile).forEach(([file, errors]) => {
      console.error(`📄 ${file}:`)
      errors.forEach((error) => {
        console.error(`  Zeile ${error.line}: ${error.rule.description}`)
        console.error(`  ❌ Gefunden: ${error.match.substring(0, 60)}...`)
        console.error(`  💡 Lösung: ${error.rule.fix}`)
        console.error(`  📝 Zeile: ${error.lineContent.substring(0, 80)}...`)
        console.error("")
      })
    })

    console.error(
      "💡 Tipp: Seiten sollten Fragment (`<>...</>`) oder direkten Content rendern.\n" +
        "   Das Layout-System stellt bereits Container, Padding und Zentrierung bereit.\n" +
        "   Siehe: .cursor/rules/layout.mdc\n"
    )
    process.exit(1)
  }

  console.log("✅ Layout-Konsistenz ist korrekt!\n")
  console.log(`   ${pageFiles.length} Seiten geprüft.\n`)
  process.exit(0)
}

main()
