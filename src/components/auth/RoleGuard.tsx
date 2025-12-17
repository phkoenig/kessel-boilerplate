"use client"

import { type ReactNode } from "react"
import { useAuth, type UserRole } from "./auth-context"

/**
 * RoleGuard Props
 */
interface RoleGuardProps {
  /** Erlaubte Rollen */
  allow: UserRole[]
  /** Content der angezeigt wird wenn die Rolle erlaubt ist */
  children: ReactNode
  /** Fallback Content wenn die Rolle nicht erlaubt ist (optional) */
  fallback?: ReactNode
}

/**
 * RoleGuard Komponente
 *
 * Zeigt Content nur an, wenn der aktuelle User eine der erlaubten Rollen hat.
 * Die Standardrolle "NoUser" wird für nicht angemeldete User verwendet.
 *
 * @example
 * ```tsx
 * <RoleGuard allow={['admin', 'editor']}>
 *   <AdminPanel />
 * </RoleGuard>
 *
 * <RoleGuard allow={['NoUser']} fallback={<UserDashboard />}>
 *   <LoginPrompt />
 * </RoleGuard>
 * ```
 */
export function RoleGuard({
  allow,
  children,
  fallback = null,
}: RoleGuardProps): React.ReactElement | null {
  const { role, isAuthenticated } = useAuth()

  // Check if current role is allowed
  const isAllowed = allow.includes(role) || (allow.includes("NoUser") && !isAuthenticated)

  if (isAllowed) {
    return <>{children}</>
  }

  return <>{fallback}</>
}

/**
 * RequireAuth Komponente
 *
 * Convenience-Wrapper der Content nur für authentifizierte User zeigt.
 *
 * @example
 * ```tsx
 * <RequireAuth fallback={<LoginPage />}>
 *   <Dashboard />
 * </RequireAuth>
 * ```
 */
export function RequireAuth({
  children,
  fallback = null,
}: {
  children: ReactNode
  fallback?: ReactNode
}): React.ReactElement | null {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <>{children}</>
  }

  return <>{fallback}</>
}

/**
 * RequireAdmin Komponente
 *
 * Convenience-Wrapper der Content nur für Admins zeigt.
 */
export function RequireAdmin({
  children,
  fallback = null,
}: {
  children: ReactNode
  fallback?: ReactNode
}): React.ReactElement | null {
  return (
    <RoleGuard allow={["admin"]} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}
