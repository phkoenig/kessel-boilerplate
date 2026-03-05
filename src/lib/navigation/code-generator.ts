/**
 * Navigation Code Generator
 *
 * Generiert TypeScript-Code für neue Navigation-Einträge und Seiten.
 * Wird vom Navigation-Trigger-System verwendet, wenn Tools mit
 * `affectsNavigation: true` ausgeführt werden.
 *
 * @module lib/navigation/code-generator
 */

import type { NavigationSuggestion } from "@/lib/ai/types/tool-metadata"
import { labelToSlug } from "./utils"

/**
 * Ergebnis der Code-Generierung
 */
export interface GeneratedNavigationCode {
  /** TypeScript-Code für das NavItem */
  navItemCode: string

  /** TypeScript-Code für page.tsx */
  pageCode: string

  /** Pfad wo die page.tsx erstellt werden soll */
  pagePath: string

  /** Die generierte href für das NavItem */
  generatedHref: string
}

/**
 * Optionen für die Code-Generierung
 */
export interface CodeGeneratorOptions {
  /** Ob die generierte Seite "use client" haben soll */
  useClient?: boolean

  /** Standard-Beschreibung für die Seite */
  defaultDescription?: string

  /** Basis-Pfad für App-Routen (default: "src/app/(shell)") */
  appRoutesBasePath?: string
}

const DEFAULT_OPTIONS: Required<CodeGeneratorOptions> = {
  useClient: true,
  defaultDescription: "Beschreibung wird hier eingefügt.",
  appRoutesBasePath: "src/app/(shell)",
}

/**
 * Generiert TypeScript-Code für ein neues NavItem
 *
 * @param suggestion - NavigationSuggestion mit den Item-Details
 * @returns TypeScript-Code-String
 *
 * @example
 * ```typescript
 * const code = generateNavItemCode({
 *   parentPath: "/galaxy/kataloge",
 *   suggestedLabel: "DIN 276",
 *   suggestedId: "galaxy-kataloge-din-276",
 *   icon: "BookMarked"
 * })
 * // Gibt zurück:
 * // {
 * //   id: "galaxy-kataloge-din-276",
 * //   label: "DIN 276",
 * //   icon: BookMarked,
 * //   href: "/galaxy/kataloge/din-276",
 * // },
 * ```
 */
export function generateNavItemCode(suggestion: NavigationSuggestion): string {
  const slug = labelToSlug(suggestion.suggestedLabel)
  const href = `${suggestion.parentPath}/${slug}`
  const icon = suggestion.icon || "FileText"

  const lines = [
    "        {",
    `          id: "${suggestion.suggestedId}",`,
    `          label: "${suggestion.suggestedLabel}",`,
    `          icon: ${icon},`,
    `          href: "${href}",`,
    "        },",
  ]

  return lines.join("\n")
}

/**
 * Generiert TypeScript-Code für eine neue page.tsx
 *
 * @param suggestion - NavigationSuggestion mit den Item-Details
 * @param options - Optionen für die Generierung
 * @returns TypeScript-Code-String für page.tsx
 *
 * @example
 * ```typescript
 * const code = generatePageTemplate({
 *   parentPath: "/galaxy/kataloge",
 *   suggestedLabel: "DIN 276",
 *   suggestedId: "galaxy-kataloge-din-276",
 *   description: "Kostengliederung nach DIN 276"
 * })
 * ```
 */
export function generatePageTemplate(
  suggestion: NavigationSuggestion,
  options: CodeGeneratorOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const description = suggestion.description || opts.defaultDescription

  // Generiere einen PascalCase-Komponenten-Namen aus dem Label
  const componentName =
    suggestion.suggestedLabel
      .replace(/[^a-zA-Z0-9äöüÄÖÜß\s]/g, "")
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join("")
      .replace(/ä/gi, "ae")
      .replace(/ö/gi, "oe")
      .replace(/ü/gi, "ue")
      .replace(/ß/g, "ss") + "Page"

  const useClientDirective = opts.useClient ? '"use client"\n\n' : ""

  return `${useClientDirective}import { PageHeader } from "@/components/shell/PageHeader"

/**
 * ${suggestion.suggestedLabel} Seite
 *
 * Auto-generiert vom Navigation-Trigger-System.
 * TODO: Inhalt anpassen
 */
export default function ${componentName}(): React.ReactElement {
  return (
    <div className="space-y-6">
      <PageHeader
        title="${suggestion.suggestedLabel}"
        description="${description}"
      />

      <div className="rounded-lg border p-6">
        <p className="text-muted-foreground">
          Diese Seite wurde automatisch erstellt. Bitte Inhalt hinzufügen.
        </p>
      </div>
    </div>
  )
}
`
}

