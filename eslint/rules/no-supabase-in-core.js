/**
 * Verbietet Supabase-Imports im Boilerplate-Kern.
 *
 * Plan J4 (siehe `docs/12_plans/260419-boilerplate-db-agnostik.md` und
 * `docs/02_architecture/ADR-003-db-agnostic-boilerplate-core.md`):
 *
 *   Der Kern (Identity, Themes, Icons, Profile, Rollen, Navigation, App-Settings)
 *   ist vollstaendig Supabase-frei. Nur optionale Beispiel-Features oder explizit
 *   freigegebene Legacy-/Migrations-Pfade duerfen `@supabase/*`-Module importieren
 *   oder aus `@/utils/supabase/**` ziehen.
 *
 * Erlaubte Pfade:
 *   - src/utils/supabase/**                     (Factories mit klaren Fehlerpfaden)
 *   - src/lib/storage/supabase-blob-storage.ts  (Legacy-Adapter, nur als Fallback)
 *   - src/app/(shell)/(examples)/**             (zukuenftige Routing-Group)
 *   - scripts/**                                (Migrations-Skripte)
 *   - Dateien mit dem Marker-Kommentar `BOILERPLATE: example-feature`
 *   - Tests (*.test.*, *.spec.*, __tests__/**)
 *
 * Meldet jede andere Stelle, die aus `@supabase/...` oder `@/utils/supabase/...`
 * importiert.
 */

const SUPABASE_MODULE_PATTERNS = [/^@supabase\//, /^@\/utils\/supabase(\/|$)/]

const ALLOWED_PATH_PATTERNS = [
  /src\/utils\/supabase\//,
  /src\/lib\/storage\/supabase-blob-storage\.ts$/,
  /src\/app\/\(shell\)\/\(examples\)\//,
  /^scripts\//,
  /\.test\.(ts|tsx|js|jsx)$/,
  /\.spec\.(ts|tsx|js|jsx)$/,
  /__tests__\//,
]

const MARKER_COMMENT = "BOILERPLATE: example-feature"

function isAllowedPath(filename) {
  return ALLOWED_PATH_PATTERNS.some((pattern) => pattern.test(filename))
}

function hasExampleMarker(sourceCode) {
  const firstComments = sourceCode.getAllComments().slice(0, 10)
  return firstComments.some((comment) => comment.value.includes(MARKER_COMMENT))
}

function isSupabaseImport(source) {
  return SUPABASE_MODULE_PATTERNS.some((pattern) => pattern.test(source))
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Verbietet Supabase-Imports im Boilerplate-Kern. Erlaubt in utils/supabase, storage-adapter, Beispiel-Features und Migrations-Skripten.",
      category: "Best Practices",
      recommended: true,
    },
    messages: {
      forbiddenImport:
        "Import von '{{source}}' im Boilerplate-Kern ist verboten. Kern-Code laeuft ohne Supabase (Plan A-K, ADR-003). Wenn dies ein optionales Beispiel-Feature ist, markiere die Datei mit '// BOILERPLATE: example-feature (depends on Supabase)'.",
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename().replace(/\\/g, "/")
    if (!filename.includes("src/") && !filename.startsWith("scripts/")) return {}
    if (isAllowedPath(filename)) return {}

    const sourceCode = context.getSourceCode()
    if (hasExampleMarker(sourceCode)) return {}

    return {
      ImportDeclaration(node) {
        const source = node.source && node.source.value
        if (!source || typeof source !== "string") return
        if (!isSupabaseImport(source)) return
        context.report({
          node: node.source,
          messageId: "forbiddenImport",
          data: { source },
        })
      },
    }
  },
}
