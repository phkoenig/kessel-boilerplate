"use client"

import { useEffect, useState, useRef } from "react"
import { useAuth, usePermissions } from "@/components/auth"
import { PageContent, PageHeader } from "@/components/shell"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import { useNavigation } from "@/lib/navigation"
import { RoleManagement, type Role } from "./_components/RoleManagement"
import { useCurrentNavItem } from "@/lib/navigation/use-current-nav-item"
import type { CoreNavigationRecord } from "@/lib/core"

// Berechtigungstyp
interface Permission {
  moduleId: string
  moduleName: string
  parentId?: string
  roleAccess: Map<string, boolean> // Map<roleName, hasAccess>
  alwaysVisible?: boolean // Kann nicht über Rollen deaktiviert werden
}

/**
 * Rollen-Verwaltungsseite (nur für Admins)
 *
 * Features:
 * - Dynamische Rollen aus DB
 * - Hierarchische Tree-Logik (Section → Item → Child)
 * - Admin-Spalte gesperrt (immer aktiv)
 * - Scroll-Position bleibt erhalten
 * - Rollen-Management (anlegen/löschen)
 */
export default function RolesPage(): React.ReactElement {
  const { role, isLoading: authLoading } = useAuth()
  const { reload: reloadPermissions } = usePermissions()
  const { records: navigationRecords } = useNavigation()
  const currentNavItem = useCurrentNavItem()
  const pageTitle = currentNavItem?.label ?? "Rollen & Berechtigungen"
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [savingModuleId, setSavingModuleId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const scrollPosition = useRef(0)

  // Initialisiere Berechtigungen aus Navigation Config
  function initializePermissions(
    availableRoles: Role[],
    records: CoreNavigationRecord[]
  ): Permission[] {
    const perms: Permission[] = []

    records.forEach((record) => {
      const roleAccess = new Map<string, boolean>()
      availableRoles.forEach((r) => {
        const hasAccess =
          r.name === "admin" ||
          record.requiredRoles.length === 0 ||
          record.requiredRoles.includes(r.name)
        roleAccess.set(r.name, hasAccess)
      })

      perms.push({
        moduleId: record.id,
        moduleName: record.sectionTitle ?? record.label,
        parentId: record.parentId ?? undefined,
        roleAccess,
        alwaysVisible: record.alwaysVisible,
      })
    })

    return perms
  }

  // Lade Rollen aus DB
  async function loadRoles() {
    try {
      const response = await fetch("/api/admin/roles", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        return []
      }

      const payload = (await response.json()) as {
        roles?: Array<{
          id: string
          name: string
          displayName: string
          description?: string | null
          isSystem: boolean
        }>
      }

      return (payload.roles ?? []).map(
        (role): Role => ({
          id: role.id,
          name: role.name,
          display_name: role.displayName,
          description: role.description ?? undefined,
          is_system: role.isSystem,
        })
      )
    } catch (err) {
      console.error("Fehler:", err)
      return []
    }
  }

  // Lade Berechtigungen aus DB
  async function loadPermissions(showLoader = true) {
    // Scroll-Position speichern (die Seite scrollt jetzt, nicht die Tabelle)
    scrollPosition.current = window.scrollY

    // Loader nur bei initialem Laden zeigen, nicht bei Updates
    if (showLoader) {
      setIsLoading(true)
    }
    setError(null)

    try {
      // Lade Rollen zuerst
      const loadedRoles = await loadRoles()
      setRoles(loadedRoles)

      if (loadedRoles.length === 0) {
        // Keine Rollen vorhanden, setze leere Permissions
        setPermissions([])
        return
      }

      // Setze Rollen für initializePermissions
      setRoles(loadedRoles)

      const permissionsResponse = await fetch("/api/core/permissions", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })
      const permissionsPayload = permissionsResponse.ok
        ? ((await permissionsResponse.json()) as {
            permissions?: Array<{ moduleId: string; roleName: string; hasAccess: boolean }>
          })
        : { permissions: [] }
      const accessData = permissionsPayload.permissions ?? []

      // Starte mit Fallback (alle Module aus Navigation)
      const fallbackPerms = initializePermissions(loadedRoles, navigationRecords)
      const mergedPerms = new Map<string, Permission>()

      // Initialisiere alle Module aus Fallback
      fallbackPerms.forEach((perm) => {
        mergedPerms.set(perm.moduleId, {
          ...perm,
          roleAccess: new Map(perm.roleAccess),
        })
      })

      // Wenn DB Daten hat, überschreibe mit DB-Werten
      if (accessData && accessData.length > 0) {
        accessData.forEach((row) => {
          const moduleId = row.moduleId
          const roleName = row.roleName
          const hasAccess = row.hasAccess ?? true

          if (!moduleId || !roleName) return

          // Hole oder erstelle Permission für dieses Modul
          let perm = mergedPerms.get(moduleId)
          if (!perm) {
            // Neues Modul: Initialisiere mit Standard-Werten
            perm = {
              moduleId,
              moduleName: moduleId,
              roleAccess: new Map(),
            }
            loadedRoles.forEach((r) => {
              perm!.roleAccess.set(r.name, r.name === "admin" ? true : false)
            })
            mergedPerms.set(moduleId, perm)
          }

          // Setze Berechtigung für diese Rolle
          perm.roleAccess.set(roleName, hasAccess)
        })
      }

      // Konvertiere Map zu Array
      setPermissions(Array.from(mergedPerms.values()))
    } catch (err) {
      console.error("Fehler:", err)
      // Fallback: Nutze leere Rollen-Liste
      setPermissions(initializePermissions([], navigationRecords))
    } finally {
      setIsLoading(false)
    }
  }

  // Scroll-Position wiederherstellen nach Laden ODER nach Permissions-Update
  useEffect(() => {
    if (!isLoading && scrollPosition.current > 0) {
      // Kleine Verzögerung, damit DOM aktualisiert ist
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPosition.current)
      })
    }
  }, [isLoading, permissions])

  useEffect(() => {
    if (role === "admin" || role === "super-user") {
      void loadPermissions(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadPermissions wird absichtlich über role/navigation-Änderungen getriggert
  }, [navigationRecords, role])

  // Speichere Berechtigungen in DB (Junction-Tabelle)
  async function savePermissions(updatedPermissions: Permission[]) {
    try {
      const upserts: Array<{ moduleId: string; roleName: string; hasAccess: boolean }> = []

      updatedPermissions.forEach((perm) => {
        perm.roleAccess.forEach((hasAccess, roleName) => {
          upserts.push({
            moduleId: perm.moduleId,
            roleName,
            hasAccess,
          })
        })
      })

      if (upserts.length > 0) {
        const response = await fetch("/api/admin/roles/permissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ permissions: upserts }),
        })

        if (!response.ok) {
          const payload = (await response.json()) as { error?: string }
          throw new Error(payload.error || "Fehler beim Speichern der Berechtigungen")
        }
      }

      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Speichern")
    }
  }

  /**
   * Findet rekursiv alle Children einer Section oder eines Items.
   * Unterstützt mehrere Ebenen (Section → Item → Child → Child → ...)
   */
  function findAllChildren(parentId: string): string[] {
    const children: string[] = []

    // Direkte Children finden
    const directChildren = permissions.filter((perm) => perm.parentId === parentId)
    directChildren.forEach((child) => {
      children.push(child.moduleId)
      // Rekursiv: Children der Children finden
      children.push(...findAllChildren(child.moduleId))
    })

    return children
  }

  // Berechtigung ändern und automatisch speichern
  async function handlePermissionChange(
    moduleId: string,
    targetRoleName: string,
    checked: boolean
  ) {
    // Prüfe ob es eine Section ist (kein parentId)
    const targetModule = permissions.find((p) => p.moduleId === moduleId)
    if (!targetModule) return

    const isSection = !targetModule.parentId

    // IMMER alle Children rekursiv finden (nicht nur für Sections!)
    const allChildrenIds = findAllChildren(moduleId)

    // Debug-Log
    if (process.env.NODE_ENV === "development") {
      console.log("[RolesPage] handlePermissionChange:", {
        moduleId,
        targetRoleName,
        checked,
        isSection,
        childrenFound: allChildrenIds.length,
        children: allChildrenIds,
      })
    }

    // Optimistic Update: UI sofort aktualisieren
    // 1. Das geklickte Modul selbst aktualisieren
    // 2. ALLE Children rekursiv aktualisieren
    const updatedPermissions = permissions.map((perm) => {
      if (perm.moduleId === moduleId || allChildrenIds.includes(perm.moduleId)) {
        const newRoleAccess = new Map(perm.roleAccess)
        newRoleAccess.set(targetRoleName, checked)
        return { ...perm, roleAccess: newRoleAccess }
      }
      return perm
    })

    // Optimistic Update: UI sofort aktualisieren
    setPermissions(updatedPermissions)

    // Speichern in DB
    setSavingModuleId(moduleId)
    try {
      await savePermissions(updatedPermissions)

      // Nach erfolgreichem Speichern: PermissionsProvider neu laden
      await reloadPermissions()

      // Lokale Permissions neu laden OHNE Loader (Scroll-Position bleibt erhalten)
      await loadPermissions(false)
    } finally {
      setSavingModuleId(null)
    }
  }

  // Rollen neu laden (nach Anlegen/Löschen)
  async function handleRoleChanged() {
    await loadPermissions()
  }

  // Warte auf Auth-Loading
  if (authLoading) {
    return (
      <PageContent>
        <PageHeader title={pageTitle} description="Verwalte die Zugriffsrechte für jede Rolle" />
        <div className="flex items-center justify-center p-8">
          <Loader2 className="text-muted-foreground size-8 animate-spin" />
        </div>
      </PageContent>
    )
  }

  // Während Auth lädt: Spinner anzeigen
  if (authLoading) {
    return (
      <PageContent>
        <PageHeader title={pageTitle} description="Lade Berechtigungen..." />
        <div className="flex items-center justify-center p-8">
          <Loader2 className="text-muted-foreground size-8 animate-spin" />
        </div>
      </PageContent>
    )
  }

  // Nicht-Admin: Zugriff verweigert (nur prüfen wenn Auth geladen)
  if (role !== "admin" && role !== "super-user") {
    return (
      <PageContent>
        <PageHeader
          title="Zugriff verweigert"
          description="Diese Seite ist nur für Administratoren."
        />
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Du hast keine Berechtigung für diese Seite.</p>
        </div>
      </PageContent>
    )
  }

  return (
    <PageContent>
      <PageHeader title={pageTitle} description="Verwalte die Zugriffsrechte für jede Rolle" />
      {/* Rollen-Management */}
      <RoleManagement
        roles={roles}
        onRoleAdded={handleRoleChanged}
        onRoleDeleted={handleRoleChanged}
      />

      {/* Messages */}
      {error && (
        <div className="bg-destructive/10 text-destructive border-destructive/20 mb-4 rounded-md border p-4 text-sm">
          {error}
        </div>
      )}

      {/* Permissions Matrix */}
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="text-muted-foreground size-8 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Helper: Filtere Permissions nach Section-ID */}
          {(() => {
            const getSectionPermissions = (sectionId: string) => {
              // Finde alle Module-IDs, die zu dieser Section gehören
              const sectionModuleIds = new Set<string>([sectionId])

              // Finde alle direkten Items der Section
              const section = allNavigationConfig.find((s) => s.id === sectionId)
              if (section) {
                section.items.forEach((item) => {
                  if (item.id !== "account-login") {
                    sectionModuleIds.add(item.id)
                    // Finde alle Children der Items
                    item.children?.forEach((child) => {
                      sectionModuleIds.add(child.id)
                    })
                  }
                })
              }

              // Finde rekursiv alle Children (für verschachtelte Strukturen)
              const findAllDescendants = (parentId: string): string[] => {
                const descendants: string[] = []
                permissions.forEach((perm) => {
                  if (perm.parentId === parentId) {
                    descendants.push(perm.moduleId)
                    descendants.push(...findAllDescendants(perm.moduleId))
                  }
                })
                return descendants
              }

              // Füge alle rekursiven Children hinzu
              sectionModuleIds.forEach((moduleId) => {
                const descendants = findAllDescendants(moduleId)
                descendants.forEach((descId) => sectionModuleIds.add(descId))
              })

              // Filtere Permissions
              return permissions.filter((perm) => sectionModuleIds.has(perm.moduleId))
            }

            const renderPermissionsTable = (sectionPerms: Permission[]) => {
              if (sectionPerms.length === 0) return null

              return (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/2">Modul / Seite</TableHead>
                      {roles.map((r) => (
                        <TableHead key={r.id} className="text-center">
                          {r.display_name}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sectionPerms.map((perm) => {
                      // Einrückung basierend auf Parent
                      const indent = perm.parentId
                        ? sectionPerms.find((p) => p.moduleId === perm.parentId)?.parentId
                          ? "pl-12"
                          : "pl-6"
                        : ""
                      const isSection = !perm.parentId

                      return (
                        <TableRow
                          key={perm.moduleId}
                          className={cn(
                            isSection ? "bg-muted/50 font-medium" : "",
                            "hover:bg-accent/50 transition-colors"
                          )}
                        >
                          <TableCell className={indent}>
                            {!isSection && <span className="text-muted-foreground mr-2">└</span>}
                            {perm.moduleName}
                            {perm.alwaysVisible && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Immer sichtbar
                              </Badge>
                            )}
                          </TableCell>
                          {roles.map((r) => {
                            const isSaving = savingModuleId === perm.moduleId
                            const isAdmin = r.name === "admin"
                            const isAlwaysVisible = perm.alwaysVisible === true
                            // Admin-Spalte und alwaysVisible Items sind IMMER gesperrt
                            const isDisabled = isAlwaysVisible || isAdmin || isSaving
                            const hasAccess = perm.roleAccess.get(r.name) ?? false
                            // alwaysVisible Items sind immer aktiv (checked)
                            const isChecked = isAdmin || isAlwaysVisible ? true : hasAccess

                            return (
                              <TableCell key={r.id} className="text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div
                                          className={isAdmin || isAlwaysVisible ? "opacity-40" : ""}
                                        >
                                          <Checkbox
                                            checked={isChecked}
                                            onCheckedChange={(checked) => {
                                              // Admin-Spalte und alwaysVisible dürfen NIEMALS geändert werden
                                              if (!isAdmin && !isAlwaysVisible) {
                                                handlePermissionChange(
                                                  perm.moduleId,
                                                  r.name,
                                                  !!checked
                                                )
                                              }
                                            }}
                                            disabled={isDisabled}
                                            className={
                                              isAdmin || isAlwaysVisible
                                                ? "pointer-events-none cursor-not-allowed"
                                                : ""
                                            }
                                          />
                                        </div>
                                      </TooltipTrigger>
                                      {isAdmin && (
                                        <TooltipContent>
                                          <p>Admin hat immer Vollzugriff (nicht änderbar)</p>
                                        </TooltipContent>
                                      )}
                                      {isAlwaysVisible && !isAdmin && (
                                        <TooltipContent>
                                          <p>Dieser Punkt ist immer sichtbar (nicht änderbar)</p>
                                        </TooltipContent>
                                      )}
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </TableCell>
                            )
                          })}
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )
            }

            // Dynamisch alle Sections aus allNavigationConfig rendern
            return (
              <>
                {allNavigationConfig.map((section) => {
                  const sectionPerms = getSectionPermissions(section.id)
                  if (sectionPerms.length === 0) return null

                  // Titel für die Card: section.title oder formatierter section.id
                  const cardTitle =
                    section.title ||
                    section.id
                      .split("-")
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(" ")

                  return (
                    <Card key={section.id}>
                      <CardHeader>
                        <CardTitle>{cardTitle}</CardTitle>
                      </CardHeader>
                      <CardContent>{renderPermissionsTable(sectionPerms)}</CardContent>
                    </Card>
                  )
                })}
              </>
            )
          })()}
        </div>
      )}
    </PageContent>
  )
}