/**
 * Berechnet den Dateipfad für eine neue page.tsx
 *
 * @param suggestion - NavigationSuggestion mit parentPath
 * @param options - Optionen mit appRoutesBasePath
 * @returns Relativer Dateipfad
 *
 * @example
 * ```typescript
 * getPageFilePath({ parentPath: "/galaxy/kataloge", suggestedLabel: "DIN 276", ... })
 * // "src/app/(shell)/galaxy/kataloge/din-276/page.tsx"
 * ```
 */
export function getPageFilePath(
  suggestion: NavigationSuggestion,
  options: CodeGeneratorOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const slug = labelToSlug(suggestion.suggestedLabel)

  // Entferne führenden Slash vom parentPath
  const parentPathWithoutSlash = suggestion.parentPath.replace(/^\//, "")

  return `${opts.appRoutesBasePath}/${parentPathWithoutSlash}/${slug}/page.tsx`
}

/**
 * Berechnet die href für ein neues NavItem
 *
 * @param suggestion - NavigationSuggestion
 * @returns Die generierte href
 */
export function getGeneratedHref(suggestion: NavigationSuggestion): string {
  const slug = labelToSlug(suggestion.suggestedLabel)
  return `${suggestion.parentPath}/${slug}`
}

/**
 * Generiert alle notwendigen Code-Artefakte für einen neuen Navigation-Eintrag
 *
 * @param suggestion - NavigationSuggestion
 * @param options - Optionen für die Generierung
 * @returns Alle generierten Code-Teile
 */
export function generateNavigationCode(
  suggestion: NavigationSuggestion,
  options: CodeGeneratorOptions = {}
): GeneratedNavigationCode {
  return {
    navItemCode: generateNavItemCode(suggestion),
    pageCode: generatePageTemplate(suggestion, options),
    pagePath: getPageFilePath(suggestion, options),
    generatedHref: getGeneratedHref(suggestion),
  }
}

/**
 * Findet die Insert-Position in navigation.ts für ein neues Child-Item
 *
 * @param navigationContent - Inhalt der navigation.ts Datei
 * @param parentPath - Pfad des Parent-Items (z.B. "/galaxy/kataloge")
 * @returns Line-Number und Indent-Level, oder null wenn nicht gefunden
 *
 * @example
 * ```typescript
 * const position = findInsertPosition(navContent, "/galaxy/kataloge")
 * // { lineNumber: 165, indentLevel: 8 }
 * ```
 */
export function findInsertPosition(
  navigationContent: string,
  parentPath: string
): { lineNumber: number; indentLevel: number } | null {
  const lines = navigationContent.split("\n")

  // Suche nach dem Parent-Item (href: "/galaxy/kataloge")
  const hrefPattern = new RegExp(`href:\\s*["']${escapeRegex(parentPath)}["']`)

  let parentLineIndex = -1
  for (let i = 0; i < lines.length; i++) {
    if (hrefPattern.test(lines[i])) {
      parentLineIndex = i
      break
    }
  }

  if (parentLineIndex === -1) {
    return null
  }

  // Suche nach dem children-Array des Parents
  // Gehe von der Parent-Zeile aus vorwärts bis wir "children:" finden
  let childrenLineIndex = -1
  let bracketCount = 0
  let foundParentObject = false

  for (let i = parentLineIndex; i < lines.length; i++) {
    const line = lines[i]

    // Zähle öffnende und schließende Klammern
    for (const char of line) {
      if (char === "{") {
        bracketCount++
        foundParentObject = true
      }
      if (char === "}") {
        bracketCount--
        if (foundParentObject && bracketCount === 0) {
          // Ende des Parent-Objekts erreicht ohne children zu finden
          return null
        }
      }
    }

    if (line.includes("children:")) {
      childrenLineIndex = i
      break
    }
  }

  if (childrenLineIndex === -1) {
    return null
  }

  // Finde das Ende des children-Arrays (schließende eckige Klammer)
  let arrayBracketCount = 0
  let arrayStarted = false

  for (let i = childrenLineIndex; i < lines.length; i++) {
    const line = lines[i]

    for (let j = 0; j < line.length; j++) {
      if (line[j] === "[") {
        arrayBracketCount++
        arrayStarted = true
      }
      if (line[j] === "]") {
        arrayBracketCount--
        if (arrayStarted && arrayBracketCount === 0) {
          // Gefunden! Insert-Position ist vor dieser Zeile
          // Bestimme das Indent-Level basierend auf der vorherigen Zeile
          const indentMatch = lines[i - 1]?.match(/^(\s*)/)
          const indentLevel = indentMatch ? indentMatch[1].length : 8

          return {
            lineNumber: i, // 0-basiert
            indentLevel,
          }
        }
      }
    }
  }

  return null
}

/**
 * Fügt ein neues NavItem in den navigation.ts Inhalt ein
 *
 * @param navigationContent - Aktueller Inhalt der navigation.ts
 * @param suggestion - NavigationSuggestion für das neue Item
 * @returns Neuer Inhalt der navigation.ts, oder null bei Fehler
 */
export function insertNavItem(
  navigationContent: string,
  suggestion: NavigationSuggestion
): string | null {
  const position = findInsertPosition(navigationContent, suggestion.parentPath)

  if (!position) {
    return null
  }

  const lines = navigationContent.split("\n")
  const navItemCode = generateNavItemCode(suggestion)

  // Füge das neue Item vor der schließenden Klammer ein
  lines.splice(position.lineNumber, 0, navItemCode)

  return lines.join("\n")
}

/**
 * Prüft ob ein Icon-Import in navigation.ts existiert
 *
 * @param navigationContent - Inhalt der navigation.ts
 * @param iconName - Name des Icons (z.B. "BookMarked")
 * @returns true wenn das Icon bereits importiert ist
 */
export function hasIconImport(navigationContent: string, iconName: string): boolean {
  // Suche nach dem Import-Statement von lucide-react
  const importMatch = navigationContent.match(/import\s*\{([^}]+)\}\s*from\s*["']lucide-react["']/)

  if (!importMatch) {
    return false
  }

  const imports = importMatch[1]
  // Prüfe auf exakten Match (nicht "Folder" in "FolderOpen" finden)
  // Extrahiere einzelne Import-Namen und vergleiche exakt
  const importList = imports
    .split(",")
    .map((s: string) => s.trim())
    .filter((s: string) => s.length > 0)

  return importList.includes(iconName)
}

/**
 * Fügt einen Icon-Import zu navigation.ts hinzu
 *
 * @param navigationContent - Aktueller Inhalt
 * @param iconName - Name des Icons
 * @returns Neuer Inhalt mit Icon-Import
 */
export function addIconImport(navigationContent: string, iconName: string): string {
  if (hasIconImport(navigationContent, iconName)) {
    return navigationContent
  }

  // Finde den lucide-react Import
  const importRegex = /import\s*\{([^}]+)\}\s*from\s*["']lucide-react["']/

  return navigationContent.replace(importRegex, (match, imports) => {
    // Füge das neue Icon alphabetisch ein
    const importList = imports
      .split(",")
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0)

    importList.push(iconName)
    importList.sort()

    const newImports = importList.join(",\n  ")
    return `import {\n  ${newImports},\n} from "lucide-react"`
  })
}

/**
 * Hilfsfunktion: Escaped Regex-Sonderzeichen
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Validiert eine NavigationSuggestion
 *
 * @param suggestion - Zu validierende Suggestion
 * @returns Validierungsergebnis mit Fehlern
 */
export function validateNavigationSuggestion(suggestion: NavigationSuggestion): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!suggestion.parentPath) {
    errors.push("parentPath ist erforderlich")
  } else if (!suggestion.parentPath.startsWith("/")) {
    errors.push("parentPath muss mit / beginnen")
  }

  if (!suggestion.suggestedLabel) {
    errors.push("suggestedLabel ist erforderlich")
  } else if (suggestion.suggestedLabel.length < 2) {
    errors.push("suggestedLabel muss mindestens 2 Zeichen haben")
  }

  if (!suggestion.suggestedId) {
    errors.push("suggestedId ist erforderlich")
  } else if (!/^[a-z0-9-]+$/.test(suggestion.suggestedId)) {
    errors.push("suggestedId darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten")
  }

  if (suggestion.icon && !/^[A-Z][a-zA-Z0-9]*$/.test(suggestion.icon)) {
    errors.push("icon muss ein gültiger Lucide-Icon-Name sein (PascalCase)")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
