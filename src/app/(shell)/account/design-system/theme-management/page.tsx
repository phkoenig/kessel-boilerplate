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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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

  // Font-Namen State
  const [fontNames, setFontNames] = useState<{
    sans: { name: string; isFallback: boolean }
    mono: { name: string; isFallback: boolean }
    serif: { name: string; isFallback: boolean }
  }>({
    sans: { name: "", isFallback: false },
    mono: { name: "", isFallback: false },
    serif: { name: "", isFallback: false },
  })

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

  // Lade Schriftnamen aus CSS-Variablen
  useEffect(() => {
    const genericFonts = [
      "sans-serif",
      "serif",
      "monospace",
      "system-ui",
      "ui-sans-serif",
      "ui-serif",
      "ui-monospace",
    ]

    const extractFontInfo = (cssVar: string): { name: string; isFallback: boolean } => {
      const root = document.documentElement
      const computedStyle = getComputedStyle(root)
      const value = computedStyle.getPropertyValue(cssVar).trim()

      if (!value) {
        return { name: "nicht definiert", isFallback: true }
      }

      const firstFont = value.split(",")[0].trim().replace(/['"]/g, "")
      const isGeneric = !firstFont || genericFonts.includes(firstFont.toLowerCase())

      let isFontLoaded = false
      if (firstFont && !isGeneric) {
        try {
          isFontLoaded = document.fonts.check(`16px "${firstFont}"`)
        } catch {
          isFontLoaded = false
        }
      }

      return {
        name: !firstFont || isGeneric ? "Standard" : firstFont,
        isFallback: isGeneric || (!isFontLoaded && !!firstFont),
      }
    }

    const updateFontNames = () => {
      setFontNames({
        sans: extractFontInfo("--font-sans"),
        mono: extractFontInfo("--font-mono"),
        serif: extractFontInfo("--font-serif"),
      })
    }

    const timeoutId = setTimeout(() => {
      if (document.fonts?.ready) {
        document.fonts.ready.then(updateFontNames)
      } else {
        updateFontNames()
      }
    }, 200)

    return () => clearTimeout(timeoutId)
  }, [currentThemeId])

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

        {/* Farbsystem */}
        <Card>
          <CardHeader>
            <CardTitle>Farbsystem</CardTitle>
            <CardDescription>Alle Design-Tokens des aktiven Themes im Überblick</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Hauptfarben als Kreise */}
            <div className="flex flex-wrap gap-6">
              <div className="flex flex-col items-center gap-2">
                <div className="bg-primary size-12 rounded-full border shadow-sm" />
                <span className="text-muted-foreground text-xs">Primary</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="bg-foreground size-12 rounded-full border shadow-sm" />
                <span className="text-muted-foreground text-xs">Foreground</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="bg-muted-foreground size-12 rounded-full border shadow-sm" />
                <span className="text-muted-foreground text-xs">Muted FG</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="bg-border size-12 rounded-full border shadow-sm" />
                <span className="text-muted-foreground text-xs">Border</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="bg-background size-12 rounded-full border shadow-sm" />
                <span className="text-muted-foreground text-xs">Background</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="bg-destructive size-12 rounded-full border shadow-sm" />
                <span className="text-muted-foreground text-xs">Destructive</span>
              </div>
            </div>

            {/* Farbpaletten mit Verläufen */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* Brand/Primary */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Brand</h4>
                <div className="space-y-1">
                  <div className="bg-primary text-primary-foreground flex items-center justify-between rounded-md px-3 py-2">
                    <span className="text-xs font-medium">Primary</span>
                    <span className="text-xs opacity-70">FG</span>
                  </div>
                  <div className="bg-primary/80 text-primary-foreground flex items-center justify-between rounded-md px-3 py-2">
                    <span className="text-xs">80%</span>
                  </div>
                  <div className="bg-primary/60 text-primary-foreground flex items-center justify-between rounded-md px-3 py-2">
                    <span className="text-xs">60%</span>
                  </div>
                  <div className="bg-primary/40 flex items-center justify-between rounded-md px-3 py-2">
                    <span className="text-xs">40%</span>
                  </div>
                  <div className="bg-primary/20 flex items-center justify-between rounded-md px-3 py-2">
                    <span className="text-xs">20%</span>
                  </div>
                </div>
              </div>

              {/* Neutral */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Neutral</h4>
                <div className="space-y-1">
                  <div className="bg-foreground text-background flex items-center justify-between rounded-md px-3 py-2">
                    <span className="text-xs font-medium">Foreground</span>
                  </div>
                  <div className="bg-muted-foreground text-background flex items-center justify-between rounded-md px-3 py-2">
                    <span className="text-xs">Muted FG</span>
                  </div>
                  <div className="bg-border flex items-center justify-between rounded-md px-3 py-2">
                    <span className="text-xs">Border</span>
                  </div>
                  <div className="bg-muted text-muted-foreground flex items-center justify-between rounded-md px-3 py-2">
                    <span className="text-xs">Muted</span>
                  </div>
                  <div className="bg-background text-foreground flex items-center justify-between rounded-md border px-3 py-2">
                    <span className="text-xs">Background</span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Status</h4>
                <div className="space-y-1">
                  <div className="bg-destructive text-destructive-foreground flex items-center justify-between rounded-md px-3 py-2">
                    <span className="text-xs font-medium">Destructive</span>
                  </div>
                  <div className="bg-destructive/80 text-destructive-foreground flex items-center justify-between rounded-md px-3 py-2">
                    <span className="text-xs">80%</span>
                  </div>
                  <div className="bg-destructive/60 flex items-center justify-between rounded-md px-3 py-2">
                    <span className="text-xs">60%</span>
                  </div>
                  <div className="bg-destructive/40 flex items-center justify-between rounded-md px-3 py-2">
                    <span className="text-xs">40%</span>
                  </div>
                  <div className="bg-destructive/20 flex items-center justify-between rounded-md px-3 py-2">
                    <span className="text-xs">20%</span>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Charts</h4>
                <div className="space-y-1">
                  <div className="bg-chart-1 flex items-center justify-between rounded-md px-3 py-2 text-white">
                    <span className="text-xs font-medium">Chart 1</span>
                  </div>
                  <div className="bg-chart-2 flex items-center justify-between rounded-md px-3 py-2 text-white">
                    <span className="text-xs">Chart 2</span>
                  </div>
                  <div className="bg-chart-3 flex items-center justify-between rounded-md px-3 py-2 text-white">
                    <span className="text-xs">Chart 3</span>
                  </div>
                  <div className="bg-chart-4 flex items-center justify-between rounded-md px-3 py-2 text-white">
                    <span className="text-xs">Chart 4</span>
                  </div>
                  <div className="bg-chart-5 flex items-center justify-between rounded-md px-3 py-2 text-white">
                    <span className="text-xs">Chart 5</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interaktive Farben */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Interaktiv</h4>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                <div className="bg-secondary text-secondary-foreground rounded-md px-3 py-2 text-center">
                  <span className="text-xs">Secondary</span>
                </div>
                <div className="bg-accent text-accent-foreground rounded-md px-3 py-2 text-center">
                  <span className="text-xs">Accent</span>
                </div>
                <div className="bg-card text-card-foreground rounded-md border px-3 py-2 text-center">
                  <span className="text-xs">Card</span>
                </div>
                <div className="bg-popover text-popover-foreground rounded-md border px-3 py-2 text-center">
                  <span className="text-xs">Popover</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Typografie */}
        <Card>
          <CardHeader>
            <CardTitle>Typografie</CardTitle>
            <CardDescription>Die Schriftarten des aktiven Themes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Sans */}
              <div className="bg-muted/30 space-y-2 rounded-lg border p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                    Sans
                  </span>
                  {fontNames.sans.isFallback ? (
                    <span className="text-destructive truncate text-sm font-semibold line-through">
                      {fontNames.sans.name || "..."}
                    </span>
                  ) : (
                    <span className="text-foreground truncate text-sm font-semibold">
                      {fontNames.sans.name || "..."}
                    </span>
                  )}
                </div>
                <div className="font-sans text-2xl font-semibold">Aa Bb Cc Dd</div>
                <div className="font-sans text-sm">ABCDEFGHIJKLMNOPQRSTUVWXYZ</div>
                <div className="font-sans text-sm">abcdefghijklmnopqrstuvwxyz</div>
                <div className="font-sans text-sm">0123456789</div>
                <div className="text-muted-foreground mt-2 text-xs">
                  Hauptschrift für Fließtext und UI-Elemente
                </div>
              </div>

              {/* Mono */}
              <div className="bg-muted/30 space-y-2 rounded-lg border p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                    Mono
                  </span>
                  {fontNames.mono.isFallback ? (
                    <span className="text-destructive truncate text-sm font-semibold line-through">
                      {fontNames.mono.name || "..."}
                    </span>
                  ) : (
                    <span className="text-foreground truncate text-sm font-semibold">
                      {fontNames.mono.name || "..."}
                    </span>
                  )}
                </div>
                <div className="font-mono text-2xl font-semibold">Aa Bb Cc Dd</div>
                <div className="font-mono text-sm">ABCDEFGHIJKLMNOPQRSTUVWXYZ</div>
                <div className="font-mono text-sm">abcdefghijklmnopqrstuvwxyz</div>
                <div className="font-mono text-sm">0123456789</div>
                <div className="text-muted-foreground mt-2 text-xs">
                  Code, technische Daten, Terminals
                </div>
              </div>

              {/* Serif */}
              <div className="bg-muted/30 space-y-2 rounded-lg border p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                    Serif
                  </span>
                  {fontNames.serif.isFallback ? (
                    <span className="text-destructive truncate text-sm font-semibold line-through">
                      {fontNames.serif.name || "..."}
                    </span>
                  ) : (
                    <span className="text-foreground truncate text-sm font-semibold">
                      {fontNames.serif.name || "..."}
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: "var(--font-serif)" }} className="text-2xl font-semibold">
                  Aa Bb Cc Dd
                </div>
                <div style={{ fontFamily: "var(--font-serif)" }} className="text-sm">
                  ABCDEFGHIJKLMNOPQRSTUVWXYZ
                </div>
                <div style={{ fontFamily: "var(--font-serif)" }} className="text-sm">
                  abcdefghijklmnopqrstuvwxyz
                </div>
                <div style={{ fontFamily: "var(--font-serif)" }} className="text-sm">
                  0123456789
                </div>
                <div className="text-muted-foreground mt-2 text-xs">
                  Überschriften, Editorial, Akzente
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rundungen */}
        <Card>
          <CardHeader>
            <CardTitle>Rundungen</CardTitle>
            <CardDescription>Border Radius Varianten basierend auf --radius</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex flex-col items-center gap-2">
                <div className="bg-primary size-16 rounded-sm" />
                <span className="text-muted-foreground text-xs">sm</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="bg-primary size-16 rounded-md" />
                <span className="text-muted-foreground text-xs">md</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="bg-primary size-16 rounded-lg" />
                <span className="text-muted-foreground text-xs">lg</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="bg-primary size-16 rounded-xl" />
                <span className="text-muted-foreground text-xs">xl</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="bg-primary size-16 rounded-full" />
                <span className="text-muted-foreground text-xs">full</span>
              </div>
            </div>
            <p className="text-muted-foreground text-xs">
              Basis: <code className="bg-muted rounded px-1 py-0.5">--radius</code> · Die Stufen
              werden automatisch berechnet (sm = radius-4px, md = radius-2px, lg = radius)
            </p>
          </CardContent>
        </Card>

        {/* Schatten */}
        <Card>
          <CardHeader>
            <CardTitle>Schatten</CardTitle>
            <CardDescription>Shadow-Varianten für Tiefeneffekte</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
              <div className="bg-card flex h-24 items-center justify-center rounded-lg shadow-xs">
                <span className="text-muted-foreground text-xs">xs</span>
              </div>
              <div className="bg-card flex h-24 items-center justify-center rounded-lg shadow-sm">
                <span className="text-muted-foreground text-xs">sm</span>
              </div>
              <div className="bg-card flex h-24 items-center justify-center rounded-lg shadow-md">
                <span className="text-muted-foreground text-xs">md</span>
              </div>
              <div className="bg-card flex h-24 items-center justify-center rounded-lg shadow-lg">
                <span className="text-muted-foreground text-xs">lg</span>
              </div>
              <div className="bg-card flex h-24 items-center justify-center rounded-lg shadow-xl">
                <span className="text-muted-foreground text-xs">xl</span>
              </div>
              <div className="bg-card flex h-24 items-center justify-center rounded-lg shadow-2xl">
                <span className="text-muted-foreground text-xs">2xl</span>
              </div>
            </div>
            <p className="text-muted-foreground text-xs">
              Schatten passen sich automatisch an Light/Dark Mode an
            </p>
          </CardContent>
        </Card>
      </div>
    </PageContent>
  )
}
