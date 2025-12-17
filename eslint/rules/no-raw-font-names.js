/**
 * ESLint-Regel: no-raw-font-names
 * ================================
 *
 * Erkennt rohe Font-Namen in CSS-Dateien und fordert die Verwendung
 * von var(--font-*) Syntax.
 *
 * Beispiel:
 *   ❌ --font-sans: Outfit, sans-serif;
 *   ✅ --font-sans: var(--font-outfit);
 *
 * Diese Regel stellt sicher, dass alle Theme-spezifischen Fonts
 * über die zentrale Font-Registry verwaltet werden.
 */

/**
 * @type {import('eslint').Rule.RuleModule}
 */
const noRawFontNames = {
  meta: {
    type: "problem",
    docs: {
      description: "Verbietet rohe Font-Namen in CSS-Variablen",
      category: "Theme Consistency",
      recommended: true,
    },
    messages: {
      rawFontName:
        'Roher Font-Name gefunden: "{{ value }}". Verwende stattdessen var(--font-*) Syntax.',
      suggestion:
        'Ersetze "{{ value }}" mit "var(--font-{{ fontVar }})" oder registriere den Font in src/lib/fonts/registry.ts.',
    },
    schema: [], // keine Optionen
  },

  create(context) {
    // Diese Regel ist speziell für CSS-Dateien gedacht
    const filename = context.getFilename ? context.getFilename() : context.filename || ""
    if (!filename.endsWith(".css")) {
      return {}
    }

    return {
      // ESLint CSS Parsing wird normalerweise nicht unterstützt,
      // aber für Projekte mit CSS-in-JS oder PostCSS kann dies angepasst werden
      Program(node) {
        const sourceCode = context.getSourceCode ? context.getSourceCode() : context.sourceCode
        if (!sourceCode) return

        const text = sourceCode.getText()
        const lines = text.split("\n")

        lines.forEach((line, index) => {
          // Überspringe Kommentare
          const trimmedLine = line.trim()
          if (
            trimmedLine.startsWith("*") ||
            trimmedLine.startsWith("/*") ||
            trimmedLine.startsWith("//")
          ) {
            return
          }

          // Suche nach --font-sans, --font-mono, --font-serif Deklarationen
          const fontMatch = line.match(/--(font-(?:sans|mono|serif)):\s*([^;]+);/)

          if (fontMatch) {
            const [, , value] = fontMatch
            const trimmedValue = value.trim()

            // Prüfe, ob es NICHT die var() Syntax verwendet
            if (!trimmedValue.startsWith("var(")) {
              // Extrahiere den primären Font-Namen für die Fehlermeldung
              const primaryFont = trimmedValue.split(",")[0].trim().replace(/["']/g, "")

              // Generiere einen vorgeschlagenen Variablennamen
              const suggestedVar = primaryFont.toLowerCase().replace(/\s+/g, "-")

              context.report({
                node,
                loc: {
                  start: { line: index + 1, column: line.indexOf("--font-") },
                  end: { line: index + 1, column: line.indexOf(";") + 1 },
                },
                messageId: "rawFontName",
                data: {
                  value: trimmedValue,
                  fontVar: suggestedVar,
                },
              })
            }
          }
        })
      },
    }
  },
}

module.exports = noRawFontNames
