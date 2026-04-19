/**
 * Verbietet Imports aus `@/lib/spacetime/module-bindings` in Client-Code
 * (Plan C-1 Stufe 1).
 *
 * Client-Code darf ausschliesslich aus `@/lib/spacetime/client-bindings`
 * importieren — das re-exportiert nur die Lese-Typen (DbConnection,
 * DbConnectionBuilder, SubscriptionBuilder, tables) und keine Reducer.
 *
 * "Client-Code" bedeutet hier:
 * - Dateien unter `src/components/**`
 * - Dateien unter `src/app/**`, die kein `route.ts` sind
 * - Dateien mit `"use client"`-Direktive
 *
 * Ausnahme (Server-Side): `src/lib/core/**`, `src/lib/spacetime/**`,
 * `src/app/api/**`, `src/lib/ai/tool-executor.ts`, Tests.
 */

const FORBIDDEN_SOURCES = new Set([
  "@/lib/spacetime/module-bindings",
  "../../spacetime/module-bindings",
  "../spacetime/module-bindings",
])

const SERVER_ONLY_PATHS = [
  /src\/lib\/core\//,
  /src\/lib\/spacetime\//,
  /src\/app\/api\//,
  /src\/lib\/ai\/tool-executor\.ts/,
]

function isServerOnlyFile(filename) {
  return SERVER_ONLY_PATHS.some((p) => p.test(filename))
}

function isTestFile(filename) {
  return (
    filename.includes("__tests__") || filename.includes(".test.") || filename.includes(".spec.")
  )
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Verbietet Import der rohen Spacetime-Bindings in Client-Code (erzwingt Client-Barrel ohne Reducer)",
      category: "Best Practices",
      recommended: true,
    },
    messages: {
      forbiddenImport:
        "Import von '{{source}}' ist in Client-Code verboten. Verwende stattdessen '@/lib/spacetime/client-bindings' (keine Reducer). Siehe Plan C-1.",
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename().replace(/\\/g, "/")
    if (!filename.includes("src/")) return {}
    if (isServerOnlyFile(filename)) return {}
    if (isTestFile(filename)) return {}

    return {
      ImportDeclaration(node) {
        const source = node.source && node.source.value
        if (!source) return
        if (!FORBIDDEN_SOURCES.has(source)) return
        context.report({
          node: node.source,
          messageId: "forbiddenImport",
          data: { source },
        })
      },
    }
  },
}
