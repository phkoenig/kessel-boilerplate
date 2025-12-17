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
  created_at: string
  updated_at: string
  votes: number
  hasVoted: boolean
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

  // Lade Features mit Vote-Count und User-Vote-Status
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

      // Kombiniere Features mit Vote-Counts
      const featuresWithVotes: Feature[] = featuresData.map((feature) => {
        const voteCount = votesData?.filter((v) => v.feature_id === feature.id).length || 0
        const hasVoted = userVotedFeatureIds.has(feature.id)

        return {
          ...feature,
          votes: voteCount,
          hasVoted,
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

      // Erfolgreich erstellt - Feature zur Liste hinzufügen
      const newFeature: Feature = {
        ...data,
        votes: 0,
        hasVoted: false,
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
    planned: "bg-info/10 text-info hover:bg-info/20 border-info/20",
    "in-progress": "bg-warning/10 text-warning hover:bg-warning/20 border-warning/20",
    "under-review": "bg-primary/10 text-primary hover:bg-primary/20 border-primary/20",
    released: "bg-success/10 text-success hover:bg-success/20 border-success/20",
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
                  <TableHead className="w-32 text-center">Status</TableHead>
                  <TableHead className="w-24 text-right">Aktion</TableHead>
                  {isAdmin && <TableHead className="w-12"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFeatures.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 5 : 4} className="h-24 text-center">
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
