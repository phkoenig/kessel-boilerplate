/**
 * ESLint Rule: no-next-font-classname
 *
 * Verhindert die Verwendung von *.className aus next/font im gesamten Projekt.
 * Fonts werden ausschließlich über CSS-Variablen gesteuert (CSS-First Font System).
 *
 * ERLAUBT:
 * - <html className={fontSans.variable}>
 * - Verwendung von .variable überall
 *
 * VERBOTEN:
 * - fontSans.className (überall im Projekt)
 * - <div className={fontSans.className}>
 * - cn(fontSans.className, ...)
 */

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow using next/font .className anywhere. Use .variable and CSS tokens instead.",
      category: "Best Practices",
      recommended: true,
    },
    messages: {
      noClassName:
        "Do not use next/font .className. Use .variable on <html> and control font-family via CSS tokens (--font-sans, etc.).",
    },
    schema: [],
  },

  create(context) {
    // Sammle alle Import-Bindings aus 'next/font/*'
    const fontImports = new Set()

    return {
      // Sammle Imports aus next/font/*
      ImportDeclaration(node) {
        if (node.source.value && node.source.value.startsWith("next/font/")) {
          node.specifiers.forEach((specifier) => {
            if (specifier.local && specifier.local.name) {
              fontImports.add(specifier.local.name)
            }
          })
        }
      },

      // Prüfe ALLE MemberExpressions im Code (nicht nur in JSX)
      MemberExpression(node) {
        // Prüfe ob es *.className ist
        if (
          node.property &&
          node.property.type === "Identifier" &&
          node.property.name === "className"
        ) {
          // Prüfe ob das Objekt ein Font-Import ist
          if (
            node.object &&
            node.object.type === "Identifier" &&
            fontImports.has(node.object.name)
          ) {
            context.report({
              node: node,
              messageId: "noClassName",
            })
          }
        }
      },
    }
  },
}

module.exports = rule
