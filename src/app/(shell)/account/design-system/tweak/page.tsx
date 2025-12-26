"use client"

import { useState, useEffect, useCallback } from "react"
import { PageContent, PageHeader } from "@/components/shell"
import { useExplorer } from "@/components/shell"
import { useTheme as useColorMode } from "next-themes"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { useTheme } from "@/lib/themes"
import { useThemeEditor } from "@/hooks/use-theme-editor"
import { ColorTokenPopover } from "@/components/theme/ColorTokenPopover"
import { SaveThemeDialog } from "@/components/theme/SaveThemeDialog"
import { Save, RotateCcw } from "lucide-react"

/**
 * Tweak the UI Seite
 *
 * Zeigt alle Design-Tokens des aktiven Themes und ermöglicht Live-Editing.
 * Änderungen werden als temporäre Inline-Styles angezeigt und können als neues Theme gespeichert werden.
 */
export default function TweakPage(): React.ReactElement {
  const { theme: currentThemeId } = useTheme()
  const { theme: colorMode, resolvedTheme } = useColorMode()
  const { setOpen: setExplorerOpen } = useExplorer()
  const { isDirty, resetPreview, previewToken } = useThemeEditor()
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [radiusValue, setRadiusValue] = useState(0.5)

  // Warte auf Client-Mount, um Hydration-Mismatch zu vermeiden
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Notwendig für Hydration-Safety
    setMounted(true)
  }, [])

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

  // Explorer für diese Seite deaktivieren
  useEffect(() => {
    const timer = setTimeout(() => {
      setExplorerOpen(false)
    }, 50)
    return () => clearTimeout(timer)
  }, [setExplorerOpen])

  // Lade Schriftnamen aus CSS-Variablen
  useEffect(() => {
    // Skip on server
    if (typeof window === "undefined") return

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
      const computedStyle = window.getComputedStyle(root)
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

  // Lade aktuellen Radius-Wert
  useEffect(() => {
    if (typeof window === "undefined") return

    const updateRadius = () => {
      const root = document.documentElement
      const computedStyle = window.getComputedStyle(root)
      const radiusStr = computedStyle.getPropertyValue("--radius").trim()
      if (radiusStr) {
        const match = radiusStr.match(/(\d+\.?\d*)/)
        if (match) {
          setRadiusValue(parseFloat(match[1]) / 16) // Convert px to rem
        }
      }
    }
    // Delay um sicherzustellen, dass Theme geladen ist
    const timeoutId = setTimeout(updateRadius, 100)
    return () => clearTimeout(timeoutId)
  }, [currentThemeId])

  const handleRadiusChange = useCallback(
    (value: number[]) => {
      const remValue = value[0]
      setRadiusValue(remValue)
      const pxValue = `${remValue * 16}px`
      previewToken("--radius", pxValue, pxValue)
    },
    [previewToken]
  )

  return (
    <PageContent>
      <PageHeader
        title="Tweak the UI"
        description="Passe Design-Tokens live an und speichere sie als neues Theme"
      />

      {/* Save/Reset Toolbar */}
      {isDirty && (
        <div className="bg-muted/50 flex items-center justify-between rounded-lg p-4">
          <span className="text-muted-foreground text-sm">Ungespeicherte Änderungen</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetPreview}>
              <RotateCcw className="mr-2 size-4" />
              Zurücksetzen
            </Button>
            <Button size="sm" onClick={() => setIsSaveDialogOpen(true)}>
              <Save className="mr-2 size-4" />
              Als neues Theme speichern
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {/* Farbsystem */}
        <Card>
          <CardHeader>
            <CardTitle>Farbsystem</CardTitle>
            <CardDescription>Alle Design-Tokens des aktiven Themes im Überblick</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Hauptfarben als Kreise */}
            <div className="flex flex-wrap gap-6">
              <ColorTokenPopover tokenName="--primary" label="Primary">
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-primary hover:ring-ring size-12 cursor-pointer rounded-full border shadow-sm transition-all hover:ring-2" />
                  <span className="text-muted-foreground text-xs">Primary</span>
                </div>
              </ColorTokenPopover>
              <ColorTokenPopover tokenName="--foreground" label="Foreground">
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-foreground hover:ring-ring size-12 cursor-pointer rounded-full border shadow-sm transition-all hover:ring-2" />
                  <span className="text-muted-foreground text-xs">Foreground</span>
                </div>
              </ColorTokenPopover>
              <ColorTokenPopover tokenName="--muted-foreground" label="Muted Foreground">
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-muted-foreground hover:ring-ring size-12 cursor-pointer rounded-full border shadow-sm transition-all hover:ring-2" />
                  <span className="text-muted-foreground text-xs">Muted FG</span>
                </div>
              </ColorTokenPopover>
              <ColorTokenPopover tokenName="--border" label="Border">
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-border hover:ring-ring size-12 cursor-pointer rounded-full border shadow-sm transition-all hover:ring-2" />
                  <span className="text-muted-foreground text-xs">Border</span>
                </div>
              </ColorTokenPopover>
              <ColorTokenPopover tokenName="--background" label="Background">
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-background hover:ring-ring size-12 cursor-pointer rounded-full border shadow-sm transition-all hover:ring-2" />
                  <span className="text-muted-foreground text-xs">Background</span>
                </div>
              </ColorTokenPopover>
              <ColorTokenPopover tokenName="--destructive" label="Destructive">
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-destructive hover:ring-ring size-12 cursor-pointer rounded-full border shadow-sm transition-all hover:ring-2" />
                  <span className="text-muted-foreground text-xs">Destructive</span>
                </div>
              </ColorTokenPopover>
            </div>

            {/* Farbpaletten mit Verläufen */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
              {/* Brand/Primary */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Brand</h4>
                <div className="space-y-1">
                  <ColorTokenPopover tokenName="--primary" label="Primary">
                    <div className="bg-primary text-primary-foreground hover:ring-ring flex cursor-pointer items-center justify-between rounded-md px-3 py-2 transition-all hover:ring-2">
                      <span className="text-xs font-medium">Primary</span>
                      <span className="text-xs opacity-70">FG</span>
                    </div>
                  </ColorTokenPopover>
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
                  <ColorTokenPopover tokenName="--foreground" label="Foreground">
                    <div className="bg-foreground text-background hover:ring-ring flex cursor-pointer items-center justify-between rounded-md px-3 py-2 transition-all hover:ring-2">
                      <span className="text-xs font-medium">Foreground</span>
                    </div>
                  </ColorTokenPopover>
                  <ColorTokenPopover tokenName="--muted-foreground" label="Muted Foreground">
                    <div className="bg-muted-foreground text-background hover:ring-ring flex cursor-pointer items-center justify-between rounded-md px-3 py-2 transition-all hover:ring-2">
                      <span className="text-xs">Muted FG</span>
                    </div>
                  </ColorTokenPopover>
                  <ColorTokenPopover tokenName="--border" label="Border">
                    <div className="bg-border hover:ring-ring flex cursor-pointer items-center justify-between rounded-md px-3 py-2 transition-all hover:ring-2">
                      <span className="text-xs">Border</span>
                    </div>
                  </ColorTokenPopover>
                  <ColorTokenPopover tokenName="--muted" label="Muted">
                    <div className="bg-muted text-muted-foreground hover:ring-ring flex cursor-pointer items-center justify-between rounded-md px-3 py-2 transition-all hover:ring-2">
                      <span className="text-xs">Muted</span>
                    </div>
                  </ColorTokenPopover>
                  <ColorTokenPopover tokenName="--background" label="Background">
                    <div className="bg-background text-foreground hover:ring-ring flex cursor-pointer items-center justify-between rounded-md border px-3 py-2 transition-all hover:ring-2">
                      <span className="text-xs">Background</span>
                    </div>
                  </ColorTokenPopover>
                </div>
              </div>

              {/* Status - Destructive */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Status</h4>
                <div className="space-y-1">
                  <ColorTokenPopover tokenName="--destructive" label="Destructive">
                    <div className="bg-destructive text-destructive-foreground hover:ring-ring flex cursor-pointer items-center justify-between rounded-md px-3 py-2 transition-all hover:ring-2">
                      <span className="text-xs font-medium">Destructive</span>
                    </div>
                  </ColorTokenPopover>
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
                  <ColorTokenPopover tokenName="--success" label="Success">
                    <div className="bg-success text-success-foreground hover:ring-ring flex cursor-pointer items-center justify-between rounded-md px-3 py-2 transition-all hover:ring-2">
                      <span className="text-xs font-medium">Success</span>
                    </div>
                  </ColorTokenPopover>
                  <div className="bg-success/80 text-success-foreground flex items-center justify-between rounded-md px-3 py-2">
                    <span className="text-xs">80%</span>
                  </div>
                  <div className="bg-success/60 flex items-center justify-between rounded-md px-3 py-2">
                    <span className="text-xs">60%</span>
                  </div>
                  <div className="bg-success/40 flex items-center justify-between rounded-md px-3 py-2">
                    <span className="text-xs">40%</span>
                  </div>
                  <div className="bg-success/20 flex items-center justify-between rounded-md px-3 py-2">
                    <span className="text-xs">20%</span>
                  </div>
                  <ColorTokenPopover tokenName="--warning" label="Warning">
                    <div className="bg-warning text-warning-foreground hover:ring-ring flex cursor-pointer items-center justify-between rounded-md px-3 py-2 transition-all hover:ring-2">
                      <span className="text-xs font-medium">Warning</span>
                    </div>
                  </ColorTokenPopover>
                  <div className="bg-warning/80 text-warning-foreground flex items-center justify-between rounded-md px-3 py-2">
                    <span className="text-xs">80%</span>
                  </div>
                  <div className="bg-warning/60 flex items-center justify-between rounded-md px-3 py-2">
                    <span className="text-xs">60%</span>
                  </div>
                  <div className="bg-warning/40 flex items-center justify-between rounded-md px-3 py-2">
                    <span className="text-xs">40%</span>
                  </div>
                  <div className="bg-warning/20 flex items-center justify-between rounded-md px-3 py-2">
                    <span className="text-xs">20%</span>
                  </div>
                  <ColorTokenPopover tokenName="--info" label="Info">
                    <div className="bg-info text-info-foreground hover:ring-ring flex cursor-pointer items-center justify-between rounded-md px-3 py-2 transition-all hover:ring-2">
                      <span className="text-xs font-medium">Info</span>
                    </div>
                  </ColorTokenPopover>
                  <div className="bg-info/80 text-info-foreground flex items-center justify-between rounded-md px-3 py-2">
                    <span className="text-xs">80%</span>
                  </div>
                  <div className="bg-info/60 flex items-center justify-between rounded-md px-3 py-2">
                    <span className="text-xs">60%</span>
                  </div>
                  <div className="bg-info/40 flex items-center justify-between rounded-md px-3 py-2">
                    <span className="text-xs">40%</span>
                  </div>
                  <div className="bg-info/20 flex items-center justify-between rounded-md px-3 py-2">
                    <span className="text-xs">20%</span>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Charts</h4>
                <div className="space-y-1">
                  <ColorTokenPopover tokenName="--chart-1" label="Chart 1">
                    <div className="bg-chart-1 hover:ring-ring flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-white transition-all hover:ring-2">
                      <span className="text-xs font-medium">Chart 1</span>
                    </div>
                  </ColorTokenPopover>
                  <ColorTokenPopover tokenName="--chart-2" label="Chart 2">
                    <div className="bg-chart-2 hover:ring-ring flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-white transition-all hover:ring-2">
                      <span className="text-xs">Chart 2</span>
                    </div>
                  </ColorTokenPopover>
                  <ColorTokenPopover tokenName="--chart-3" label="Chart 3">
                    <div className="bg-chart-3 hover:ring-ring flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-white transition-all hover:ring-2">
                      <span className="text-xs">Chart 3</span>
                    </div>
                  </ColorTokenPopover>
                  <ColorTokenPopover tokenName="--chart-4" label="Chart 4">
                    <div className="bg-chart-4 hover:ring-ring flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-white transition-all hover:ring-2">
                      <span className="text-xs">Chart 4</span>
                    </div>
                  </ColorTokenPopover>
                  <ColorTokenPopover tokenName="--chart-5" label="Chart 5">
                    <div className="bg-chart-5 hover:ring-ring flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-white transition-all hover:ring-2">
                      <span className="text-xs">Chart 5</span>
                    </div>
                  </ColorTokenPopover>
                </div>
              </div>
            </div>

            {/* Interaktive Farben */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Interaktiv</h4>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                <ColorTokenPopover tokenName="--secondary" label="Secondary">
                  <div className="bg-secondary text-secondary-foreground hover:ring-ring cursor-pointer rounded-md px-3 py-2 text-center transition-all hover:ring-2">
                    <span className="text-xs">Secondary</span>
                  </div>
                </ColorTokenPopover>
                <ColorTokenPopover tokenName="--accent" label="Accent">
                  <div className="bg-accent text-accent-foreground hover:ring-ring cursor-pointer rounded-md px-3 py-2 text-center transition-all hover:ring-2">
                    <span className="text-xs">Accent</span>
                  </div>
                </ColorTokenPopover>
                <ColorTokenPopover tokenName="--card" label="Card">
                  <div className="bg-card text-card-foreground hover:ring-ring cursor-pointer rounded-md border px-3 py-2 text-center transition-all hover:ring-2">
                    <span className="text-xs">Card</span>
                  </div>
                </ColorTokenPopover>
                <ColorTokenPopover tokenName="--popover" label="Popover">
                  <div className="bg-popover text-popover-foreground hover:ring-ring cursor-pointer rounded-md border px-3 py-2 text-center transition-all hover:ring-2">
                    <span className="text-xs">Popover</span>
                  </div>
                </ColorTokenPopover>
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
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">--radius</Label>
                  <span className="text-muted-foreground font-mono text-xs">
                    {radiusValue.toFixed(2)}rem ({Math.round(radiusValue * 16)}px)
                  </span>
                </div>
                <Slider
                  value={[radiusValue]}
                  onValueChange={handleRadiusChange}
                  min={0}
                  max={2}
                  step={0.125}
                  className="w-full"
                />
              </div>
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

      <SaveThemeDialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen} />
    </PageContent>
  )
}
