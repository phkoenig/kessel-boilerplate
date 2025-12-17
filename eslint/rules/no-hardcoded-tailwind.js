/**
 * ESLint Rule: no-hardcoded-tailwind
 *
 * Verbietet hardcodierte Tailwind-Werte zugunsten semantischer Design-Tokens.
 *
 * VERBOTEN:
 * - Standard-Tailwind-Farben: bg-blue-500, text-red-600, border-gray-200
 * - Arbitrary Colors: bg-[#ff0000], text-[rgb(255,0,0)]
 * - Arbitrary Spacing: p-[17px], m-[2.3rem], gap-[13px]
 * - Arbitrary Sizing: w-[350px], h-[123px]
 * - Arbitrary Radii: rounded-[8px], rounded-[0.5rem]
 * - Nicht-erlaubte Radii: rounded-2xl, rounded-3xl (nur sm/md/lg/xl/full erlaubt)
 * - Arbitrary Font-Sizes: text-[13px], text-[1.125rem]
 *
 * ERLAUBT:
 * - Semantische Tokens: bg-primary, text-destructive, border-border
 * - Standard Tailwind Scale: p-4, m-6, gap-8, w-full
 * - Erlaubte Radii: rounded-none, rounded-sm, rounded-md, rounded-lg, rounded-xl, rounded-full
 * - CSS-Variable Referenzen: w-[var(--sidebar-width)]
 * - Calc mit Variablen: w-[calc(100%-var(--spacing))]
 */

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description: "Verbietet hardcodierte Tailwind-Werte. Nutze semantische Design-Tokens.",
      category: "Design System",
      recommended: true,
    },
    messages: {
      hardcodedColor:
        'Hardcodierte Farbe "{{value}}" verboten. Nutze semantische Tokens wie bg-primary, text-destructive, etc.',
      arbitraryColor:
        'Arbitrary Color "{{value}}" verboten. Definiere die Farbe als CSS-Variable in globals.css.',
      arbitrarySpacing:
        'Arbitrary Spacing "{{value}}" verboten. Nutze die Tailwind-Skala (p-4, m-6, gap-8) oder definiere eine CSS-Variable.',
      arbitrarySizing:
        'Arbitrary Sizing "{{value}}" verboten. Nutze Tailwind-Utilities (w-full, max-w-md) oder CSS-Variablen.',
      arbitraryRadius:
        'Arbitrary Radius "{{value}}" verboten. Nutze rounded-sm, rounded-md, rounded-lg, rounded-xl oder rounded-full.',
      forbiddenRadius:
        'Radius "{{value}}" nicht erlaubt. Nur rounded-none, rounded-sm, rounded-md, rounded-lg, rounded-xl, rounded-full sind erlaubt.',
      arbitraryFontSize:
        'Arbitrary Font-Size "{{value}}" verboten. Nutze die Tailwind-Skala (text-sm, text-base, text-lg).',
      forbiddenSpacing:
        'Spacing-Wert "{{value}}" nicht in der erlaubten Skala. Erlaubt: 0, 1, 2, 4, 6, 8, 12, 16, 24, 32, 48, 64.',
    },
    schema: [
      {
        type: "object",
        properties: {
          allowCssVariables: {
            type: "boolean",
            default: true,
          },
          enforceSpacingScale: {
            type: "boolean",
            default: false, // Deaktiviert standardmäßig, da sehr strikt
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options = context.options[0] || {}
    const allowCssVariables = options.allowCssVariables !== false
    const enforceSpacingScale = options.enforceSpacingScale === true

    // Standard Tailwind Farben (die wir verbieten)
    const TAILWIND_COLORS = [
      "slate",
      "gray",
      "zinc",
      "neutral",
      "stone",
      "red",
      "orange",
      "amber",
      "yellow",
      "lime",
      "green",
      "emerald",
      "teal",
      "cyan",
      "sky",
      "blue",
      "indigo",
      "violet",
      "purple",
      "fuchsia",
      "pink",
      "rose",
    ]

    // Erlaubte Spacing-Werte (gemäß Design-Token-Governance)
    const ALLOWED_SPACING = [0, 1, 2, 4, 6, 8, 12, 16, 24, 32, 48, 64]

    // Regex für verschiedene Patterns
    const patterns = {
      // bg-blue-500, text-red-600, border-gray-200, etc.
      hardcodedColor: new RegExp(
        `(bg|text|border|ring|outline|fill|stroke|from|to|via)-(${TAILWIND_COLORS.join("|")})-(\\d{2,3})(/\\d+)?`,
        "g"
      ),

      // bg-[#ff0000], text-[rgb(...)], border-[hsl(...)]
      arbitraryColor:
        /(bg|text|border|ring|outline|fill|stroke)-\[(#[0-9a-fA-F]{3,8}|rgb[a]?\([^)]+\)|hsl[a]?\([^)]+\)|oklch\([^)]+\))\]/g,

      // p-[17px], m-[2.3rem], gap-[13px], space-x-[5px]
      arbitrarySpacing:
        /(p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|space-x|space-y)-\[[\d.]+(?:px|rem|em|%)\]/g,

      // w-[350px], h-[123px], min-w-[100px], max-h-[500px]
      arbitrarySizing: /(w|h|min-w|max-w|min-h|max-h|size)-\[[\d.]+(?:px|rem|em|vh|vw|%)\]/g,

      // rounded-[8px], rounded-[0.5rem]
      arbitraryRadius: /rounded(-[trbl]{1,2})?-\[[\d.]+(?:px|rem|em)\]/g,

      // rounded-2xl, rounded-3xl, rounded-t-2xl, etc. (nicht in unserem Design-System)
      // Erlaubt sind nur: none, sm, md, lg, xl, full
      forbiddenRadius: /\brounded(-[trblse]{1,2})?-(2xl|3xl)\b/g,

      // text-[13px], text-[1.125rem]
      arbitraryFontSize: /text-\[[\d.]+(?:px|rem|em)\]/g,

      // Erlaubte Patterns (CSS-Variablen)
      cssVariable: /\[var\(--[a-z-]+\)\]/,
      calcWithVariable: /\[calc\([^)]*var\(--[a-z-]+\)[^)]*\)\]/,
    }

    /**
     * Prüft, ob ein Wert eine erlaubte CSS-Variable-Referenz enthält.
     */
    function isAllowedCssVariable(value) {
      if (!allowCssVariables) return false
      return patterns.cssVariable.test(value) || patterns.calcWithVariable.test(value)
    }

    /**
     * Extrahiert className-Werte aus einem JSX-Attribut.
     */
    function extractClassNames(node) {
      if (!node) return []

      // String Literal: className="..."
      if (node.type === "Literal" && typeof node.value === "string") {
        return [{ value: node.value, node }]
      }

      // Template Literal: className={`...`}
      if (node.type === "TemplateLiteral") {
        return node.quasis.map((quasi) => ({
          value: quasi.value.raw,
          node: quasi,
        }))
      }

      // JSX Expression: className={...}
      if (node.type === "JSXExpressionContainer") {
        return extractClassNames(node.expression)
      }

      // cn() oder clsx() Aufruf
      if (node.type === "CallExpression") {
        const results = []
        for (const arg of node.arguments) {
          results.push(...extractClassNames(arg))
        }
        return results
      }

      // Conditional Expression: condition ? "class1" : "class2"
      if (node.type === "ConditionalExpression") {
        return [...extractClassNames(node.consequent), ...extractClassNames(node.alternate)]
      }

      // Logical Expression: condition && "class"
      if (node.type === "LogicalExpression") {
        return [...extractClassNames(node.left), ...extractClassNames(node.right)]
      }

      // Array Expression: ["class1", "class2"]
      if (node.type === "ArrayExpression") {
        const results = []
        for (const element of node.elements) {
          if (element) {
            results.push(...extractClassNames(element))
          }
        }
        return results
      }

      return []
    }

    /**
     * Prüft className-Werte auf Violations.
     */
    function checkClassNames(classNameNode) {
      const classNames = extractClassNames(classNameNode)

      for (const { value, node } of classNames) {
        if (!value || typeof value !== "string") continue

        // Prüfe hardcodierte Farben
        const colorMatches = value.match(patterns.hardcodedColor)
        if (colorMatches) {
          for (const match of colorMatches) {
            context.report({
              node,
              messageId: "hardcodedColor",
              data: { value: match },
            })
          }
        }

        // Prüfe Arbitrary Colors (aber erlaube CSS-Variablen)
        const arbColorMatches = value.match(patterns.arbitraryColor)
        if (arbColorMatches) {
          for (const match of arbColorMatches) {
            if (!isAllowedCssVariable(match)) {
              context.report({
                node,
                messageId: "arbitraryColor",
                data: { value: match },
              })
            }
          }
        }

        // Prüfe Arbitrary Spacing
        const spacingMatches = value.match(patterns.arbitrarySpacing)
        if (spacingMatches) {
          for (const match of spacingMatches) {
            if (!isAllowedCssVariable(match)) {
              context.report({
                node,
                messageId: "arbitrarySpacing",
                data: { value: match },
              })
            }
          }
        }

        // Prüfe Arbitrary Sizing
        const sizingMatches = value.match(patterns.arbitrarySizing)
        if (sizingMatches) {
          for (const match of sizingMatches) {
            if (!isAllowedCssVariable(match)) {
              context.report({
                node,
                messageId: "arbitrarySizing",
                data: { value: match },
              })
            }
          }
        }

        // Prüfe Arbitrary Radius (z.B. rounded-[14px])
        const radiusMatches = value.match(patterns.arbitraryRadius)
        if (radiusMatches) {
          for (const match of radiusMatches) {
            if (!isAllowedCssVariable(match)) {
              context.report({
                node,
                messageId: "arbitraryRadius",
                data: { value: match },
              })
            }
          }
        }

        // Prüfe verbotene Standard-Radius-Klassen (z.B. rounded-2xl, rounded-3xl)
        const forbiddenRadiusMatches = value.match(patterns.forbiddenRadius)
        if (forbiddenRadiusMatches) {
          for (const match of forbiddenRadiusMatches) {
            context.report({
              node,
              messageId: "forbiddenRadius",
              data: { value: match },
            })
          }
        }

        // Prüfe Arbitrary Font-Size
        const fontSizeMatches = value.match(patterns.arbitraryFontSize)
        if (fontSizeMatches) {
          for (const match of fontSizeMatches) {
            if (!isAllowedCssVariable(match)) {
              context.report({
                node,
                messageId: "arbitraryFontSize",
                data: { value: match },
              })
            }
          }
        }

        // Optional: Prüfe Spacing-Skala (p-3, m-5, gap-7 sind verboten)
        if (enforceSpacingScale) {
          const spacingRegex =
            /\b(p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|space-x|space-y)-(\d+)\b/g
          let match
          while ((match = spacingRegex.exec(value)) !== null) {
            const spacingValue = parseInt(match[2], 10)
            if (!ALLOWED_SPACING.includes(spacingValue)) {
              context.report({
                node,
                messageId: "forbiddenSpacing",
                data: { value: match[0] },
              })
            }
          }
        }
      }
    }

    return {
      // JSX className Attribut
      JSXAttribute(node) {
        if (node.name.name === "className" && node.value) {
          checkClassNames(node.value)
        }
      },
    }
  },
}
