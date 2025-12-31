"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useTheme } from "@/lib/themes"
import { useThemeEditor } from "@/hooks/use-theme-editor"

/**
 * SaveThemeDialog Props
 */
interface SaveThemeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: (themeId: string) => void
}

/**
 * Dialog zum Speichern eines Themes als neues Theme
 */
export function SaveThemeDialog({
  open,
  onOpenChange,
  onSaved,
}: SaveThemeDialogProps): React.ReactElement {
  const { refreshThemes, setTheme } = useTheme()
  const { saveAsNewTheme, isDirty, baseThemeId } = useThemeEditor()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setName("")
      setDescription("")
      setError(null)
    }
  }, [open])

  // Listen for AI-triggered save requests
  useEffect(() => {
    const handleSaveRequest = (event: CustomEvent<{ name: string; description?: string }>) => {
      setName(event.detail.name)
      if (event.detail.description) {
        setDescription(event.detail.description)
      }
      // Dialog wird bereits geöffnet wenn AI das Tool aufruft
    }

    window.addEventListener("theme-save-request", handleSaveRequest as EventListener)
    return () => {
      window.removeEventListener("theme-save-request", handleSaveRequest as EventListener)
    }
  }, [])

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Bitte gib einen Namen für das Theme ein")
      return
    }

    if (!isDirty) {
      setError("Es gibt keine Änderungen zum Speichern")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const themeId = await saveAsNewTheme(name.trim(), description.trim() || undefined)
      await refreshThemes()
      setTheme(themeId)
      onOpenChange(false)
      onSaved?.(themeId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Speichern des Themes")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Theme speichern</DialogTitle>
          <DialogDescription>
            Speichere deine Änderungen als neues Theme. Das bestehende Theme &quot;
            {baseThemeId}&quot; wird nicht überschrieben.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme-name">Theme-Name *</Label>
            <Input
              id="theme-name"
              placeholder="z.B. Sunset, Ocean Warm..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="theme-description">Beschreibung (optional)</Label>
            <Textarea
              id="theme-description"
              placeholder="Kurze Beschreibung des Themes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>
          {error && (
            <div className="bg-destructive/10 text-destructive border-destructive/20 rounded-md border p-4 text-sm">
              {error}
            </div>
          )}
          {!isDirty && (
            <div className="bg-muted text-muted-foreground rounded-md p-4 text-sm">
              Es gibt keine ungespeicherten Änderungen.
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !name.trim() || !isDirty}>
            {isLoading ? "Speichere..." : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
