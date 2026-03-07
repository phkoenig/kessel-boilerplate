"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth"
import { PageContent } from "@/components/shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TableInlineEdit } from "@/components/ui/table-inline-edit"
import { Loader2, Users, Trash2, ChevronDown, ChevronRight } from "lucide-react"
import { AddButton } from "@/components/ui/add-button"
import { ExpandableSearch } from "@/components/ui/expandable-search"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

interface UserProfile {
  id: string
  clerkUserId: string
  email: string
  display_name: string | null
  role: string
  created_at: string
  last_sign_in_at: string | null
}

interface Role {
  id: string
  name: string
  display_name: string
  description?: string
  is_system: boolean
}

interface Tenant {
  id: string
  clerkOrgId?: string
  slug: string
  name: string
}

interface UserTenant {
  user_id: string
  tenant_id: string
  is_active: boolean
  tenant?: Tenant
}

/**
 * User-Verwaltungsseite (nur für Admins)
 *
 * Features:
 * - Liste aller User mit Rollen
 * - Inline-Editing für E-Mail, Name und Rolle
 * - Passwort zurücksetzen
 * - User löschen
 */
export default function UsersPage(): React.ReactElement {
  const { user, role, isLoading: authLoading } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [availableRoles, setAvailableRoles] = useState<Role[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [userTenants, setUserTenants] = useState<Record<string, UserTenant[]>>({})
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Inline-Editing States
  const [editingField, setEditingField] = useState<{
    userId: string
    field: "email" | "display_name" | "role"
  } | null>(null)
  const [editValue, setEditValue] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Delete Dialog State
  const [deleteDialog, setDeleteDialog] = useState<UserProfile | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Add User Dialog State
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserPassword, setNewUserPassword] = useState("")
  const [newUserDisplayName, setNewUserDisplayName] = useState("")
  const [newUserRole, setNewUserRole] = useState("user")
  const [isCreating, setIsCreating] = useState(false)

  async function loadMembershipData(): Promise<{
    tenants: Tenant[]
    memberships: Record<string, UserTenant[]>
  }> {
    try {
      const response = await fetch("/api/admin/memberships", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        return { tenants: [], memberships: {} }
      }

      const payload = (await response.json()) as {
        tenants?: Array<{ id: string; clerkOrgId: string; slug: string; name: string }>
        memberships?: Array<{
          userId: string
          clerkUserId: string
          tenantId: string
          role: string
          isActive: boolean
        }>
      }

      const tenants = (payload.tenants ?? []).map(
        (tenant): Tenant => ({
          id: tenant.id,
          clerkOrgId: tenant.clerkOrgId,
          slug: tenant.slug,
          name: tenant.name,
        })
      )

      const grouped: Record<string, UserTenant[]> = {}
      for (const item of payload.memberships ?? []) {
        const tenant = tenants.find((entry) => entry.id === item.tenantId)
        const userTenant: UserTenant = {
          user_id: item.userId,
          tenant_id: item.tenantId,
          is_active: item.isActive,
          tenant,
        }

        if (!grouped[item.userId]) {
          grouped[item.userId] = []
        }

        grouped[item.userId].push(userTenant)
      }

      return { tenants, memberships: grouped }
    } catch (err) {
      console.error("Fehler beim Laden der Membership-Daten:", err)
      return { tenants: [], memberships: {} }
    }
  }

  // Lade Rollen aus DB
  async function loadRoles() {
    try {
      const response = await fetch("/api/admin/roles", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        // Fallback: Standard-Rollen
        return [
          { id: "admin", name: "admin", display_name: "Administrator", is_system: true },
          { id: "user", name: "user", display_name: "Benutzer", is_system: true },
        ] as Role[]
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
      console.error("Fehler beim Laden der Rollen:", err)
      // Fallback: Standard-Rollen
      return [
        { id: "admin", name: "admin", display_name: "Administrator", is_system: true },
        { id: "user", name: "user", display_name: "Benutzer", is_system: true },
      ] as Role[]
    }
  }

  // Lade User-Liste
  async function loadUsers() {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/users", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })

      const payload = (await response.json()) as { error?: string; users?: UserProfile[] }
      if (!response.ok) {
        setError(payload.error || "Fehler beim Laden der User")
        return
      }

      setUsers(payload.users ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Laden der User")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (role === "admin" || role === "super-user") {
      setIsLoading(true)
      Promise.all([loadRoles(), loadUsers(), loadMembershipData()]).then(
        ([roles, , membershipData]) => {
          setAvailableRoles(roles)
          setTenants(membershipData.tenants)
          setUserTenants(membershipData.memberships)
        }
      )
    }
  }, [role])

  // Starte Inline-Editing
  function startEditing(
    userId: string,
    field: "email" | "display_name" | "role",
    currentValue: string
  ) {
    setEditingField({ userId, field })
    setEditValue(currentValue || "")
  }

  // Beende Inline-Editing ohne Speichern
  function cancelEditing() {
    setEditingField(null)
    setEditValue("")
  }

  // Speichere Änderung
  async function saveEdit() {
    if (!editingField) return

    const userToUpdate = users.find((u) => u.id === editingField.userId)
    if (!userToUpdate) return

    // Validierung
    if (editingField.field === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(editValue)) {
        setError("Bitte gib eine gültige E-Mail-Adresse ein")
        return
      }
      if (editValue === userToUpdate.email) {
        cancelEditing()
        return
      }
    } else if (editingField.field === "display_name") {
      if (editValue.trim() === (userToUpdate.display_name || "")) {
        cancelEditing()
        return
      }
    } else if (editingField.field === "role") {
      if (editValue === userToUpdate.role) {
        cancelEditing()
        return
      }
    }

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/update-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkUserId: userToUpdate.clerkUserId,
          ...(editingField.field === "email" ? { email: editValue.trim() } : {}),
          ...(editingField.field === "display_name"
            ? { displayName: editValue.trim() || null }
            : {}),
          ...(editingField.field === "role" ? { role: editValue } : {}),
        }),
      })

      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error || "Fehler beim Speichern")
      }

      // Aktualisiere lokale Liste
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingField.userId
            ? {
                ...u,
                [editingField.field]:
                  editingField.field === "display_name" ? editValue.trim() || null : editValue,
              }
            : u
        )
      )

      cancelEditing()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Speichern")
    } finally {
      setIsSaving(false)
    }
  }

  // User löschen
  async function handleDeleteUser() {
    if (!deleteDialog) return

    setIsDeleting(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkUserId: deleteDialog.clerkUserId }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Zeige detaillierte Fehlermeldung
        const errorMsg = data.error || "Fehler beim Löschen des Users"
        const details = data.details ? ` (Details: ${JSON.stringify(data.details)})` : ""
        throw new Error(`${errorMsg}${details}`)
      }

      // Entferne User aus lokaler Liste
      setUsers((prev) => prev.filter((u) => u.id !== deleteDialog.id))
      setDeleteDialog(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Fehler beim Löschen des Users"
      console.error("Fehler beim Löschen:", err)
      setError(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  // Neuen User erstellen
  async function handleCreateUser() {
    // Validierung
    if (!newUserEmail.trim()) {
      setError("E-Mail ist erforderlich")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newUserEmail)) {
      setError("Bitte gib eine gültige E-Mail-Adresse ein")
      return
    }

    if (!newUserPassword || newUserPassword.length < 8) {
      setError("Passwort muss mindestens 8 Zeichen haben")
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newUserEmail.trim(),
          password: newUserPassword,
          displayName: newUserDisplayName.trim() || null,
          role: newUserRole,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fehler beim Erstellen des Users")
      }

      // Dialog schließen und Formular zurücksetzen
      setIsAddDialogOpen(false)
      setNewUserEmail("")
      setNewUserPassword("")
      setNewUserDisplayName("")
      setNewUserRole("user")

      // User-Liste neu laden
      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Erstellen des Users")
    } finally {
      setIsCreating(false)
    }
  }

  // Dialog schließen und zurücksetzen
  function closeAddDialog() {
    setIsAddDialogOpen(false)
    setNewUserEmail("")
    setNewUserPassword("")
    setNewUserDisplayName("")
    setNewUserRole("user")
    setError(null)
  }

  // Filtere User nach Suchbegriff
  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Rollen-Badge Farbe
  function getRoleBadgeVariant(userRole: string) {
    switch (userRole) {
      case "admin":
        return "destructive"
      case "user":
        return "default"
      default:
        return "secondary"
    }
  }

  // Rolle Display-Name finden
  function getRoleDisplayName(roleName: string): string {
    const role = availableRoles.find((r) => r.name === roleName)
    return role?.display_name || roleName
  }

  // Toggle expandable row
  function toggleUserExpansion(userId: string) {
    setExpandedUsers((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) {
        next.delete(userId)
      } else {
        next.add(userId)
      }
      return next
    })
  }

  // Aktualisiere is_active für User-Tenant-Zuordnung
  async function updateUserTenantActive(userId: string, tenantId: string, isActive: boolean) {
    try {
      // Prüfe ob es der admin@local User ist
      const userItem = users.find((u) => u.id === userId)
      if (userItem?.email === "admin@local" && !isActive) {
        throw new Error("Der Admin-User kann nicht deaktiviert werden")
      }

      const response = await fetch("/api/admin/memberships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkUserId: userItem?.clerkUserId,
          tenantId,
          isActive,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string }
        throw new Error(payload.error || "Membership konnte nicht aktualisiert werden")
      }

      // Aktualisiere lokalen State
      setUserTenants((prev) => {
        const userTenantsList = prev[userId] || []
        const existingIndex = userTenantsList.findIndex((ut) => ut.tenant_id === tenantId)

        if (existingIndex >= 0) {
          // Update bestehende
          const updated = [...userTenantsList]
          updated[existingIndex] = { ...updated[existingIndex], is_active: isActive }
          return { ...prev, [userId]: updated }
        } else {
          // Neue hinzufügen
          const tenant = tenants.find((t) => t.id === tenantId)
          if (!tenant) return prev

          const newUserTenant: UserTenant = {
            user_id: userId,
            tenant_id: tenantId,
            is_active: isActive,
            tenant,
          }
          return { ...prev, [userId]: [...userTenantsList, newUserTenant] }
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Aktualisieren")
    }
  }

  // Während Auth lädt: Spinner anzeigen
  if (authLoading) {
    return (
      <PageContent title="User-Verwaltung" description="Lade Berechtigungen...">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="text-muted-foreground size-8 animate-spin" />
        </div>
      </PageContent>
    )
  }

  // Nicht-Admin: Zugriff verweigert (nur prüfen wenn Auth geladen)
  if (role !== "admin" && role !== "super-user") {
    return (
      <PageContent
        title="Zugriff verweigert"
        description="Diese Seite ist nur für Administratoren."
      >
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Du hast keine Berechtigung für diese Seite.</p>
        </div>
      </PageContent>
    )
  }

  return (
    <PageContent title="User-Verwaltung" description="Verwalte alle Benutzer der Anwendung">
      <div className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 text-destructive border-destructive/20 rounded-md border p-4 text-sm">
            {error}
          </div>
        )}

        {/* User Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5" />
              Benutzer
            </CardTitle>
            <div className="flex items-center gap-4">
              <ExpandableSearch
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="User suchen..."
              />
              <AddButton text="Neuer User" onClick={() => setIsAddDialogOpen(true)} />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="text-muted-foreground size-8 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Rolle</TableHead>
                    <TableHead>Erstellt</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground text-center">
                        Keine User gefunden
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((userItem) => {
                      const isEditingEmail =
                        editingField?.userId === userItem.id && editingField?.field === "email"
                      const isEditingName =
                        editingField?.userId === userItem.id &&
                        editingField?.field === "display_name"
                      const isEditingRole =
                        editingField?.userId === userItem.id && editingField?.field === "role"
                      const isCurrentUser = userItem.id === user?.id
                      const isExpanded = expandedUsers.has(userItem.id)
                      const userTenantsList = userTenants[userItem.id] || []

                      return (
                        <React.Fragment key={userItem.id}>
                          <TableRow className="hover:bg-accent/50 transition-colors">
                            {/* Expand/Collapse Button */}
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                onClick={() => toggleUserExpansion(userItem.id)}
                                title={isExpanded ? "Apps ausblenden" : "Apps anzeigen"}
                                data-ai-exempt="true"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="size-4" />
                                ) : (
                                  <ChevronRight className="size-4" />
                                )}
                              </Button>
                            </TableCell>

                            {/* E-Mail */}
                            <TableCell className="font-medium">
                              <TableInlineEdit
                                value={isEditingEmail ? editValue : userItem.email}
                                type="email"
                                isEditing={isEditingEmail}
                                onStartEdit={() =>
                                  startEditing(userItem.id, "email", userItem.email)
                                }
                                onValueChange={(val) => setEditValue(val)}
                                onSave={saveEdit}
                                onCancel={cancelEditing}
                                isSaving={isSaving}
                                disabled={isCurrentUser}
                                disabledTooltip="Eigene E-Mail kann nicht geändert werden"
                                isValid={
                                  editingField?.field === "email"
                                    ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editValue)
                                    : true
                                }
                                displayClassName="font-medium"
                              />
                            </TableCell>

                            {/* Name */}
                            <TableCell>
                              <TableInlineEdit
                                value={isEditingName ? editValue : userItem.display_name || ""}
                                type="text"
                                isEditing={isEditingName}
                                onStartEdit={() =>
                                  startEditing(
                                    userItem.id,
                                    "display_name",
                                    userItem.display_name || ""
                                  )
                                }
                                onValueChange={(val) => setEditValue(val)}
                                onSave={saveEdit}
                                onCancel={cancelEditing}
                                isSaving={isSaving}
                              />
                            </TableCell>

                            {/* Rolle */}
                            <TableCell>
                              <TableInlineEdit
                                value={isEditingRole ? editValue : userItem.role}
                                type="select"
                                isEditing={isEditingRole}
                                onStartEdit={() => startEditing(userItem.id, "role", userItem.role)}
                                onValueChange={(val) => setEditValue(val)}
                                onSave={saveEdit}
                                onCancel={cancelEditing}
                                isSaving={isSaving}
                                disabled={isCurrentUser}
                                disabledTooltip="Eigene Rolle kann nicht geändert werden"
                                selectOptions={availableRoles.map((r) => ({
                                  value: r.name,
                                  label: r.display_name,
                                }))}
                                getSelectDisplayValue={(value) => getRoleDisplayName(value)}
                                showAsBadge
                                badgeVariant={getRoleBadgeVariant(userItem.role)}
                              />
                            </TableCell>

                            {/* Erstellt */}
                            <TableCell>
                              {new Date(userItem.created_at).toLocaleDateString("de-DE")}
                            </TableCell>

                            {/* Aktionen */}
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeleteDialog(userItem)}
                                  disabled={isCurrentUser}
                                  className={cn(isCurrentUser && "opacity-50")}
                                  title={
                                    isCurrentUser
                                      ? "Eigener Account kann nicht gelöscht werden"
                                      : "User löschen"
                                  }
                                  data-ai-exempt="true"
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>

                          {/* Expandable Row: Tenant-Zuordnungen */}
                          {isExpanded && (
                            <TableRow key={`${userItem.id}-tenants`} className="bg-muted/30">
                              <TableCell colSpan={6} className="p-0">
                                <div className="border-t">
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="bg-muted/50">
                                        <TableHead className="w-64 pl-12">App-Name</TableHead>
                                        <TableHead>Slug</TableHead>
                                        <TableHead className="w-32 text-right">Status</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {tenants.length === 0 ? (
                                        <TableRow>
                                          <TableCell
                                            colSpan={3}
                                            className="text-muted-foreground pl-12 text-center"
                                          >
                                            Keine Apps verfügbar
                                          </TableCell>
                                        </TableRow>
                                      ) : (
                                        tenants.map((tenant) => {
                                          const userTenant = userTenantsList.find(
                                            (ut) => ut.tenant_id === tenant.id
                                          )
                                          const isActive = userTenant?.is_active ?? false
                                          const isAdminLocal = userItem.email === "admin@local"
                                          // Admin-Local User kann nicht deaktiviert werden
                                          const isDisabled = isCurrentUser || isAdminLocal

                                          return (
                                            <TableRow key={tenant.id} className="hover:bg-muted/30">
                                              <TableCell className="pl-12 font-medium">
                                                {tenant.name}
                                              </TableCell>
                                              <TableCell>
                                                <span className="text-muted-foreground text-sm">
                                                  {tenant.slug}
                                                </span>
                                              </TableCell>
                                              <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                  <Switch
                                                    checked={isActive}
                                                    onCheckedChange={(checked) =>
                                                      updateUserTenantActive(
                                                        userItem.id,
                                                        tenant.id,
                                                        checked
                                                      )
                                                    }
                                                    data-ai-exempt="true"
                                                    disabled={isDisabled}
                                                  />
                                                  {isAdminLocal && (
                                                    <span className="text-muted-foreground text-xs">
                                                      Immer aktiv
                                                    </span>
                                                  )}
                                                </div>
                                              </TableCell>
                                            </TableRow>
                                          )
                                        })
                                      )}
                                    </TableBody>
                                  </Table>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete User Dialog */}
      <AlertDialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>User löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du wirklich den User <strong>{deleteDialog?.email}</strong> löschen? Diese
              Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => !open && closeAddDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuen User anlegen</DialogTitle>
            <DialogDescription>Erstelle einen neuen Benutzer für die Anwendung.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-user-email">E-Mail *</Label>
              <Input
                id="new-user-email"
                type="email"
                placeholder="user@example.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                disabled={isCreating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-password">Passwort *</Label>
              <Input
                id="new-user-password"
                type="password"
                placeholder="Min. 8 Zeichen"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                disabled={isCreating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-name">Anzeigename (optional)</Label>
              <Input
                id="new-user-name"
                type="text"
                placeholder="Max Mustermann"
                value={newUserDisplayName}
                onChange={(e) => setNewUserDisplayName(e.target.value)}
                disabled={isCreating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-role">Rolle</Label>
              <Select value={newUserRole} onValueChange={setNewUserRole} disabled={isCreating}>
                <SelectTrigger id="new-user-role">
                  <SelectValue placeholder="Rolle wählen" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((r) => (
                    <SelectItem key={r.name} value={r.name}>
                      {r.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAddDialog} disabled={isCreating}>
              Abbrechen
            </Button>
            <Button onClick={handleCreateUser} disabled={isCreating}>
              {isCreating && <Loader2 className="mr-2 size-4 animate-spin" />}
              User anlegen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContent>
  )
}
