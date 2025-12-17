#!/usr/bin/env node
// scripts/validate-docs-structure.mjs
// Validiert, dass Dokumentationsdateien im richtigen Ordner liegen

import fs from "fs"
import path from "path"

const DOCS_RULES = {
  // Dokumentationen, die NICHT in .cursor/ liegen sollten (außer mcp.json)
  forbiddenInCursor: [
    /\.md$/i, // Alle Markdown-Dateien außer READMEs
  ],
  // Erlaubte Dateien in .cursor/
  allowedInCursor: [
    /^mcp\.json$/,
    /^rules\/.*\.mdc$/,
    /^plans\/.*\.plan\.md$/, // Plan-Dateien sind temporär und erlaubt
    /^plans\/.*\.md$/, // Alle Plan-Dateien sind erlaubt
  ],
  // Dokumentationsdateien müssen in docs/ liegen
  mustBeInDocs: [
    {
      pattern: /setup|anleitung|how-to|guide/i,
      requiredPath: "docs/04_knowledge/",
      description: "Setup-Anleitungen und How-Tos gehören nach docs/04_knowledge/",
    },
    {
      pattern: /secrets|security|sicherheit/i,
      requiredPath: "docs/04_knowledge/",
      description: "Security-Dokumentation gehört nach docs/04_knowledge/",
    },
  ],
}

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir)

  files.forEach((file) => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList)
    } else {
      fileList.push(filePath)
    }
  })

  return fileList
}

function checkCursorDirectory() {
  const cursorDir = ".cursor"
  if (!fs.existsSync(cursorDir)) {
    return { errors: [], warnings: [] }
  }

  const errors = []
  const warnings = []

  const files = getAllFiles(cursorDir)

  // Filtere Plan-Dateien raus (sind temporär und erlaubt)
  const filesToCheck = files.filter((file) => {
    const relativePath = path.relative(cursorDir, file).replace(/\\/g, "/")
    return !relativePath.includes("plans/")
  })

  filesToCheck.forEach((file) => {
    const fileName = path.basename(file)
    const relativePath = path.relative(cursorDir, file).replace(/\\/g, "/")

    // Prüfe auf verbotene Markdown-Dateien (außer erlaubte)
    if (DOCS_RULES.forbiddenInCursor.some((pattern) => pattern.test(fileName))) {
      const isAllowed = DOCS_RULES.allowedInCursor.some((pattern) => pattern.test(relativePath))

      if (!isAllowed) {
        // Prüfe, ob es eine Dokumentationsdatei ist, die nach docs/ gehört
        const shouldBeInDocs = DOCS_RULES.mustBeInDocs.find((rule) => rule.pattern.test(fileName))

        if (shouldBeInDocs) {
          errors.push({
            file: file,
            message: `❌ Dokumentation "${fileName}" liegt in .cursor/, sollte aber in ${shouldBeInDocs.requiredPath} liegen.`,
            suggestion: `Verschiebe nach: ${shouldBeInDocs.requiredPath}${fileName}`,
          })
        } else {
          warnings.push({
            file: file,
            message: `⚠️  Markdown-Datei "${fileName}" in .cursor/ gefunden. Dokumentationen sollten in docs/ liegen.`,
          })
        }
      }
    }
  })

  return { errors, warnings }
}

function main() {
  console.log("🔍 Validiere Dokumentationsstruktur...\n")

  const { errors, warnings } = checkCursorDirectory()

  if (warnings.length > 0) {
    console.log("⚠️  Warnungen:\n")
    warnings.forEach((w) => {
      console.log(`  ${w.message}`)
    })
    console.log("")
  }

  if (errors.length > 0) {
    console.error("❌ Fehler gefunden:\n")
    errors.forEach((e) => {
      console.error(`  ${e.message}`)
      console.error(`  💡 ${e.suggestion}\n`)
    })
    console.error("💡 Tipp: Dokumentationsdateien gehören in docs/, nicht in .cursor/\n")
    process.exit(1)
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log("✅ Dokumentationsstruktur ist korrekt!\n")
  }

  process.exit(0)
}

main()
