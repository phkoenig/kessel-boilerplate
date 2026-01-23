"use client"

import { useState, useEffect } from "react"
import { PageContent, PageHeader } from "@/components/shell"
import { useExplorer } from "@/components/shell"
import { Palette, Sun, Moon, Edit, Trash2 } from "lucide-react"
import { useTheme as useColorMode } from "next-themes"
import { Button } from "@/components/ui/button"
import { AddButton } from "@/components/ui/add-button"
import { ExpandableSearch } from "@/components/ui/expandable-search"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useTheme, type ThemeMeta } from "@/lib/themes"
import { cn } from "@/lib/utils"
import { AIInteractable } from "@/components/ai/AIInteractable"

/**
 * Theme Management Seite
 *
 * Zeigt das aktive Design-System mit Farbpaletten, Typografie,
 * Rundungen und Schatten. Ermöglicht Theme-Verwaltung und Light/Dark Mode.
 */
export default function ThemeManagementPage(): React.ReactElement {
  const { theme: currentThemeId, setTheme, themes: contextThemes, refreshThemes } = useTheme()
  const { theme: colorMode, setTheme: setColorMode, resolvedTheme } = useColorMode()
  const { setOpen: setExplorerOpen } = useExplorer()

  // Warte auf Client-Mount, um Hydration-Mismatch zu vermeiden
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Theme-Verwaltung State
  const [themes, setThemes] = useState<ThemeMeta[]>(contextThemes)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState<ThemeMeta | null>(null)
  const [importText, setImportText] = useState("")
  const [importName, setImportName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Synchronisiere mit Context-Themes
  useEffect(() => {
    setThemes(contextThemes)
  }, [contextThemes])

  // Explorer für diese Seite deaktivieren
  useEffect(() => {
    const timer = setTimeout(() => {
      setExplorerOpen(false)
    }, 50)
    return () => clearTimeout(timer)
  }, [setExplorerOpen])

  // Theme-Verwaltung Handler
  const handleDeleteTheme = async (themeId: string) => {
    if (themeId === "default") return

    setIsLoading(true)
    try {
      const response = await fetch("/api/themes/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeId }),
      })

      if (!response.ok) {
        throw new Error("Fehler beim Löschen des Themes")
      }

      if (currentThemeId === themeId) {
        setTheme("default")
      }

      await refreshThemes()
    } catch (error) {
      console.error("Fehler beim Löschen:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditTheme = (theme: ThemeMeta) => {
    setSelectedTheme({ ...theme })
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedTheme) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/themes/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          themeId: selectedTheme.id,
          name: selectedTheme.name,
          description: selectedTheme.description,
        }),
      })

      if (!response.ok) {
        throw new Error("Fehler beim Speichern des Themes")
      }

      setIsEditDialogOpen(false)
      setSelectedTheme(null)
      await refreshThemes()
    } catch (error) {
      console.error("Fehler beim Speichern:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTweakCNImport = async () => {
    if (!importText.trim() || !importName.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/themes/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ css: importText, name: importName.trim() }),
      })

      if (response.ok) {
        const data = await response.json()
        setIsImportDialogOpen(false)
        setImportText("")
        setImportName("")
        await refreshThemes()

        // Aktiviere das neu importierte Theme
        if (data.theme?.id) {
          setTheme(data.theme.id)
        }
      }
    } catch (error) {
      console.error("Import error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Dark Mode ist aktiv wenn:
  // - colorMode explizit "dark" ist, ODER
  // - colorMode "system" ist UND das System Dark Mode verwendet (resolvedTheme === "dark")
  // Während SSR (mounted === false) verwenden wir einen sicheren Fallback
  const isDarkMode = mounted
    ? colorMode === "dark" || (colorMode === "system" && resolvedTheme === "dark")
    : false // Fallback für SSR

  // Filter Themes
  const filteredThemes = themes.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <PageContent>
      {/* Header mit Dark Mode Switch */}
      <div className="mb-8 flex items-start justify-between">
        <PageHeader
          title="Theme Management"
          description="Verwalte Themes und passe das Erscheinungsbild der App an deine Vorlieben an"
        />

        {/* Dark/Light Mode Switch */}
        {mounted && (
          <AIInteractable
            id="theme-dark-mode-toggle"
            action="toggle"
            description="Schaltet zwischen Dark Mode und Light Mode um"
            keywords={[
              "dark mode",
              "light mode",
              "theme",
              "appearance",
              "design",
              "dunkel",
              "hell",
              "farbschema",
              "nachtmodus",
              "dark",
              "light",
            ]}
            category="settings"
          >
            <div
              className="group inline-flex items-center gap-2"
              data-state={isDarkMode ? "checked" : "unchecked"}
            >
              <Sun
                className="text-muted-foreground group-data-[state=checked]:text-muted-foreground/50 group-data-[state=unchecked]:text-foreground size-4 cursor-pointer transition-colors"
                onClick={() => setColorMode("light")}
              />
              <Switch
                checked={isDarkMode}
                onCheckedChange={(checked) => setColorMode(checked ? "dark" : "light")}
                aria-label="Dark Mode umschalten"
              />
              <Moon
                className="text-muted-foreground group-data-[state=unchecked]:text-muted-foreground/50 group-data-[state=checked]:text-foreground size-4 cursor-pointer transition-colors"
                onClick={() => setColorMode("dark")}
              />
            </div>
          </AIInteractable>
        )}
      </div>

      <div className="space-y-8">
        {/* Theme-Verwaltung */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Palette className="size-5" />
                Verfügbare Themes
              </CardTitle>
            </div>
            <div className="flex items-center gap-4">
              <ExpandableSearch
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Suche Themes..."
              />
              <AddButton text="Neues Theme" onClick={() => setIsImportDialogOpen(true)} />
            </div>
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Theme von TweakCN importieren</DialogTitle>
                  <DialogDescription>
                    Exportiere für &quot;Tailwind v4&quot; auf{" "}
                    <a
                      href="https://tweakcn.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      tweakcn.com
                    </a>{" "}
                    und füge das CSS hier ein.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="import-name">Theme-Name</Label>
                    <Input
                      id="import-name"
                      placeholder="z.B. Sunset, Ocean Blue..."
                      value={importName}
                      onChange={(e) => setImportName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="import-css">CSS-Code</Label>
                    <Textarea
                      id="import-css"
                      placeholder=":root { --primary: oklch(...); ... }"
                      rows={12}
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                    Abbrechen
                  </Button>
                  <Button
                    onClick={handleTweakCNImport}
                    disabled={!importText.trim() || !importName.trim() || isLoading}
                  >
                    {isLoading ? "Importiere..." : "Importieren"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Aktiv</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Beschreibung</TableHead>
                  <TableHead className="w-24 text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredThemes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Keine Themes gefunden.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredThemes.map((theme) => {
                    const isActive = theme.id === currentThemeId
                    return (
                      <TableRow
                        key={theme.id}
                        onClick={() => setTheme(theme.id)}
                        className={cn(
                          "cursor-pointer transition-colors",
                          "hover:bg-accent/50",
                          isActive && "bg-accent/30"
                        )}
                      >
                        <TableCell>
                          <Checkbox
                            checked={isActive}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setTheme(theme.id)
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="size-5 transition-transform hover:scale-110"
                            data-ai-exempt="true"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{theme.name}</TableCell>
                        <TableCell className="text-muted-foreground hidden md:table-cell">
                          {theme.description}
                        </TableCell>
                        <TableCell className="text-right">
                          <div
                            className="flex items-center justify-end gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditTheme(theme)}
                              disabled={theme.id === "default"}
                              className={cn(theme.id === "default" && "opacity-50")}
                              data-ai-exempt="true"
                            >
                              <Edit className="size-4" />
                            </Button>
                            {theme.id !== "default" ? (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive">
                                    <Trash2 className="size-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Theme löschen?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Möchtest du das Theme &quot;{theme.name}&quot; wirklich
                                      löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteTheme(theme.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      disabled={isLoading}
                                    >
                                      {isLoading ? "Lösche..." : "Löschen"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled
                                className="text-destructive opacity-50"
                                data-ai-exempt="true"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Theme bearbeiten</DialogTitle>
              <DialogDescription>Bearbeite Name und Beschreibung des Themes.</DialogDescription>
            </DialogHeader>
            {selectedTheme && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme-ID</Label>
                  <Input value={selectedTheme.id} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-theme-name">Name</Label>
                  <Input
                    id="edit-theme-name"
                    value={selectedTheme.name}
                    onChange={(e) => setSelectedTheme({ ...selectedTheme, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-theme-description">Beschreibung</Label>
                  <Textarea
                    id="edit-theme-description"
                    value={selectedTheme.description}
                    onChange={(e) =>
                      setSelectedTheme({ ...selectedTheme, description: e.target.value })
                    }
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleSaveEdit} disabled={isLoading}>
                {isLoading ? "Speichere..." : "Speichern"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageContent>
  )
}
