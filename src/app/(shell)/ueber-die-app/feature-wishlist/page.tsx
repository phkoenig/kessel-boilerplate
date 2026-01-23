"use client"

import { useEffect, useState } from "react"
import { PageContent } from "@/components/shell"
import { Lightbulb, ArrowUp, ThumbsUp, Check, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/components/auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/utils/supabase/client"
import { cn } from "@/lib/utils"

type FeatureStatus = "planned" | "in-progress" | "under-review" | "released"

interface Feature {
  id: string
  title: string
  description: string | null
  status: FeatureStatus
  proposer_id: string | null
  proposer_name: string | null
  created_at: string
  updated_at: string
  votes: number
  hasVoted: boolean
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
 * Feature-Wishlist Seite
 */
export default function FeaturesPage(): React.ReactElement {
  const { user, role } = useAuth()
  const isAdmin = role === "admin" || role === "super-user"

  const [features, setFeatures] = useState<Feature[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  // Add Feature Dialog State
  const [newFeatureTitle, setNewFeatureTitle] = useState("")
  const [newFeatureDescription, setNewFeatureDescription] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  // Delete Dialog State
  const [deleteDialog, setDeleteDialog] = useState<Feature | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const supabase = createClient()

  // Lade Features mit Vote-Count, User-Vote-Status und Proposer-Namen
  async function loadFeatures() {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      // Lade Features
      const { data: featuresData, error: featuresError } = await supabase
        .from("features")
        .select("*")
        .order("created_at", { ascending: false })

      if (featuresError) {
        setError(featuresError.message)
        return
      }

      if (!featuresData || featuresData.length === 0) {
        setFeatures([])
        return
      }

      // Lade Vote-Counts für alle Features
      const featureIds = featuresData.map((f) => f.id)
      const { data: votesData, error: votesError } = await supabase
        .from("feature_votes")
        .select("feature_id, user_id")
        .in("feature_id", featureIds)

      if (votesError) {
        console.warn("Fehler beim Laden der Votes:", votesError)
      }

      // Lade User-Votes (welche Features hat der User gevotet?)
      const { data: userVotesData } = await supabase
        .from("feature_votes")
        .select("feature_id")
        .eq("user_id", user.id)

      const userVotedFeatureIds = new Set((userVotesData || []).map((v) => v.feature_id))

      // Lade Proposer-Namen via separater Query
      const proposerIds = [...new Set(featuresData.map((f) => f.proposer_id).filter(Boolean))]
      let profilesMap: Record<string, string> = {}

      if (proposerIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, display_name, email")
          .in("id", proposerIds)

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

      // Kombiniere Features mit Vote-Counts und Proposer-Namen
      const featuresWithVotes: Feature[] = featuresData.map((feature) => {
        const voteCount = votesData?.filter((v) => v.feature_id === feature.id).length || 0
        const hasVoted = userVotedFeatureIds.has(feature.id)

        return {
          ...feature,
          votes: voteCount,
          hasVoted,
          proposer_name: feature.proposer_id ? profilesMap[feature.proposer_id] || null : null,
        } as Feature
      })

      setFeatures(featuresWithVotes)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Laden der Features")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadFeatures()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Neues Feature erstellen
  async function handleAddFeature() {
    if (!newFeatureTitle.trim()) {
      setError("Bitte gib einen Feature-Titel ein")
      return
    }

    if (!user) {
      setError("Du musst eingeloggt sein, um ein Feature vorzuschlagen")
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const { data, error: insertError } = await supabase
        .from("features")
        .insert({
          title: newFeatureTitle.trim(),
          description: newFeatureDescription.trim() || null,
          proposer_id: user.id,
        })
        .select()
        .single()

      if (insertError) {
        throw new Error(insertError.message)
      }

      // Erfolgreich erstellt - Feature zur Liste hinzufügen mit Proposer-Name
      const newFeature: Feature = {
        ...data,
        votes: 0,
        hasVoted: false,
        proposer_name: user.email || null,
      } as Feature

      setFeatures((prev) => [newFeature, ...prev])
      setIsAddDialogOpen(false)
      // Form zurücksetzen
      setNewFeatureTitle("")
      setNewFeatureDescription("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Erstellen des Features")
    } finally {
      setIsCreating(false)
    }
  }

  // Vote/Unvote Toggle
  async function handleVote(featureId: string) {
    if (!user) {
      setError("Du musst eingeloggt sein, um zu voten")
      return
    }

    const feature = features.find((f) => f.id === featureId)
    if (!feature) return

    try {
      if (feature.hasVoted) {
        // Unvote: Vote löschen
        const { error: deleteError } = await supabase
          .from("feature_votes")
          .delete()
          .eq("feature_id", featureId)
          .eq("user_id", user.id)

        if (deleteError) {
          throw new Error(deleteError.message)
        }

        // Lokalen State aktualisieren
        setFeatures((prev) =>
          prev.map((f) =>
            f.id === featureId ? { ...f, hasVoted: false, votes: Math.max(0, f.votes - 1) } : f
          )
        )
      } else {
        // Vote: Vote hinzufügen
        const { error: insertError } = await supabase.from("feature_votes").insert({
          feature_id: featureId,
          user_id: user.id,
        })

        if (insertError) {
          throw new Error(insertError.message)
        }

        // Lokalen State aktualisieren
        setFeatures((prev) =>
          prev.map((f) => (f.id === featureId ? { ...f, hasVoted: true, votes: f.votes + 1 } : f))
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Voten")
    }
  }

  // Status ändern (nur Admins)
  async function handleStatusChange(id: string, newStatus: FeatureStatus) {
    if (!isAdmin) return

    try {
      const { error: updateError } = await supabase
        .from("features")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", id)

      if (updateError) {
        setError(updateError.message)
        return
      }

      // Lokalen State aktualisieren
      setFeatures((prev) => prev.map((f) => (f.id === id ? { ...f, status: newStatus } : f)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Ändern des Status")
    }
  }

  // Feature löschen (nur Admins)
  async function handleDelete() {
    if (!deleteDialog || !isAdmin) return

    setIsDeleting(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from("features")
        .delete()
        .eq("id", deleteDialog.id)

      if (deleteError) {
        throw new Error(deleteError.message)
      }

      // Lokalen State aktualisieren
      setFeatures((prev) => prev.filter((f) => f.id !== deleteDialog.id))
      setDeleteDialog(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Löschen des Features")
    } finally {
      setIsDeleting(false)
    }
  }

  const statusColors: Record<string, string> = {
    planned: "bg-chart-3/10 text-chart-3 hover:bg-chart-3/20 border-chart-3/20",
    "in-progress": "bg-chart-2/10 text-chart-2 hover:bg-chart-2/20 border-chart-2/20",
    "under-review": "bg-primary/10 text-primary hover:bg-primary/20 border-primary/20",
    released: "bg-chart-1/10 text-chart-1 hover:bg-chart-1/20 border-chart-1/20",
  }

  const statusLabels: Record<string, string> = {
    planned: "Geplant",
    "in-progress": "In Arbeit",
    "under-review": "In Prüfung",
    released: "Veröffentlicht",
  }

  const filteredFeatures = features.filter(
    (f) =>
      f.status !== "released" &&
      (f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.description || "").toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <PageContent title="Feature-Wishlist" description="Vote für Features, die du dir wünschst">
      {error && (
        <div className="bg-destructive/10 text-destructive border-destructive/20 mb-6 rounded-lg border p-4">
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="size-5" />
            <CardTitle>Geplante Features</CardTitle>
          </div>
          <div className="flex items-center gap-4">
            <ExpandableSearch
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Suche Features..."
            />
            <AddButton text="Neues Feature" onClick={() => setIsAddDialogOpen(true)} />
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
                  <TableHead className="w-24 text-center">Votes</TableHead>
                  <TableHead>Feature</TableHead>
                  <TableHead>Vorgeschlagen von</TableHead>
                  <TableHead>Datum / Uhrzeit</TableHead>
                  <TableHead className="w-32 text-center">Status</TableHead>
                  <TableHead className="w-24 text-right">Aktion</TableHead>
                  {isAdmin && <TableHead className="w-12"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFeatures.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 7 : 6} className="h-24 text-center">
                      Keine Features gefunden.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFeatures.map((feature) => (
                    <TableRow key={feature.id} className="hover:bg-accent/50 transition-colors">
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <ArrowUp
                            className={cn(
                              "size-4 transition-colors",
                              feature.hasVoted ? "text-primary" : "text-muted-foreground"
                            )}
                          />
                          <span
                            className={cn(
                              "font-semibold",
                              feature.hasVoted && "text-primary font-bold"
                            )}
                          >
                            {feature.votes}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{feature.title}</span>
                          {feature.description && (
                            <span className="text-muted-foreground text-sm">
                              {feature.description}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {feature.proposer_name || "Unbekannt"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {formatDateTime(feature.created_at)}
                      </TableCell>
                      <TableCell className="text-center">
                        {isAdmin ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger className="focus:outline-none">
                              <Badge
                                variant="secondary"
                                className={cn(
                                  "cursor-pointer transition-opacity hover:opacity-80",
                                  statusColors[feature.status]
                                )}
                              >
                                {statusLabels[feature.status]}
                              </Badge>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {Object.entries(statusLabels).map(([key, label]) => (
                                <DropdownMenuItem
                                  key={key}
                                  onClick={() =>
                                    handleStatusChange(feature.id, key as FeatureStatus)
                                  }
                                  className="flex items-center justify-between"
                                >
                                  {label}
                                  {feature.status === key && <Check className="ml-2 size-4" />}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Badge variant="secondary" className={statusColors[feature.status]}>
                            {statusLabels[feature.status]}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant={feature.hasVoted ? "default" : "ghost"}
                          size="sm"
                          onClick={() => handleVote(feature.id)}
                          className={cn(
                            feature.hasVoted && "bg-primary/20 text-primary hover:bg-primary/30"
                          )}
                          data-ai-exempt="true"
                        >
                          <ThumbsUp
                            className={cn("mr-2 size-4", feature.hasVoted && "fill-current")}
                          />
                          {feature.hasVoted ? "Gevotet" : "Vote"}
                        </Button>
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteDialog(feature)}
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

      {/* Add Feature Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Feature vorschlagen</DialogTitle>
            <DialogDescription>
              Hast du eine Idee für ein neues Feature? Beschreibe es uns!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                placeholder="Kurzer, prägnanter Titel"
                value={newFeatureTitle}
                onChange={(e) => setNewFeatureTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                placeholder="Was soll das Feature können und warum ist es nützlich?"
                rows={4}
                value={newFeatureDescription}
                onChange={(e) => setNewFeatureDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false)
                setNewFeatureTitle("")
                setNewFeatureDescription("")
              }}
              disabled={isCreating}
            >
              Abbrechen
            </Button>
            <Button onClick={handleAddFeature} disabled={isCreating || !newFeatureTitle.trim()}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Wird gespeichert...
                </>
              ) : (
                "Vorschlag einreichen"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Feature löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du das Feature &quot;{deleteDialog?.title}&quot; wirklich löschen? Diese
              Aktion kann nicht rückgängig gemacht werden.
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
