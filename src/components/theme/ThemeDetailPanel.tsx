"use client"

import { useState, useEffect, useCallback } from "react"
import { RotateCcw, Save, Pipette } from "lucide-react"
import { useTheme as useColorMode } from "next-themes"
import Color from "color"
import { HexColorPicker, HexColorInput } from "react-colorful"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useThemeEditor } from "@/hooks/use-theme-editor"
import { SaveThemeDialog } from "@/components/theme/SaveThemeDialog"

/**
 * Konvertiert OKLCH zu Hex
 */
function oklchToHex(oklch: string): string {
  if (!oklch) return "#808080"
  if (oklch.startsWith("#")) return oklch
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas")
    canvas.width = 1
    canvas.height = 1
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.fillStyle = oklch
      ctx.fillRect(0, 0, 1, 1)
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
      return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`.toUpperCase()
    }
  }
  return "#808080"
}

/**
 * Konvertiert Hex zu RGB-String
 */
function hexToRgb(hex: string): string {
  try {
    const c = Color(hex)
    const rgb = c.rgb().array()
    return `rgb(${Math.round(rgb[0])}, ${Math.round(rgb[1])}, ${Math.round(rgb[2])})`
  } catch {
    return "rgb(128, 128, 128)"
  }
}

/**
 * Konvertiert Hex zu OKLCH-String (approximiert)
 */
function hexToOklch(hex: string): string {
  try {
    const c = Color(hex)
    const lab = c.lab().array()
    const l = (lab[0] / 100).toFixed(2)
    const chroma = (Math.sqrt(lab[1] * lab[1] + lab[2] * lab[2]) / 100).toFixed(2)
    const hue = Math.round(((Math.atan2(lab[2], lab[1]) * 180) / Math.PI + 360) % 360)
    return `oklch(${l} ${chroma} ${hue})`
  } catch {
    return "oklch(0.5 0 0)"
  }
}

/**
 * ThemeDetailPanel - Detail-Panel für Spalte 4
 *
 * Zeigt kontextabhängig den Editor für ausgewählte Elemente.
 * Immer sichtbar: Reset + Save Buttons oben.
 */
export function ThemeDetailPanel(): React.ReactElement {
  const { selectedElement, previewToken, resetPreview, getCurrentTokens } = useThemeEditor()
  const { theme: colorMode, resolvedTheme } = useColorMode()
  const isDarkMode = colorMode === "dark" || (colorMode === "system" && resolvedTheme === "dark")
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)

  // Für Color-Editor: Aktuelle Hex-Werte
  const [currentHex, setCurrentHex] = useState("#808080")
  const [currentOklch, setCurrentOklch] = useState("")

  // Lade Werte wenn Element ausgewählt wird
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!selectedElement) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset auf Default-Werte bei Deselection ist notwendig
      setCurrentHex("#808080")
      setCurrentOklch("")
      return
    }

    const tokens = getCurrentTokens()

    // Bei colorPair: Verwende foregroundTokenName wenn subType === "foreground"
    const tokenNameToUse =
      selectedElement.type === "colorPair" && selectedElement.subType === "foreground"
        ? selectedElement.foregroundTokenName || selectedElement.tokenName
        : selectedElement.tokenName

    const token = tokens[tokenNameToUse] || { light: "", dark: "" }
    const currentValue = isDarkMode ? token.dark : token.light

    if (currentValue) {
      setCurrentHex(oklchToHex(currentValue))
      setCurrentOklch(currentValue)
    }
  }, [selectedElement, isDarkMode, getCurrentTokens])

  const handleColorChange = useCallback(
    (hex: string) => {
      if (!selectedElement) return
      setCurrentHex(hex)
      // Konvertiere Hex zu OKLCH für previewToken
      const oklch = hexToOklch(hex)
      setCurrentOklch(oklch)

      // Bei colorPair: Verwende foregroundTokenName wenn subType === "foreground"
      const tokenNameToUse =
        selectedElement.type === "colorPair" && selectedElement.subType === "foreground"
          ? selectedElement.foregroundTokenName || selectedElement.tokenName
          : selectedElement.tokenName

      if (isDarkMode) {
        previewToken(tokenNameToUse, undefined, oklch)
      } else {
        previewToken(tokenNameToUse, oklch)
      }
    },
    [selectedElement, previewToken, isDarkMode]
  )

  const handleReset = useCallback(() => {
    if (!selectedElement) return
    const originalValue = isDarkMode
      ? selectedElement.originalDarkValue || selectedElement.originalValue
      : selectedElement.originalValue

    if (originalValue) {
      // Bei colorPair: Verwende foregroundTokenName wenn subType === "foreground"
      const tokenNameToUse =
        selectedElement.type === "colorPair" && selectedElement.subType === "foreground"
          ? selectedElement.foregroundTokenName || selectedElement.tokenName
          : selectedElement.tokenName

      if (isDarkMode) {
        previewToken(tokenNameToUse, undefined, originalValue)
      } else {
        previewToken(tokenNameToUse, originalValue)
      }
    }
  }, [selectedElement, previewToken, isDarkMode])

  const handlePickColor = useCallback(async () => {
    if (typeof window === "undefined" || !("EyeDropper" in window)) return

    try {
      // @ts-expect-error -- EyeDropper is not yet in TypeScript DOM types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const eyeDropper = new (window as any).EyeDropper()

      const result = await eyeDropper.open()

      if (result.sRGBHex) {
        handleColorChange(result.sRGBHex)
      }
    } catch (e) {
      console.error("EyeDropper failed", e)
    }
  }, [handleColorChange])

  return (
    <div className="flex h-full flex-col">
      {/* Header: Immer sichtbar - Reset + Save Buttons */}
      <div className="border-border flex items-center justify-between gap-2 border-b p-4">
        <Button variant="outline" size="sm" onClick={resetPreview} className="flex-1">
          <RotateCcw className="mr-2 size-4" />
          Zurücksetzen
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={() => setSaveDialogOpen(true)}
          className="flex-1"
        >
          <Save className="mr-2 size-4" />
          Neues Theme speichern
        </Button>
      </div>

      {/* Content: Kontextabhängig */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {!selectedElement ? (
            // Empty State
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="bg-muted rounded-full p-4">
                <RotateCcw className="text-muted-foreground size-8" />
              </div>
              <h3 className="text-foreground mt-4 text-lg font-medium">Kein Element ausgewählt</h3>
              <p className="text-muted-foreground mt-2 text-sm">
                Wähle ein Element zum Bearbeiten aus, um es hier zu bearbeiten.
              </p>
            </div>
          ) : selectedElement.type === "color" || selectedElement.type === "colorPair" ? (
            // Color Editor
            <div className="space-y-6">
              <div>
                <Label className="text-foreground mb-2 text-sm font-medium">Farbe bearbeiten</Label>
                <p className="text-muted-foreground text-xs">
                  {selectedElement.type === "colorPair" && selectedElement.subType
                    ? `${selectedElement.subType === "background" ? "Hintergrund" : "Vordergrund"}-Farbe`
                    : "Farbe"}
                </p>
              </div>

              {/* Color Picker - Inline ohne Popover */}
              <div className="space-y-4">
                {/* Picker */}
                <div className="custom-colorful overflow-hidden rounded-md shadow-md">
                  <HexColorPicker
                    color={currentHex}
                    onChange={handleColorChange}
                    style={{ width: "100%" }}
                  />
                </div>

                {/* Hex Input mit Pipette */}
                <div className="relative w-full">
                  <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                    #
                  </span>
                  <HexColorInput
                    color={currentHex}
                    onChange={handleColorChange}
                    prefixed={false}
                    className="border-input bg-background text-foreground focus-visible:ring-ring h-10 w-full rounded-md border py-2 pr-10 pl-7 font-mono text-sm uppercase shadow-sm focus-visible:ring-1 focus-visible:outline-hidden"
                  />
                  {/* Pipette im Input-Feld */}
                  {typeof window !== "undefined" && "EyeDropper" in window && (
                    <button
                      type="button"
                      onClick={handlePickColor}
                      className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                      title="Farbe vom Bildschirm picken"
                    >
                      <Pipette className="size-4" />
                    </button>
                  )}
                </div>

                {/* Farbwerte - kompakt, ohne Rahmen */}
                <div className="text-muted-foreground space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>RGB</span>
                    <span className="font-mono">{hexToRgb(currentHex)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>OKLCH</span>
                    <span className="font-mono">{currentOklch || "—"}</span>
                  </div>
                </div>

                {/* Reset Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="text-muted-foreground hover:text-foreground w-full"
                >
                  <RotateCcw className="mr-2 size-3" />
                  Zurücksetzen
                </Button>
              </div>
            </div>
          ) : selectedElement.type === "font" ? (
            // Font Editor (später implementieren)
            <div className="space-y-6">
              <div>
                <Label className="text-foreground mb-2 text-sm font-medium">
                  Schriftart bearbeiten
                </Label>
                <p className="text-muted-foreground text-xs">Font-Editor wird noch implementiert</p>
              </div>
            </div>
          ) : (
            // Andere Typen (Radius, Shadow, etc.)
            <div className="space-y-6">
              <div>
                <Label className="text-foreground mb-2 text-sm font-medium">
                  Element bearbeiten
                </Label>
                <p className="text-muted-foreground text-xs">
                  Editor für diesen Typ wird noch implementiert
                </p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Save Dialog */}
      <SaveThemeDialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen} />
    </div>
  )
}
