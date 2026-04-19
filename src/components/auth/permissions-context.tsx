"use client"

import * as React from "react"
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react"
import type { UserRole } from "./auth-context"
import { useAuth } from "./auth-context"
import { useNavigation } from "@/lib/navigation"
import type { CoreNavigationRecord } from "@/lib/core"
import { isAdminRole } from "@/lib/auth/provisioning-role"

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

// Plan M-7: Cache nach `clerkUserId` scopen, damit ein schneller User-Wechsel
// keine "Geist-Permissions" des Vorgaengers zeigt.
type PermissionsRow = { moduleId: string; roleName: string; hasAccess: boolean }
let permissionsCacheUserId: string | null = null
let permissionsCache: PermissionsRow[] | null = null
let permissionsRequest: Promise<PermissionsRow[]> | null = null

/**
 * Test-Hook: Leert den globalen Permissions-Cache.
 *
 * Wird beim Logout in `permissions-context.tsx` automatisch aufgerufen, kann
 * aber auch von Tests / externen Konsumenten genutzt werden.
 *
 * Plan M-7.
 */
export function invalidatePermissionsCache(): void {
  permissionsCacheUserId = null
  permissionsCache = null
  permissionsRequest = null
}

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
  const fallbackPermissions = useMemo(() => generateFallbackPermissions(records), [records])
  const [permissions, setPermissions] = useState<Map<string, ModulePermission>>(fallbackPermissions)
  const [isLoaded, setIsLoaded] = useState(true)

  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const currentUserId = user?.clerkUserId ?? null

  const mergePermissions = useCallback(
    (
      accessData: Array<{ moduleId: string; roleName: string; hasAccess: boolean }>
    ): Map<string, ModulePermission> => {
      const mergedPerms = new Map<string, ModulePermission>()

      fallbackPermissions.forEach((perm, moduleId) => {
        mergedPerms.set(moduleId, {
          moduleId,
          roleAccess: new Map(perm.roleAccess),
        })
      })

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

      return mergedPerms
    },
    [fallbackPermissions]
  )

  const loadPermissions = useCallback(
    async (force = false) => {
      if (authLoading) {
        return
      }

      if (!isAuthenticated) {
        setPermissions(fallbackPermissions)
        setIsLoaded(true)
        return
      }

      // Plan M-7: Cache nur verwenden, wenn er zum aktuellen User gehoert.
      const cacheValid = permissionsCacheUserId === currentUserId
      if (!force && cacheValid && permissionsCache) {
        setPermissions(mergePermissions(permissionsCache))
        setIsLoaded(true)
        return
      }

      if (!force && cacheValid && permissionsRequest) {
        const cachedResult = await permissionsRequest
        setPermissions(mergePermissions(cachedResult))
        setIsLoaded(true)
        return
      }

      // Cache gehoerte zu einem anderen User → wegwerfen.
      if (!cacheValid) {
        invalidatePermissionsCache()
      }

      const request = (async (): Promise<PermissionsRow[]> => {
        try {
          const response = await fetch("/api/core/permissions", {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          })

          if (!response.ok) {
            permissionsCache = []
            permissionsCacheUserId = currentUserId
            return []
          }

          const payload = (await response.json()) as {
            permissions?: PermissionsRow[]
          }
          const accessData = payload.permissions ?? []
          permissionsCache = accessData
          permissionsCacheUserId = currentUserId
          return accessData
        } finally {
          permissionsRequest = null
        }
      })()

      permissionsRequest = request

      try {
        setPermissions(mergePermissions(await request))
      } catch {
        setPermissions(fallbackPermissions)
      } finally {
        setIsLoaded(true)
      }
    },
    [authLoading, currentUserId, fallbackPermissions, isAuthenticated, mergePermissions]
  )

  useEffect(() => {
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(() => {
        void loadPermissions()
      })
      return () => window.cancelIdleCallback(idleId)
    }

    const timeoutId = setTimeout(() => {
      void loadPermissions()
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [loadPermissions])

  // Permission-Cache-Invalidierung bei Logout (Plan M-7):
  // Sobald der Auth-State auf "nicht mehr angemeldet" kippt, wird der globale
  // Cache invalidiert und der lokale State auf die Fallback-Permissions
  // zurueckgesetzt. Verhindert, dass beim User-Wechsel im selben Tab alte
  // Permissions des Vorgaenger-Users sichtbar bleiben.
  const prevAuthRef = React.useRef<boolean>(isAuthenticated)
  useEffect(() => {
    if (authLoading) return
    if (prevAuthRef.current && !isAuthenticated) {
      invalidatePermissionsCache()
      setPermissions(fallbackPermissions)
    }
    prevAuthRef.current = isAuthenticated
  }, [authLoading, isAuthenticated, fallbackPermissions])

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
        const fallback = fallbackPermissions.get(moduleId)
        if (!fallback) {
          return true
        }
        return fallback.roleAccess.get(userRole) ?? false
      }

      return perm.roleAccess.get(userRole) ?? false
    },
    [fallbackPermissions, isAlwaysVisible, permissions]
  )

  return (
    <PermissionsContext.Provider
      value={{ canAccess, isLoaded, reload: () => loadPermissions(true) }}
    >
      {children}
    </PermissionsContext.Provider>
  )
}
