/**
 * Erzwingt eine `// AUTH:`-Klassifizierung am Anfang jeder API-Route
 * unter `src/app/api/**\/route.ts`.
 *
 * Erlaubte Werte: `public`, `authenticated`, `admin`, `webhook`, `dev-only`.
 * Plan H-9: Auth-Matrix muss fuer jede Route explizit dokumentiert sein.
 */

const ALLOWED = ["public", "authenticated", "admin", "webhook", "dev-only"]
const HEADER_RE = /^\/\/\s*AUTH:\s*([a-z-]+)/m

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Jede API-Route muss eine // AUTH:-Klassifizierung haben",
      category: "Security",
      recommended: true,
    },
    messages: {
      missing:
        "Fehlende `// AUTH: <level>`-Annotation am Anfang der Route. Erlaubt: " +
        ALLOWED.join("|") +
        ".",
      invalid: "Ungueltiger AUTH-Level `{{ value }}`. Erlaubt: " + ALLOWED.join("|") + ".",
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename().replace(/\\/g, "/")
    if (!/src\/app\/api\/.+\/route\.(ts|js)$/.test(filename)) {
      return {}
    }
    return {
      Program(node) {
        const source = context.getSourceCode().getText()
        const head = source.slice(0, 400)
        const match = head.match(HEADER_RE)
        if (!match) {
          context.report({ node, messageId: "missing" })
          return
        }
        if (!ALLOWED.includes(match[1])) {
          context.report({ node, messageId: "invalid", data: { value: match[1] } })
        }
      },
    }
  },
}
