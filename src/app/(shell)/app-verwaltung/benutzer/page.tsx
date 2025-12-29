"use client"

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
import { Loader2, Users, Trash2 } from "lucide-react"
import { AddButton } from "@/components/ui/add-button"
import { ExpandableSearch } from "@/components/ui/expandable-search"
import { createClient } from "@/utils/supabase/client"
import { cn } from "@/lib/utils"

interface UserProfile {
  id: string
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
  is_system: boolean
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

  const supabase = createClient()

  // Lade Rollen aus DB
  async function loadRoles() {
    try {
      const { data, error: fetchError } = await supabase
        .from("roles")
        .select("*")
        .order("is_system", { ascending: false })
        .order("name")

      if (fetchError) {
        console.warn("Fehler beim Laden der Rollen:", fetchError)
        // Fallback: Standard-Rollen
        return [
          { id: "admin", name: "admin", display_name: "Administrator", is_system: true },
          { id: "user", name: "user", display_name: "Benutzer", is_system: true },
        ] as Role[]
      }

      return (data || []) as Role[]
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
      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })

      if (fetchError) {
        setError(fetchError.message)
        return
      }

      setUsers(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Laden der User")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (role === "admin" || role === "super-user") {
      setIsLoading(true)
      Promise.all([loadRoles(), loadUsers()]).then(([roles]) => {
        setAvailableRoles(roles)
        // setIsLoading(false) wird in loadUsers finally aufgerufen, aber loadRoles ist auch async
        // loadUsers setzt isLoading am Ende auf false.
        // Das ist okay, solange loadUsers als zweites läuft oder wir hier warten.
        // loadUsers setzt isLoading=true am Anfang.
        // Besser: Wir steuern Loading hier zentraler oder lassen loadUsers es machen.
        // Da loadUsers selbst isLoading steuert, ist es okay.
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadUsers/loadRoles sind stabil
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
      if (editingField.field === "email") {
        // E-Mail über Auth API ändern (benötigt Service Role)
        const response = await fetch("/api/admin/update-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: editingField.userId,
            email: editValue,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Fehler beim Ändern der E-Mail")
        }
      } else {
        // Name oder Rolle direkt in profiles ändern
        const updateData: { display_name?: string | null; role?: string; role_id?: string } = {}
        if (editingField.field === "display_name") {
          updateData.display_name = editValue.trim() || null
        } else if (editingField.field === "role") {
          updateData.role = editValue
          // WICHTIG: Auch role_id synchron aktualisieren
          const selectedRole = availableRoles.find((r) => r.name === editValue)
          if (selectedRole) {
            updateData.role_id = selectedRole.id
          }
        }

        const { error: updateError } = await supabase
          .from("profiles")
          .update(updateData)
          .eq("id", editingField.userId)

        if (updateError) throw updateError
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
        body: JSON.stringify({ userId: deleteDialog.id }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Fehler beim Löschen des Users")
      }

      // Entferne User aus lokaler Liste
      setUsers((prev) => prev.filter((u) => u.id !== deleteDialog.id))
      setDeleteDialog(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Löschen des Users")
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

    if (!newUserPassword || newUserPassword.length < 6) {
      setError("Passwort muss mindestens 6 Zeichen haben")
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
          <div className="bg-destructive/10 text-destructive border-destructive/20 rounded-md border p-3 text-sm">
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
                      <TableCell colSpan={5} className="text-muted-foreground text-center">
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

                      return (
                        <TableRow
                          key={userItem.id}
                          className="hover:bg-accent/50 transition-colors"
                        >
                          {/* E-Mail */}
                          <TableCell className="font-medium">
                            <TableInlineEdit
                              value={isEditingEmail ? editValue : userItem.email}
                              type="email"
                              isEditing={isEditingEmail}
                              onStartEdit={() => startEditing(userItem.id, "email", userItem.email)}
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
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
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
                placeholder="Min. 6 Zeichen"
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
