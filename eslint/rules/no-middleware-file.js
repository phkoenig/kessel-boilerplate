/**
 * ESLint Rule: no-middleware-file
 *
 * Verhindert die Verwendung von middleware.ts (deprecated in Next.js 16).
 * Erzwingt die Verwendung von proxy.ts mit proxy() Funktion stattdessen.
 *
 * VERBOTEN:
 * - middleware.ts (egal wo) → Nutze src/proxy.ts
 * - export async function middleware() → Nutze export default async function proxy()
 *
 * ERLAUBT:
 * - src/proxy.ts mit export default async function proxy()
 *
 * WICHTIG für Next.js 16:
 * - Datei: `src/proxy.ts` (auf gleicher Ebene wie `app/`)
 * - Export: `export default async function proxy(request: NextRequest)`
 * - Cookie-Handling: `getAll()` / `setAll()` (nicht `get()` / `set()`)
 */

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description: "Verhindert die Verwendung von middleware.ts. Nutze proxy.ts für Next.js 16.",
      category: "Next.js",
      recommended: true,
    },
    messages: {
      middlewareFile:
        'Die Datei "middleware.ts" ist in Next.js 16 deprecated. Benenne sie zu "proxy.ts" um und ändere die Funktion von "middleware()" zu "proxy()".',
      middlewareFunction:
        'Die Funktion "middleware()" ist in Next.js 16 deprecated. Benenne sie zu "proxy()" um.',
    },
    fixable: null, // Keine automatische Fixes
  },
  create(context) {
    const filename = context.getFilename()
    const isMiddlewareFile =
      filename.includes("middleware.ts") || filename.includes("middleware.js")
    const isProxyFile = filename.includes("proxy.ts") || filename.includes("proxy.js")

    return {
      // Prüfe Dateinamen: middleware.ts ist verboten
      Program(node) {
        if (isMiddlewareFile) {
          context.report({
            node,
            messageId: "middlewareFile",
          })
        }
      },
      // Prüfe auf middleware() Funktion NUR wenn NICHT in proxy.ts
      // In proxy.ts ist proxy() erlaubt (Next.js 16 erkennt nur proxy() Funktion)
      FunctionDeclaration(node) {
        if (node.id && node.id.name === "middleware" && !isProxyFile) {
          context.report({
            node: node.id,
            messageId: "middlewareFunction",
          })
        }
      },
      // Prüfe auf export async function middleware() NUR wenn NICHT in proxy.ts
      ExportNamedDeclaration(node) {
        if (
          node.declaration &&
          node.declaration.type === "FunctionDeclaration" &&
          node.declaration.id &&
          node.declaration.id.name === "middleware" &&
          !isProxyFile
        ) {
          context.report({
            node: node.declaration.id,
            messageId: "middlewareFunction",
          })
        }
      },
    }
  },
}
