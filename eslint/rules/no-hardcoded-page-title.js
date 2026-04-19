/**
 * In der Shell keine statischen `metadata.title` — Titel aus Navigation ableiten
 * (`buildNavPageMetadata` aus `@/lib/navigation/metadata`).
 */

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Kein hardcodiertes metadata.title in (shell)-Routen",
      category: "Best Practices",
      recommended: true,
    },
    messages: {
      hardcodedTitle:
        "Hardcodiertes metadata.title in Shell-Route. Nutze buildNavPageMetadata() aus @/lib/navigation/metadata oder entferne metadata.title (PageHeader nutzt Navigation).",
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename().replace(/\\/g, "/")
    if (!filename.includes("src/app/(shell)/")) {
      return {}
    }
    if (
      filename.includes("__tests__") ||
      filename.includes(".test.") ||
      filename.includes(".spec.")
    ) {
      return {}
    }

    return {
      ExportNamedDeclaration(node) {
        const decl = node.declaration
        if (!decl || decl.type !== "VariableDeclaration") {
          return
        }
        const first = decl.declarations[0]
        if (!first || first.id?.type !== "Identifier" || first.id.name !== "metadata") {
          return
        }
        if (first.init?.type !== "ObjectExpression") {
          return
        }
        for (const prop of first.init.properties) {
          if (
            prop.type !== "Property" ||
            prop.key?.type !== "Identifier" ||
            prop.key.name !== "title"
          ) {
            continue
          }
          if (prop.value?.type === "Literal" && typeof prop.value.value === "string") {
            context.report({ node: prop.value, messageId: "hardcodedTitle" })
          }
        }
      },
    }
  },
}
