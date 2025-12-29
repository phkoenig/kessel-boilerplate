/**
 * ESLint-Regel: Navigation Route Consistency
 *
 * Prüft, dass Routen, Breadcrumbs und URLs konsistent mit der Navigation-Konfiguration sind.
 *
 * Regeln:
 * 1. Hardcodierte Routen in href/target müssen in navigation.ts existieren
 * 2. Breadcrumbs müssen Navigation-Lookup verwenden (nicht hardcodierte Mappings)
 * 3. PageHeader-Titel müssen aus useCurrentNavItem() kommen
 */

const { readFileSync } = require("fs")
const { join } = require("path")

// Lade Navigation-Konfiguration zur Laufzeit
function getNavigationConfig() {
  try {
    const navPath = join(process.cwd(), "src/config/navigation.ts")
    const navContent = readFileSync(navPath, "utf-8")

    // Extrahiere alle href-Werte aus der Navigation
    const hrefMatches = navContent.matchAll(/href:\s*["'`]([^"'`]+)["'`]/g)
    const routes = new Set()

    for (const match of hrefMatches) {
      routes.add(match[1])
    }

    // Extrahiere auch buildNavHref Aufrufe
    const buildNavHrefMatches = navContent.matchAll(/buildNavHref\([^)]+\)/g)
    // Diese werden zur Laufzeit generiert, daher können wir sie nicht statisch prüfen

    return { routes: Array.from(routes) }
  } catch (error) {
    // Fallback wenn Navigation nicht geladen werden kann
    return { routes: [] }
  }
}

// Bekannte Routen-Patterns, die erlaubt sind
const ALLOWED_PATTERNS = [
  /^\/$/, // Root
  /^\/module-\d+\/sub-\d+$/, // Module-Routen (dynamisch)
  /^\/api\//, // API-Routen
  /^\/_next\//, // Next.js interne Routen
  /^\/login/, // Auth-Routen
  /^\/signup/, // Auth-Routen
]

// Hardcodierte Routen, die wir finden wollen
const ROUTE_PATTERNS = [
  /href\s*[:=]\s*["'`]([^"'`]+)["'`]/g, // href="/path"
  /target\s*[:=]\s*["'`]([^"'`]+)["'`]/g, // target="/path"
  /to\s*[:=]\s*["'`]([^"'`]+)["'`]/g, // to="/path" (React Router)
  /pathname\s*[:=]\s*["'`]([^"'`]+)["'`]/g, // pathname="/path"
  /path\s*[:=]\s*["'`]([^"'`]+)["'`]/g, // path="/path"
  /router\.push\(["'`]([^"'`]+)["'`]\)/g, // router.push("/path")
  /router\.replace\(["'`]([^"'`]+)["'`]\)/g, // router.replace("/path")
]

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Prüft Konsistenz zwischen Routen und Navigation-Konfiguration",
      category: "Best Practices",
      recommended: true,
    },
    messages: {
      hardcodedRoute:
        "Hardcodierte Route '{{route}}' gefunden. Verwende Navigation-Konfiguration oder buildNavHref() für dynamische Routen.",
      breadcrumbMapping:
        "Hardcodiertes Breadcrumb-Mapping gefunden. Verwende findNavItemBySlug() aus Navigation-Konfiguration.",
      hardcodedTitle:
        "Hardcodierter PageHeader-Titel gefunden. Verwende useCurrentNavItem() für dynamische Titel.",
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename()

    // Nur in relevanten Dateien prüfen
    if (
      !filename.includes("src/app") &&
      !filename.includes("src/components") &&
      !filename.includes("src/lib")
    ) {
      return {}
    }

    // Ignoriere Test-Dateien und UI-Komponenten
    if (
      filename.includes("__tests__") ||
      filename.includes(".test.") ||
      filename.includes(".spec.") ||
      filename.includes("/ui/")
    ) {
      return {}
    }

    const sourceCode = context.getSourceCode()
    const text = sourceCode.getText()

    return {
      // Prüfe auf hardcodierte Routen
      Literal(node) {
        if (typeof node.value !== "string") return

        const value = node.value

        // Prüfe ob es eine Route ist (beginnt mit /)
        if (!value.startsWith("/")) return

        // Ignoriere erlaubte Patterns
        if (ALLOWED_PATTERNS.some((pattern) => pattern.test(value))) return

        // Prüfe Kontext - ist es ein href/target/etc?
        const parent = node.parent
        if (
          (parent &&
            parent.type === "Property" &&
            (parent.key?.name === "href" ||
              parent.key?.name === "target" ||
              parent.key?.name === "path" ||
              parent.key?.name === "pathname" ||
              parent.key?.name === "to")) ||
          (parent.type === "JSXAttribute" &&
            (parent.name?.name === "href" || parent.name?.name === "target"))
        ) {
          // Prüfe ob Route in Navigation existiert (vereinfacht)
          // Warnung: Dies ist eine statische Prüfung, dynamische Routen können nicht erkannt werden
          const navConfig = getNavigationConfig()

          // Wenn Route nicht in Navigation und nicht erlaubt, warnen
          if (
            !navConfig.routes.includes(value) &&
            !value.includes("${") && // Template literals sind OK
            !value.includes("buildNavHref") // buildNavHref Aufrufe sind OK
          ) {
            context.report({
              node,
              messageId: "hardcodedRoute",
              data: { route: value },
            })
          }
        }
      },

      // Prüfe auf hardcodierte Breadcrumb-Mappings
      ObjectExpression(node) {
        // Suche nach labelMappings oder ähnlichen Objekten
        const text = sourceCode.getText(node)
        if (
          text.includes("labelMappings") &&
          !text.includes("findNavItemBySlug") &&
          !text.includes("findLabelBySlug")
        ) {
          context.report({
            node,
            messageId: "breadcrumbMapping",
          })
        }
      },

      // Prüfe auf hardcodierte PageHeader-Titel
      JSXOpeningElement(node) {
        if (node.name?.name !== "PageHeader") return

        // Prüfe ob title-Prop hardcodiert ist
        const titleProp = node.attributes.find((attr) => attr.name?.name === "title")

        if (titleProp && titleProp.value?.type === "Literal") {
          // Prüfe ob useCurrentNavItem verwendet wird
          const functionBody = context
            .getAncestors()
            .find(
              (ancestor) =>
                ancestor.type === "FunctionDeclaration" ||
                ancestor.type === "FunctionExpression" ||
                ancestor.type === "ArrowFunctionExpression"
            )

          if (functionBody) {
            const functionText = sourceCode.getText(functionBody)
            if (!functionText.includes("useCurrentNavItem")) {
              context.report({
                node: titleProp,
                messageId: "hardcodedTitle",
              })
            }
          }
        }
      },
    }
  },
}
