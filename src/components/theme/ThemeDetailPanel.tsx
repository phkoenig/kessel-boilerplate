"use client"

import { useState, useEffect, useCallback } from "react"
import { RotateCcw, Save, Pipette } from "lucide-react"
import { useTheme as useColorMode } from "next-themes"
import { parse, formatHex, converter } from "culori"
import { HexColorPicker, HexColorInput } from "react-colorful"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useThemeEditor } from "@/hooks/use-theme-editor"
import { SaveThemeDialog } from "@/components/theme/SaveThemeDialog"

// Culori Converter für OKLCH
const toOklch = converter("oklch")

/**
 * Konvertiert OKLCH zu Hex (mit culori)
 */
function oklchToHex(oklch: string): string {
  if (!oklch) return "#808080"
  if (oklch.startsWith("#")) return oklch
  try {
    const color = parse(oklch)
    if (!color) return "#808080"
    const hex = formatHex(color)
    return hex ? hex.toUpperCase() : "#808080"
  } catch {
    return "#808080"
  }
}

/**
 * Konvertiert Hex zu OKLCH-String (mit culori - akkurate Konvertierung)
 */
function hexToOklch(hex: string): string {
  try {
    const color = parse(hex)
    if (!color) return "oklch(0.5 0 0)"
    const oklch = toOklch(color)
    if (!oklch) return "oklch(0.5 0 0)"
    // L: 0-1, C: 0-0.4 (typisch), H: 0-360
    const l = oklch.l?.toFixed(2) ?? "0.5"
    const c = oklch.c?.toFixed(3) ?? "0"
    const h = oklch.h !== undefined && !isNaN(oklch.h) ? Math.round(oklch.h) : 0
    return `oklch(${l} ${c} ${h})`
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
  const { selectedElement, previewToken, getCurrentTokens } = useThemeEditor()
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

      // Auch die lokalen States zurücksetzen, damit der Color Picker springt
      const hex = oklchToHex(originalValue)
      setCurrentHex(hex)
      setCurrentOklch(originalValue)
    }
  }, [selectedElement, previewToken, isDarkMode])

  const handlePickColor = useCallback(async () => {
    if (typeof window === "undefined" || !("EyeDropper" in window)) return

    try {
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
                <HexColorPicker
                  color={currentHex}
                  onChange={handleColorChange}
                  className="color-picker-clean"
                />

                {/* Hex Input mit Pipette */}
                <div className="relative w-full">
                  <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                    #
                  </span>
                  <HexColorInput
                    color={currentHex}
                    onChange={handleColorChange}
                    prefixed={false}
                    className="border-input bg-background text-foreground focus-visible:ring-ring color-picker-input h-10 w-full border py-2 pr-10 pl-7 font-mono text-sm uppercase focus-visible:ring-1 focus-visible:outline-hidden"
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

/**
 * ThemeDetailPanel Save Button - Wird von DetailDrawer gerendert
 */
export function ThemeDetailPanelSaveButton(): React.ReactElement {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)

  return (
    <>
      <Button
        variant="default"
        size="sm"
        onClick={() => setSaveDialogOpen(true)}
        className="mx-4 mb-6 w-[calc(100%-2rem)] whitespace-nowrap"
      >
        <Save className="mr-2 size-4 shrink-0" />
        Theme speichern
      </Button>
      <SaveThemeDialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen} />
    </>
  )
}
