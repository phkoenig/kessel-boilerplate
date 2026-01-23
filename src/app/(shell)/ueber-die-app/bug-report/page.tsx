"use client"

import { useEffect, useState } from "react"
import { PageContent } from "@/components/shell"
import { Bug, AlertCircle, CheckCircle, Clock, Check, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AddButton } from "@/components/ui/add-button"
import { ExpandableSearch } from "@/components/ui/expandable-search"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { useAuth } from "@/components/auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/utils/supabase/client"
import { cn } from "@/lib/utils"

type BugStatus = "open" | "in-progress" | "fixed"
type Severity = "critical" | "high" | "medium" | "low"

interface BugReport {
  id: string
  title: string
  description: string | null
  severity: Severity
  status: BugStatus
  browser_info: string | null
  reporter_id: string | null
  reporter_name: string | null
  created_at: string
  updated_at: string
}

/**
 * Formatiert ein Datum zu Datum + Uhrzeit (z.B. "28.12.2025, 09:45")
 */
function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Bug-Report Seite
 */
export default function BugsPage(): React.ReactElement {
  const { user, role } = useAuth()
  const isAdmin = role === "admin" || role === "super-user"

  const [bugs, setBugs] = useState<BugReport[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  // Add Bug Dialog State
  const [newBugTitle, setNewBugTitle] = useState("")
  const [newBugSeverity, setNewBugSeverity] = useState<Severity>("medium")
  const [newBugDescription, setNewBugDescription] = useState("")
  const [newBugBrowserInfo, setNewBugBrowserInfo] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  // Delete Dialog State
  const [deleteDialog, setDeleteDialog] = useState<BugReport | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const supabase = createClient()

  // Lade Bugs aus Supabase mit Reporter-Namen via separater Query
  async function loadBugs() {
    setIsLoading(true)
    setError(null)

    try {
      // 1. Bugs laden
      const { data: bugsData, error: fetchError } = await supabase
        .from("bugs")
        .select("*")
        .order("created_at", { ascending: false })

      if (fetchError) {
        setError(fetchError.message)
        return
      }

      if (!bugsData || bugsData.length === 0) {
        setBugs([])
        return
      }

      // 2. Reporter-IDs sammeln und Profile laden
      const reporterIds = [...new Set(bugsData.map((b) => b.reporter_id).filter(Boolean))]

      let profilesMap: Record<string, string> = {}

      if (reporterIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, display_name, email")
          .in("id", reporterIds)

        if (profilesData) {
          profilesMap = profilesData.reduce(
            (acc, profile) => {
              acc[profile.id] = profile.display_name || profile.email || "Unbekannt"
              return acc
            },
            {} as Record<string, string>
          )
        }
      }

      // 3. Bugs mit Reporter-Namen kombinieren
      const bugsWithReporter = bugsData.map((bug) => ({
        ...bug,
        reporter_name: bug.reporter_id ? profilesMap[bug.reporter_id] || null : null,
      })) as BugReport[]

      setBugs(bugsWithReporter)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Laden der Bugs")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadBugs()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Neuen Bug erstellen
  async function handleAddBug() {
    if (!newBugTitle.trim()) {
      setError("Bitte gib einen Bug-Titel ein")
      return
    }

    if (!user) {
      setError("Du musst eingeloggt sein, um einen Bug zu melden")
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const { data, error: insertError } = await supabase
        .from("bugs")
        .insert({
          title: newBugTitle.trim(),
          description: newBugDescription.trim() || null,
          severity: newBugSeverity,
          browser_info: newBugBrowserInfo.trim() || null,
          reporter_id: user.id,
        })
        .select()
        .single()

      if (insertError) {
        throw new Error(insertError.message)
      }

      // Erfolgreich erstellt - mit Reporter-Name ergänzen
      const newBug: BugReport = {
        ...(data as BugReport),
        reporter_name: user.email || null,
      }
      setBugs((prev) => [newBug, ...prev])
      setIsAddDialogOpen(false)
      // Form zurücksetzen
      setNewBugTitle("")
      setNewBugDescription("")
      setNewBugBrowserInfo("")
      setNewBugSeverity("medium")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Erstellen des Bugs")
    } finally {
      setIsCreating(false)
    }
  }

  // Status ändern (nur Admins)
  async function handleStatusChange(id: string, newStatus: BugStatus) {
    if (!isAdmin) return

    try {
      const { error: updateError } = await supabase
        .from("bugs")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", id)

      if (updateError) {
        setError(updateError.message)
        return
      }

      // Lokalen State aktualisieren
      setBugs((prev) => prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Ändern des Status")
    }
  }

  // Bug löschen (nur Admins)
  async function handleDelete() {
    if (!deleteDialog || !isAdmin) return

    setIsDeleting(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase.from("bugs").delete().eq("id", deleteDialog.id)

      if (deleteError) {
        throw new Error(deleteError.message)
      }

      // Lokalen State aktualisieren
      setBugs((prev) => prev.filter((b) => b.id !== deleteDialog.id))
      setDeleteDialog(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Löschen des Bugs")
    } finally {
      setIsDeleting(false)
    }
  }

  const statusIcons: Record<string, React.ReactNode> = {
    open: <AlertCircle className="size-4" />,
    "in-progress": <Clock className="size-4" />,
    fixed: <CheckCircle className="size-4" />,
  }

  const statusColors: Record<string, string> = {
    open: "bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20",
    "in-progress": "bg-chart-2/10 text-chart-2 hover:bg-chart-2/20 border-chart-2/20",
    fixed: "bg-chart-1/10 text-chart-1 hover:bg-chart-1/20 border-chart-1/20",
  }

  const statusLabels: Record<string, string> = {
    open: "Offen",
    "in-progress": "In Bearbeitung",
    fixed: "Behoben",
  }

  const severityColors: Record<string, string> = {
    critical: "text-destructive font-bold",
    high: "text-destructive",
    medium: "text-chart-2",
    low: "text-muted-foreground",
  }

  const severityLabels: Record<string, string> = {
    critical: "Kritisch",
    high: "Hoch",
    medium: "Mittel",
    low: "Niedrig",
  }

  const filteredBugs = bugs.filter(
    (b) => b.status !== "fixed" && b.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <PageContent title="Bug-Report" description="Melde Fehler und hilf uns, die App zu verbessern">
      {error && (
        <div className="bg-destructive/10 text-destructive border-destructive/20 mb-6 rounded-lg border p-4">
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Bug className="size-5" />
            <CardTitle>Bekannte Fehler</CardTitle>
          </div>
          <div className="flex items-center gap-4">
            <ExpandableSearch
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Suche Bugs..."
            />
            <AddButton text="Bug melden" onClick={() => setIsAddDialogOpen(true)} />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="text-muted-foreground size-6 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bug</TableHead>
                  <TableHead>Schweregrad</TableHead>
                  <TableHead>Gemeldet von</TableHead>
                  <TableHead>Datum / Uhrzeit</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  {isAdmin && <TableHead className="w-12"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBugs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 6 : 5} className="h-24 text-center">
                      Keine offenen Bugs gefunden.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBugs.map((bug) => (
                    <TableRow key={bug.id} className="hover:bg-accent/50 transition-colors">
                      <TableCell className="font-medium">{bug.title}</TableCell>
                      <TableCell>
                        <span className={cn("text-xs", severityColors[bug.severity])}>
                          {severityLabels[bug.severity]}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {bug.reporter_name || "Unbekannt"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {formatDateTime(bug.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        {isAdmin ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger className="focus:outline-none">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "cursor-pointer gap-1 transition-opacity hover:opacity-80",
                                  statusColors[bug.status]
                                )}
                              >
                                {statusIcons[bug.status]}
                                {statusLabels[bug.status]}
                              </Badge>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {Object.entries(statusLabels).map(([key, label]) => (
                                <DropdownMenuItem
                                  key={key}
                                  onClick={() => handleStatusChange(bug.id, key as BugStatus)}
                                  className="flex items-center justify-between"
                                >
                                  {label}
                                  {bug.status === key && <Check className="ml-2 size-4" />}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <div className="flex items-center justify-end">
                            <Badge
                              variant="outline"
                              className={cn("gap-1", statusColors[bug.status])}
                            >
                              {statusIcons[bug.status]}
                              {statusLabels[bug.status]}
                            </Badge>
                          </div>
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteDialog(bug)}
                            className="text-destructive hover:text-destructive"
                            data-ai-exempt="true"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Bug Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bug melden</DialogTitle>
            <DialogDescription>Beschreibe das Problem so genau wie möglich.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bug-title">Bug-Titel *</Label>
              <Input
                id="bug-title"
                placeholder="Kurze Beschreibung des Bugs"
                value={newBugTitle}
                onChange={(e) => setNewBugTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="severity">Schweregrad</Label>
              <Select
                value={newBugSeverity}
                onValueChange={(value) => setNewBugSeverity(value as Severity)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Schweregrad wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Kritisch - App nicht nutzbar</SelectItem>
                  <SelectItem value="high">Hoch - Wichtige Funktion betroffen</SelectItem>
                  <SelectItem value="medium">Mittel - Umgehung möglich</SelectItem>
                  <SelectItem value="low">Niedrig - Kosmetisches Problem</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="steps">Schritte zur Reproduktion</Label>
              <Textarea
                id="steps"
                placeholder="1. Gehe zu...&#10;2. Klicke auf...&#10;3. Erwartetes Verhalten:&#10;4. Tatsächliches Verhalten:"
                rows={6}
                value={newBugDescription}
                onChange={(e) => setNewBugDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="browser">Browser / Gerät</Label>
              <Input
                id="browser"
                placeholder="z.B. Chrome 120, Windows 11"
                value={newBugBrowserInfo}
                onChange={(e) => setNewBugBrowserInfo(e.target.value)}
              />
            </div>

            <div className="border-border bg-muted/50 rounded-lg border p-4 text-xs">
              <strong>Tipp:</strong> Screenshots und Browser-Informationen sind besonders hilfreich.
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false)
                setNewBugTitle("")
                setNewBugDescription("")
                setNewBugBrowserInfo("")
                setNewBugSeverity("medium")
              }}
              disabled={isCreating}
            >
              Abbrechen
            </Button>
            <Button onClick={handleAddBug} disabled={isCreating || !newBugTitle.trim()}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Wird gespeichert...
                </>
              ) : (
                <>
                  <Bug className="mr-2 size-4" />
                  Bug melden
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bug löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du den Bug &quot;{deleteDialog?.title}&quot; wirklich löschen? Diese Aktion
              kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Wird gelöscht...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 size-4" />
                  Löschen
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContent>
  )
}
