/**
 * Verbietet rohe String-Vergleiche mit Rollen-Literalen
 * (`"admin"`, `"superuser"`, `"super-user"`).
 * Statt dessen muss `isAdminRole()` aus `@/lib/auth/provisioning-role` verwendet
 * werden, um Case-Insensitivity und Aliase abzudecken.
 *
 * Plan M-6: Role-Check-Vereinheitlichung.
 */

const ROLE_LITERALS = new Set(["admin", "superuser", "super-user"])

function isRoleLiteral(node) {
  return (
    node &&
    node.type === "Literal" &&
    typeof node.value === "string" &&
    ROLE_LITERALS.has(node.value.toLowerCase())
  )
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: 'Verbietet `role === "admin"` etc. - nutze isAdminRole().',
      category: "Security",
      recommended: true,
    },
    messages: {
      raw: "Roher Rollen-Vergleich mit `{{ value }}`. Nutze isAdminRole(role) aus @/lib/auth/provisioning-role.",
    },
    schema: [],
  },
  create(context) {
    return {
      BinaryExpression(node) {
        if (node.operator !== "===" && node.operator !== "==") return
        if (isRoleLiteral(node.right)) {
          context.report({
            node,
            messageId: "raw",
            data: { value: node.right.value },
          })
        } else if (isRoleLiteral(node.left)) {
          context.report({
            node,
            messageId: "raw",
            data: { value: node.left.value },
          })
        }
      },
    }
  },
}
