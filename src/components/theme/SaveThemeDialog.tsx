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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useTheme } from "@/lib/themes"
import { useThemeEditor } from "@/hooks/use-theme-editor"
import { updateTheme } from "@/lib/themes/storage"

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
  const { refreshThemes, setTheme, refreshThemeCSS } = useTheme()
  const { saveAsNewTheme, isDirty, baseThemeId, pendingChanges, resetPreview, getCurrentTokens } =
    useThemeEditor()
  const [saveMode, setSaveMode] = useState<"overwrite" | "new">("new")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isDefaultTheme = baseThemeId === "default"

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setName("")
      setDescription("")
      setError(null)
      setSaveMode(isDefaultTheme ? "new" : "new") // Default immer "new"
    }
  }, [open, isDefaultTheme])

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
    if (saveMode === "new" && !name.trim()) {
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
      if (saveMode === "overwrite") {
        // WICHTIG: Beim Überschreiben müssen wir ALLE aktuellen Token-Werte speichern.
        // Wir lesen ALLE Token aus dem DOM (getCurrentTokens), da diese das vollständige
        // aktive Theme widerspiegeln (inkl. Basis-Theme + CSS-Overrides).
        // pendingChanges enthält die Änderungen dieser Session, die wir darauf anwenden.

        // DEBUG: Log pending changes
        console.log("[SaveThemeDialog] baseThemeId:", baseThemeId)
        console.log("[SaveThemeDialog] pendingChanges size:", pendingChanges.size)
        console.log("[SaveThemeDialog] pendingChanges:", Object.fromEntries(pendingChanges))

        // Hole ALLE aktuellen Token-Werte aus dem DOM
        // getCurrentTokens() liest die berechneten CSS-Werte aus dem Browser
        const currentTokens = getCurrentTokens()
        console.log("[SaveThemeDialog] currentTokens keys:", Object.keys(currentTokens).length)

        // Konvertiere zu Map und merge mit pendingChanges
        const allTokens: Map<string, { light: string; dark: string }> = new Map()

        // Bestimme ob wir im Dark Mode sind
        const isDarkMode = document.documentElement.classList.contains("dark")
        console.log("[SaveThemeDialog] isDarkMode:", isDarkMode)

        // getCurrentTokens gibt nur den aktuellen Mode zurück (light ODER dark)
        // Wir müssen beide Modi speichern - verwende pendingChanges für die korrekten Werte
        Object.entries(currentTokens).forEach(([tokenName, value]) => {
          // Wenn pendingChanges einen Wert hat, nutze diesen (hat light UND dark)
          const pending = pendingChanges.get(tokenName)
          if (pending) {
            allTokens.set(tokenName, pending)
          } else {
            // Ansonsten: getCurrentTokens hat nur den aktuellen Mode-Wert
            // Wir setzen denselben Wert für beide Modi (vereinfacht, aber besser als nichts)
            const currentValue = isDarkMode ? value.dark : value.light
            if (currentValue) {
              allTokens.set(tokenName, { light: currentValue, dark: currentValue })
            }
          }
        })

        console.log("[SaveThemeDialog] allTokens size after merge:", allTokens.size)

        // Generiere CSS
        const lightTokens: string[] = []
        const darkTokens: string[] = []

        allTokens.forEach((value, tokenName) => {
          if (value.light) {
            lightTokens.push(`  ${tokenName}: ${value.light};`)
          }
          if (value.dark) {
            darkTokens.push(`  ${tokenName}: ${value.dark};`)
          }
        })

        const lightCSS = `[data-theme="${baseThemeId}"] {\n${lightTokens.join("\n")}\n}`
        const darkCSS = `.dark[data-theme="${baseThemeId}"] {\n${darkTokens.join("\n")}\n}`

        console.log("[SaveThemeDialog] lightCSS:", lightCSS)
        console.log("[SaveThemeDialog] darkCSS:", darkCSS)

        const result = await updateTheme(baseThemeId!, {
          lightCSS,
          darkCSS,
          description: description.trim() || undefined,
        })
        console.log("[SaveThemeDialog] updateTheme result:", result)

        if (!result.success) {
          throw new Error(result.error)
        }

        // Reset Preview BEVOR refreshThemes (kann Fehler werfen)
        resetPreview()

        try {
          await refreshThemes()
          // CSS neu laden mit Cache-Buster um Browser-Cache zu umgehen
          await refreshThemeCSS()
        } catch (refreshError) {
          // refreshThemes Fehler ignorieren - Theme wurde bereits gespeichert
          console.warn("Fehler beim Aktualisieren der Theme-Liste:", refreshError)
        }
      } else {
        const themeId = await saveAsNewTheme(name.trim(), description.trim() || undefined)
        // resetPreview wird bereits in saveAsNewTheme aufgerufen

        try {
          await refreshThemes()
          setTheme(themeId)
          // CSS des neuen Themes laden
          await refreshThemeCSS()
          onSaved?.(themeId)
        } catch (refreshError) {
          // refreshThemes Fehler ignorieren - Theme wurde bereits gespeichert
          console.warn("Fehler beim Aktualisieren der Theme-Liste:", refreshError)
        }
      }

      // Dialog immer schließen wenn Speichern erfolgreich war
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Speichern des Themes")
      // Dialog bleibt offen bei Fehler, damit Benutzer die Fehlermeldung sieht
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
            Wähle, ob du das aktuelle Theme überschreiben oder als neues Theme speichern möchtest.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <RadioGroup value={saveMode} onValueChange={(v) => setSaveMode(v as "overwrite" | "new")}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="overwrite" id="overwrite" disabled={isDefaultTheme} />
              <Label
                htmlFor="overwrite"
                className={
                  isDefaultTheme ? "text-muted-foreground cursor-not-allowed" : "cursor-pointer"
                }
              >
                Aktuelles Theme überschreiben
                {isDefaultTheme && " (nicht für Default-Theme)"}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="new" id="new" />
              <Label htmlFor="new" className="cursor-pointer">
                Als neues Theme speichern
              </Label>
            </div>
          </RadioGroup>

          {saveMode === "new" && (
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
          )}
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
          <Button
            onClick={handleSave}
            disabled={isLoading || (saveMode === "new" && !name.trim()) || !isDirty}
          >
            {isLoading ? "Speichere..." : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
