"use client"

import { useState, useEffect } from "react"
import { Trash2, Upload, Edit, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useTheme, type ThemeMeta } from "@/lib/themes"
import { mapRawFontToVariable, FONT_NAME_TO_VARIABLE } from "@/lib/fonts"

/**
 * Findet den Font-Namen aus einer CSS-Variable zurück.
 * z.B. var(--font-inter) -> "Inter"
 */
function getFontNameFromVariable(cssVar: string): string | null {
  if (!cssVar.startsWith("var(")) return null

  // Extrahiere die Variable (z.B. "--font-inter")
  const varMatch = cssVar.match(/var\((--font-[a-z0-9-]+)\)/)
  if (!varMatch) return null

  const variable = varMatch[1]

  // Suche in der Registry nach dem Font-Namen, der zu dieser Variable gehört
  const entry = Object.entries(FONT_NAME_TO_VARIABLE).find(([, varName]) => varName === variable)
  if (!entry) return null

  // Nimm den ersten Eintrag (normalerweise der Hauptname)
  const fontName = entry[0]

  // Konvertiere zu Title Case (z.B. "ibm plex sans" -> "IBM Plex Sans")
  return fontName
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

/**
 * Theme-Verwaltungsseite.
 * Ermöglicht das Verwalten, Importieren, Hinzufügen, Bearbeiten und Löschen von Themes.
 */
export default function ThemeManagerPage(): React.ReactElement {
  const { theme: currentThemeId, setTheme, themes: contextThemes, refreshThemes } = useTheme()
  const [themes, setThemes] = useState<ThemeMeta[]>(contextThemes)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState<ThemeMeta | null>(null)
  const [importText, setImportText] = useState("")
  const [importName, setImportName] = useState("")
  const [cssAnalysis, setCssAnalysis] = useState<{
    isValid: boolean
    colors: Array<{ name: string; value: string }>
    fonts: Array<{
      type: "sans" | "mono" | "serif"
      originalValue: string
      fontName: string
      resolved: string | null
      inRegistry: boolean
      inStaticRegistry?: boolean // Optional: ob in statischer Registry
      alreadyImported?: boolean // Optional: ob bereits in einem anderen Theme verwendet
      isGenericFont?: boolean // Optional: ob es ein generischer Font ist
      willBeRegisteredAs: string
    }>
    radius?: string
    spacing?: string
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)
  const [fontNames, setFontNames] = useState<{
    sans: { name: string; isFallback: boolean; requested?: string }
    mono: { name: string; isFallback: boolean; requested?: string }
    serif: { name: string; isFallback: boolean; requested?: string }
  }>({
    sans: { name: "", isFallback: false },
    mono: { name: "", isFallback: false },
    serif: { name: "", isFallback: false },
  })

  // Synchronisiere mit Context-Themes
  useEffect(() => {
    setThemes(contextThemes)
  }, [contextThemes])

  // Analysiere CSS-Code live während des Tippens
  useEffect(() => {
    if (!importText.trim()) {
      setCssAnalysis(null)
      return
    }

    try {
      // Extrahiere CSS-Variablen aus dem Code
      // Regex: Findet --variable-name: value; (auch mit mehrzeiligen Werten)
      // WICHTIG: Verwende nicht-globalen Regex, da wir alle Matches brauchen
      const cssVarRegex = /--([a-z0-9-]+):\s*([^;]+?);/gi
      const variables: Record<string, string> = {}
      const matches = Array.from(importText.matchAll(cssVarRegex))

      for (const match of matches) {
        const [, name, value] = match
        const trimmedName = name.trim()
        const trimmedValue = value.trim()
        // Überschreibe nicht, wenn Variable bereits existiert (bevorzuge erste Definition)
        if (!variables[trimmedName]) {
          variables[trimmedName] = trimmedValue
        }
      }

      // Prüfe ob überhaupt Variablen gefunden wurden
      if (Object.keys(variables).length === 0) {
        setCssAnalysis({ isValid: false, colors: [], fonts: [] })
        return
      }

      // Extrahiere Hauptfarben
      const colorKeys = [
        "background",
        "foreground",
        "primary",
        "secondary",
        "accent",
        "muted",
        "destructive",
        "card",
        "popover",
        "border",
        "input",
        "ring",
      ]
      const colors = colorKeys
        .filter((key) => variables[key])
        .map((key) => ({
          name: key,
          value: variables[key],
        }))

      // Extrahiere Fonts
      const fonts: Array<{
        type: "sans" | "mono" | "serif"
        originalValue: string // Exakter Wert aus dem CSS (mit Anführungszeichen, wie er ist)
        fontName: string // Bereinigter Font-Name (ohne Anführungszeichen, ohne Fallback)
        resolved: string | null
        inRegistry: boolean
        inStaticRegistry?: boolean // CSS-Variablen aus statischer Registry
        alreadyImported?: boolean // Font bereits importiert
        isGenericFont?: boolean // Generische Fonts (sans-serif, etc.)
        willBeRegisteredAs: string
      }> = []

      const fontTypes: Array<{ key: string; type: "sans" | "mono" | "serif" }> = [
        { key: "font-sans", type: "sans" },
        { key: "font-mono", type: "mono" },
        { key: "font-serif", type: "serif" },
      ]

      for (const { key, type } of fontTypes) {
        const fontValue = variables[key]
        if (!fontValue) continue

        // Bereits eine CSS-Variable?
        if (fontValue.startsWith("var(")) {
          // Versuche den Font-Namen aus der Variable zu extrahieren
          const extractedFontName = getFontNameFromVariable(fontValue)
          fonts.push({
            type,
            originalValue: fontValue,
            fontName: extractedFontName || fontValue, // Zeige Font-Namen, falls gefunden, sonst Variable
            resolved: fontValue,
            inRegistry: true,
            inStaticRegistry: true, // CSS-Variablen kommen aus statischer Registry
            alreadyImported: false, // Wird separat geprüft, falls nötig
            isGenericFont: false, // CSS-Variablen sind nie generisch
            willBeRegisteredAs: fontValue, // Bleibt wie es ist
          })
          continue
        }

        // Behalte den originalen Wert (mit Anführungszeichen, wie im CSS)
        const originalValue = fontValue.trim()

        // Extrahiere Font-Namen (ohne Anführungszeichen, ohne Fallback)
        const fontName = fontValue.split(",")[0].trim().replace(/['"]/g, "")
        const genericFonts = [
          "sans-serif",
          "serif",
          "monospace",
          "system-ui",
          "cursive",
          "fantasy",
          "ui-sans-serif",
          "ui-serif",
          "ui-monospace",
        ]
        const isGenericFont = genericFonts.includes(fontName.toLowerCase())

        // Prüfe ob Font in statischer Registry vorhanden ist (nur wenn nicht generisch)
        let mappingResult = { success: false, variable: null as string | null }
        let inStaticRegistry = false
        if (!isGenericFont) {
          mappingResult = mapRawFontToVariable(fontName)
          inStaticRegistry = mappingResult.success && mappingResult.variable !== null
        }

        // Prüfe auch, ob Font bereits in einem importierten Theme verwendet wird (nur wenn nicht generisch)
        const alreadyImported =
          !isGenericFont &&
          themes.some(
            (theme) =>
              theme.dynamicFonts &&
              theme.dynamicFonts.some(
                (dynamicFont) => dynamicFont.toLowerCase() === fontName.toLowerCase()
              )
          )

        // Font ist "in Registry", wenn er entweder in der statischen Registry ist
        // oder bereits in einem importierten Theme verwendet wird (nicht bei generischen Fonts)
        const inRegistry = !isGenericFont && (inStaticRegistry || alreadyImported)

        // Bestimme, wie es in tokens.css eingetragen wird
        let willBeRegisteredAs: string
        if (isGenericFont) {
          // Generische Fonts werden unverändert übernommen
          willBeRegisteredAs = fontValue.trim()
        } else if (inRegistry && mappingResult.variable) {
          // Font ist in Registry → wird als CSS-Variable eingetragen
          willBeRegisteredAs = mappingResult.variable
        } else {
          // Font wird dynamisch geladen → wird als "Font Name", fallback eingetragen
          // Verwende den originalen Fallback aus dem CSS, oder Standard-Fallback
          const fallback = fontValue.includes(",")
            ? fontValue.substring(fontValue.indexOf(",")).trim()
            : type === "mono"
              ? ", monospace"
              : type === "serif"
                ? ", serif"
                : ", sans-serif"
          // Stelle sicher, dass der Font-Name in Anführungszeichen steht
          const fontNameWithQuotes = fontName.includes(" ") ? `"${fontName}"` : fontName
          willBeRegisteredAs = `${fontNameWithQuotes}${fallback}`
        }

        fonts.push({
          type,
          originalValue, // Zeigt den exakten Wert aus dem CSS
          fontName, // Bereinigter Name für Anzeige
          resolved: mappingResult.variable,
          inRegistry: inRegistry || false,
          inStaticRegistry: inStaticRegistry || false,
          alreadyImported: alreadyImported || false,
          isGenericFont: isGenericFont || false,
          willBeRegisteredAs, // Exakt wie es eingetragen wird
        })
      }

      // Extrahiere Radius und Spacing
      const radius = variables["radius"]
      const spacing = variables["spacing"]

      setCssAnalysis({
        isValid: true,
        colors,
        fonts,
        radius,
        spacing,
      })
    } catch {
      setCssAnalysis({ isValid: false, colors: [], fonts: [] })
    }
  }, [importText, themes])

  // Lade Schriftnamen aus CSS-Variablen
  useEffect(() => {
    const genericFonts = [
      "sans-serif",
      "serif",
      "monospace",
      "system-ui",
      "cursive",
      "fantasy",
      "ui-sans-serif",
      "ui-serif",
      "ui-monospace",
    ]

    const extractFontInfo = (
      cssVar: string
    ): { name: string; isFallback: boolean; requested?: string } => {
      const root = document.documentElement
      const computedStyle = getComputedStyle(root)
      const value = computedStyle.getPropertyValue(cssVar).trim()

      // Prüfe ob der Wert leer ist (Variable nicht definiert)
      if (!value) {
        return { name: "nicht definiert", isFallback: true, requested: cssVar }
      }

      // Extrahiere den ersten Fontnamen (vor dem Komma für Fallbacks)
      const firstFont = value.split(",")[0].trim().replace(/['"]/g, "")

      // Prüfe ob es ein generischer Font oder leer ist → Fallback
      const isGeneric = !firstFont || genericFonts.includes(firstFont.toLowerCase())

      // Prüfe ob die Font tatsächlich geladen ist (via document.fonts API)
      let isFontLoaded = false
      if (firstFont && !isGeneric) {
        try {
          isFontLoaded = document.fonts.check(`16px "${firstFont}"`)
        } catch {
          isFontLoaded = false
        }
      }

      const isFallback = isGeneric || (!isFontLoaded && !!firstFont)

      return {
        // Zeige den Font-Namen (oder "Standard" wenn leer/generisch)
        name: !firstFont || isGeneric ? "Standard" : firstFont,
        isFallback,
        // Bei Fallback: Zeige den angeforderten Font-Namen (auch wenn leer)
        requested: isFallback ? firstFont || "unbekannt" : undefined,
      }
    }

    // Warte auf das vollständige Laden der Fonts
    const updateFontNames = () => {
      setFontNames({
        sans: extractFontInfo("--font-sans"),
        mono: extractFontInfo("--font-mono"),
        serif: extractFontInfo("--font-serif"),
      })
    }

    // Warte etwas, damit CSS-Variablen und Fonts geladen werden
    const timeoutId = setTimeout(() => {
      if (document.fonts?.ready) {
        document.fonts.ready.then(updateFontNames)
      } else {
        updateFontNames()
      }
    }, 200)

    return () => clearTimeout(timeoutId)
  }, [currentThemeId])

  // Themes werden automatisch vom ThemeProvider geladen
  // Der useEffect synchronisiert mit contextThemes

  const handleDeleteTheme = async (themeId: string) => {
    if (themeId === "default") {
      return // Default Theme kann nicht gelöscht werden
    }

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

      // Wenn das gelöschte Theme aktiv war, zum Default wechseln
      if (currentThemeId === themeId) {
        setTheme("default")
      }

      // Lade Themes neu über den Provider
      await refreshThemes()
    } catch (error) {
      console.error("Fehler beim Löschen:", error)
      alert("Fehler beim Löschen des Themes. Bitte versuche es erneut.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleImportTheme = async () => {
    if (!importName.trim()) {
      setErrorMessage("Bitte gib einen Namen für das Theme ein.")
      setIsErrorDialogOpen(true)
      return
    }
    if (!importText.trim()) {
      setErrorMessage("Bitte gib CSS-Code ein.")
      setIsErrorDialogOpen(true)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/themes/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ css: importText, name: importName.trim() }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || "Fehler beim Importieren des Themes")
      }

      const data = await response.json()

      setIsImportDialogOpen(false)
      setImportText("")
      setImportName("")

      const newThemeId = data.theme?.id

      // Lade Themes neu über den Provider
      await refreshThemes()

      // Aktiviere das neu importierte Theme automatisch
      if (newThemeId) {
        setTheme(newThemeId)
      }
    } catch (error) {
      console.error("Fehler beim Importieren:", error)
      const message = error instanceof Error ? error.message : "Fehler beim Importieren des Themes."
      setErrorMessage(message)
      setIsErrorDialogOpen(true)
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

      // Lade Themes neu über den Provider
      await refreshThemes()
    } catch (error) {
      console.error("Fehler beim Speichern:", error)
      alert("Fehler beim Speichern des Themes. Bitte versuche es erneut.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-foreground text-2xl font-bold tracking-tight">Theme-Verwaltung</h1>
        <p className="text-muted-foreground text-sm">
          Verwalte, importiere und bearbeite Themes für deine Anwendung
        </p>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-foreground text-xl font-semibold">Verfügbare Themes</h2>
            <p className="text-muted-foreground text-sm">
              {themes.length} Theme{themes.length !== 1 ? "s" : ""} verfügbar
            </p>
          </div>
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Neues Theme
              </Button>
            </DialogTrigger>
            <DialogContent className="flex max-h-[95vh] !w-[95vw] !max-w-[95vw] flex-col sm:!max-w-[95vw]">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle>Theme von TweakCN importieren</DialogTitle>
                <DialogDescription>
                  Füge hier den CSS-Export von{" "}
                  <a
                    href="https://tweakcn.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary cursor-pointer font-medium hover:underline"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      window.open("https://tweakcn.com/", "_blank", "noopener,noreferrer")
                    }}
                  >
                    TweakCN
                  </a>{" "}
                  ein, um ein neues Theme zu importieren.
                </DialogDescription>
              </DialogHeader>
              {/* Theme-Name Eingabefeld - immer sichtbar oben */}
              <div className="flex-shrink-0 space-y-2 border-b pb-4">
                <Label htmlFor="import-name">Theme-Name</Label>
                <Input
                  id="import-name"
                  placeholder="z.B. Sunset, Ocean Blue, Dark Forest..."
                  value={importName}
                  onChange={(e) => setImportName(e.target.value)}
                />
                <p className="text-muted-foreground text-xs">
                  Gib einen eindeutigen Namen für das neue Theme ein.
                </p>
              </div>
              <div className="flex min-h-0 flex-1 gap-4 overflow-hidden py-4">
                {/* Linke Spalte: Eingabe */}
                <div className="flex min-w-0 flex-1 flex-col space-y-2">
                  <div className="flex min-h-0 flex-1 flex-col space-y-2">
                    <Label htmlFor="import-text">CSS-Code</Label>
                    <Textarea
                      id="import-text"
                      placeholder=":root { --primary: oklch(...); --background: oklch(...); ... }"
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      className="min-h-[500px] flex-1 resize-none overflow-x-auto font-mono text-sm whitespace-pre"
                    />
                    <p className="text-muted-foreground flex-shrink-0 text-xs">
                      Kopiere den CSS-Code aus TweakCN und füge ihn hier ein. Das Theme wird
                      automatisch in das CSS-First Schema konvertiert.
                    </p>
                  </div>
                </div>

                {/* Rechte Spalte: Live-Analyse */}
                <div className="flex w-80 flex-shrink-0 flex-col space-y-4 overflow-y-auto border-l pl-4">
                  <div>
                    <h3 className="text-sm font-semibold">Live-Analyse</h3>
                    <p className="text-muted-foreground text-xs">
                      Die Analyse wird automatisch aktualisiert, während du tippst.
                    </p>
                  </div>

                  {cssAnalysis ? (
                    <>
                      {/* Validierung */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {cssAnalysis.isValid ? (
                            <>
                              <span className="text-green-600">✓</span>
                              <span className="text-sm font-medium">Gültiger CSS-Code erkannt</span>
                            </>
                          ) : (
                            <>
                              <span className="text-amber-600">⚠</span>
                              <span className="text-sm font-medium">
                                Keine CSS-Variablen gefunden
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Fonts - Ganz oben, da das Hauptproblem */}
                      {cssAnalysis.fonts.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold tracking-wider uppercase">
                            🔤 Schriften
                          </h4>
                          <div className="space-y-2">
                            {cssAnalysis.fonts.map((font, idx) => (
                              <div
                                key={`${font.type}-${idx}`}
                                className="space-y-1.5 rounded border p-2"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium uppercase">{font.type}</span>
                                  {font.isGenericFont ? (
                                    <span className="text-xs text-gray-500">
                                      ⓘ Generischer Font
                                    </span>
                                  ) : font.inRegistry ? (
                                    <span className="text-xs text-green-600">
                                      {font.inStaticRegistry
                                        ? "✓ In Registry"
                                        : font.alreadyImported
                                          ? "✓ Bereits importiert"
                                          : "✓ In Registry"}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-amber-600">
                                      ⚠ Wird dynamisch geladen
                                    </span>
                                  )}
                                </div>
                                <div className="space-y-1">
                                  <div className="text-muted-foreground text-xs">Schriftname:</div>
                                  <div className="text-foreground text-base font-semibold">
                                    {font.fontName}
                                  </div>
                                  <div className="text-muted-foreground text-xs">
                                    Wird eingetragen als:
                                  </div>
                                  <div className="bg-primary/10 text-foreground border-primary/20 rounded border px-1.5 py-0.5 font-mono text-xs break-all">
                                    {font.willBeRegisteredAs}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Farben */}
                      {cssAnalysis.colors.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold tracking-wider uppercase">
                            🎨 Hauptfarben
                          </h4>
                          <div className="space-y-1.5">
                            {cssAnalysis.colors.map((color) => (
                              <div
                                key={color.name}
                                className="flex items-center gap-2 rounded border p-2"
                              >
                                <div
                                  className="h-6 w-6 flex-shrink-0 rounded border"
                                  style={{ backgroundColor: color.value }}
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-xs font-medium">{color.name}</div>
                                  <div className="text-muted-foreground truncate font-mono text-xs">
                                    {color.value}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Radius & Spacing */}
                      {(cssAnalysis.radius || cssAnalysis.spacing) && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold tracking-wider uppercase">
                            ⚙️ Weitere Werte
                          </h4>
                          <div className="space-y-1.5">
                            {cssAnalysis.radius && (
                              <div className="rounded border p-2">
                                <div className="text-xs font-medium">Radius</div>
                                <div className="text-muted-foreground font-mono text-xs">
                                  {cssAnalysis.radius}
                                </div>
                              </div>
                            )}
                            {cssAnalysis.spacing && (
                              <div className="rounded border p-2">
                                <div className="text-xs font-medium">Spacing</div>
                                <div className="text-muted-foreground font-mono text-xs">
                                  {cssAnalysis.spacing}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-muted-foreground text-sm">
                      Beginne mit dem Einfügen des CSS-Codes, um die Analyse zu sehen.
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter className="flex-shrink-0">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsImportDialogOpen(false)
                    setImportName("")
                    setImportText("")
                  }}
                  disabled={isLoading}
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={handleImportTheme}
                  disabled={isLoading || !importText.trim() || !importName.trim()}
                >
                  {isLoading ? "Importiere..." : "Importieren"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Themes Table */}
        <Card>
          <CardHeader>
            <CardTitle>Themes</CardTitle>
            <CardDescription>
              Verwalte alle verfügbaren Themes. Aktiviere, bearbeite oder lösche Themes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Beschreibung</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {themes.map((theme) => {
                  const isActive = theme.id === currentThemeId
                  return (
                    <TableRow key={theme.id}>
                      <TableCell>
                        <Switch
                          checked={isActive}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setTheme(theme.id)
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{theme.name}</TableCell>
                      <TableCell className="text-muted-foreground">{theme.description}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-nowrap items-center justify-end gap-2">
                          {theme.id !== "default" ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditTheme(theme)}
                              className="flex-shrink-0"
                              aria-label="Theme bearbeiten"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled
                              className="flex-shrink-0 cursor-not-allowed opacity-50"
                              aria-label="Theme bearbeiten (nicht verfügbar)"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {theme.id !== "default" ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive flex-shrink-0"
                                  aria-label="Theme löschen"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Theme löschen?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Möchtest du das Theme &quot;{theme.name}&quot; wirklich löschen?
                                    Diese Aktion kann nicht rückgängig gemacht werden.
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
                              className="text-destructive flex-shrink-0 cursor-not-allowed opacity-50"
                              aria-label="Theme löschen (nicht verfügbar)"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Theme Color System */}
        <Card>
          <CardHeader>
            <CardTitle>Farbsystem</CardTitle>
            <CardDescription>Alle Design-Tokens des aktiven Themes im Überblick.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Hauptfarben als Kreise */}
            <div className="flex flex-wrap gap-6">
              <div className="flex flex-col items-center gap-2">
                <div className="bg-primary h-12 w-12 rounded-full border shadow-sm" />
                <span className="text-muted-foreground text-xs">Primary</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="bg-foreground h-12 w-12 rounded-full border shadow-sm" />
                <span className="text-muted-foreground text-xs">Foreground</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="bg-muted-foreground h-12 w-12 rounded-full border shadow-sm" />
                <span className="text-muted-foreground text-xs">Muted FG</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="bg-border h-12 w-12 rounded-full border shadow-sm" />
                <span className="text-muted-foreground text-xs">Border</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="bg-background h-12 w-12 rounded-full border shadow-sm" />
                <span className="text-muted-foreground text-xs">Background</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="bg-destructive h-12 w-12 rounded-full border shadow-sm" />
                <span className="text-muted-foreground text-xs">Destructive</span>
              </div>
            </div>

            {/* Farbpaletten */}
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

            {/* Typografie */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Typografie</h4>
              <div className="grid gap-4 md:grid-cols-3">
                {/* Sans */}
                <div className="bg-muted/30 space-y-2 rounded-lg border p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                      Sans
                    </span>
                    {fontNames.sans.isFallback ? (
                      <span className="truncate text-sm font-semibold text-red-500 line-through">
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
                      <span className="truncate text-sm font-semibold text-red-500 line-through">
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
                      <span className="truncate text-sm font-semibold text-red-500 line-through">
                        {fontNames.serif.name || "..."}
                      </span>
                    ) : (
                      <span className="text-foreground truncate text-sm font-semibold">
                        {fontNames.serif.name || "..."}
                      </span>
                    )}
                  </div>
                  <div
                    style={{ fontFamily: "var(--font-serif)" }}
                    className="text-2xl font-semibold"
                  >
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
            </div>

            {/* Rundungen */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Rundungen (Border Radius)</h4>
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-primary h-16 w-16 rounded-sm" />
                  <span className="text-muted-foreground text-xs">sm</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-primary h-16 w-16 rounded-md" />
                  <span className="text-muted-foreground text-xs">md</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-primary h-16 w-16 rounded-lg" />
                  <span className="text-muted-foreground text-xs">lg</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-primary h-16 w-16 rounded-xl" />
                  <span className="text-muted-foreground text-xs">xl</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-primary h-16 w-16 rounded-full" />
                  <span className="text-muted-foreground text-xs">full</span>
                </div>
              </div>
              <p className="text-muted-foreground text-xs">
                Basis: <code className="bg-muted rounded px-1 py-0.5">--radius</code> · Die Stufen
                werden automatisch berechnet (sm = radius-4px, md = radius-2px, lg = radius)
              </p>
            </div>

            {/* Schatten */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Schatten (Shadows)</h4>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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
                Schatten werden über CSS-Variablen definiert und passen sich automatisch an
                Light/Dark Mode an.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Theme-Verwaltung
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-2 text-sm">
            <p>
              <strong className="text-foreground">Theme-Dateien:</strong> Alle Theme-Variablen
              werden in <code className="bg-muted rounded px-1 py-0.5">src/themes/tokens.css</code>{" "}
              gespeichert.
            </p>
            <p>
              <strong className="text-foreground">Theme-Registry:</strong> Theme-Metadaten werden in{" "}
              <code className="bg-muted rounded px-1 py-0.5">src/themes/registry.ts</code>{" "}
              verwaltet.
            </p>
            <p>
              <strong className="text-foreground">Import:</strong> Du kannst Themes aus
              TweakCN-Exports importieren. Die CSS-Variablen werden automatisch in das CSS-First
              Schema konvertiert.
            </p>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Theme bearbeiten</DialogTitle>
              <DialogDescription>
                Bearbeite Name und Beschreibung des Themes. Die Theme-ID kann nicht geändert werden.
              </DialogDescription>
            </DialogHeader>
            {selectedTheme && (
              <div className="space-y-4 py-4">
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
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isLoading}
              >
                Abbrechen
              </Button>
              <Button onClick={handleSaveEdit} disabled={isLoading}>
                {isLoading ? "Speichere..." : "Speichern"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Error Dialog */}
        <AlertDialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Fehler beim Importieren des Themes</AlertDialogTitle>
              <AlertDialogDescription>
                {errorMessage || "Ein unbekannter Fehler ist aufgetreten."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setIsErrorDialogOpen(false)}>OK</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
