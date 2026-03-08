"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { UserRole } from "./auth-context"
import { useAuth } from "./auth-context"
import { useNavigation } from "@/lib/navigation"
import type { CoreNavigationRecord } from "@/lib/core"
import { isAdminRole } from "@/lib/auth/allowed-users"

/** Permission für ein Modul - jetzt mit dynamischen Rollen */
interface ModulePermission {
  moduleId: string
  roleAccess: Map<string, boolean> // Map<roleName, hasAccess>
}

/** Permissions Context Interface */
interface PermissionsContextValue {
  /** Prüft ob ein Modul für eine Rolle sichtbar ist */
  canAccess: (moduleId: string, userRole: string) => boolean
  /** Ob Permissions geladen wurden */
  isLoaded: boolean
  /** Permissions neu laden (z.B. nach Änderung im Admin) */
  reload: () => Promise<void>
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null)

/** Hook zum Zugriff auf Permissions */
export function usePermissions(): PermissionsContextValue {
  const context = useContext(PermissionsContext)
  if (!context) {
    throw new Error("usePermissions must be used within PermissionsProvider")
  }
  return context
}

/**
 * Generiert Fallback-Permissions aus der produktiven Core-Navigation.
 * Nutzt Standard-Rollen: admin, user, superuser
 */
function generateFallbackPermissions(
  navigationItems: CoreNavigationRecord[]
): Map<string, ModulePermission> {
  const perms = new Map<string, ModulePermission>()

  navigationItems.forEach((item) => {
    if (item.id === "user-login") {
      return
    }

    const roles = item.requiredRoles || []
    const roleAccess = new Map<string, boolean>()

    roleAccess.set("admin", roles.length === 0 || roles.includes("admin"))
    roleAccess.set("user", roles.length === 0 || roles.includes("user"))
    roleAccess.set(
      "superuser",
      roles.length === 0 || roles.includes("superuser") || roles.includes("admin")
    )
    roleAccess.set(
      "super-user",
      roles.length === 0 || roles.includes("superuser") || roles.includes("admin")
    )

    perms.set(item.id, {
      moduleId: item.id,
      roleAccess,
    })
  })

  return perms
}

/**
 * PermissionsProvider - Lädt und stellt Modul-Berechtigungen bereit.
 *
 * - Lädt Berechtigungen aus role_permissions Tabelle
 * - Fallback auf statische Navigation Config wenn DB leer
 * - Stellt canAccess() Funktion bereit
 */
export function PermissionsProvider({ children }: { children: ReactNode }): React.ReactElement {
  const { records } = useNavigation()
  const [permissions, setPermissions] = useState<Map<string, ModulePermission>>(() =>
    generateFallbackPermissions(records)
  )
  const [isLoaded, setIsLoaded] = useState(false)

  const { user, isAuthenticated } = useAuth()

  const loadPermissions = useCallback(async () => {
    try {
      const response = await fetch("/api/core/permissions", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        setPermissions(generateFallbackPermissions(records))
        return
      }

      const payload = (await response.json()) as {
        permissions?: Array<{ moduleId: string; roleName: string; hasAccess: boolean }>
      }
      const accessData = payload.permissions ?? []

      const fallbackPerms = generateFallbackPermissions(records)
      const mergedPerms = new Map<string, ModulePermission>()

      fallbackPerms.forEach((perm, moduleId) => {
        mergedPerms.set(moduleId, {
          moduleId,
          roleAccess: new Map(perm.roleAccess),
        })
      })

      if (accessData && accessData.length > 0) {
        accessData.forEach((row) => {
          const moduleId = row.moduleId
          const roleName = row.roleName
          const hasAccess = row.hasAccess ?? true

          if (!moduleId || !roleName) return

          let perm = mergedPerms.get(moduleId)
          if (!perm) {
            perm = {
              moduleId,
              roleAccess: new Map(),
            }
            mergedPerms.set(moduleId, perm)
          }

          perm.roleAccess.set(roleName, hasAccess)
        })
      }

      setPermissions(mergedPerms)
    } catch {
      setPermissions(generateFallbackPermissions(records))
    } finally {
      setIsLoaded(true)
    }
  }, [records])

  useEffect(() => {
    setIsLoaded(false)
    loadPermissions()
  }, [loadPermissions, records, user?.id, isAuthenticated])

  /**
   * Prüft ob ein Modul 'alwaysVisible' ist (kann nicht über Rollen deaktiviert werden)
   */
  const isAlwaysVisible = useCallback(
    (moduleId: string): boolean => {
      return records.some((item) => item.id === moduleId && item.alwaysVisible)
    },
    [records]
  )

  /**
   * Prüft ob ein Modul für eine Rolle sichtbar ist.
   *
   * Spezialfälle:
   * - Admin: Hat IMMER Zugriff auf alles (Sicherheitsnetz)
   * - NoUser: Navigation ist nicht sichtbar (werden zu Login redirected) → immer false
   * - alwaysVisible: Immer sichtbar für alle eingeloggten User (z.B. Impressum, Logout, Profil)
   * - Unbekannte Module: Fallback auf statische Config
   */
  const canAccess = useCallback(
    (moduleId: string, userRole: UserRole): boolean => {
      if (isAdminRole(userRole)) {
        return true
      }

      if (userRole === "NoUser") {
        return false
      }

      if (isAlwaysVisible(moduleId)) {
        return true
      }

      const perm = permissions.get(moduleId)

      if (!perm) {
        const fallback = generateFallbackPermissions(records).get(moduleId)
        if (!fallback) {
          return true
        }
        return fallback.roleAccess.get(userRole) ?? false
      }

      return perm.roleAccess.get(userRole) ?? false
    },
    [permissions, isAlwaysVisible, records]
  )

  return (
    <PermissionsContext.Provider value={{ canAccess, isLoaded, reload: loadPermissions }}>
      {children}
    </PermissionsContext.Provider>
  )
}
