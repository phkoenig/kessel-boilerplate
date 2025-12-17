/**
 * Auth-Komponenten für die B2B App Shell
 *
 * Exportiert alle Auth-bezogenen Komponenten und Hooks.
 */

// Context & Hooks
export { AuthProvider, useAuth, type User, type UserRole } from "./auth-context"
export { PermissionsProvider, usePermissions } from "./permissions-context"

// Guard Components
export { RoleGuard, RequireAuth, RequireAdmin } from "./RoleGuard"
