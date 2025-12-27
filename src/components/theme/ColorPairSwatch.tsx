"use client"

import { useEffect, useCallback, useRef, useState } from "react"
import { useTheme as useColorMode } from "next-themes"
import Color from "color"
import { cn } from "@/lib/utils"
import { useThemeEditor } from "@/hooks/use-theme-editor"

interface ColorPairSwatchProps {
  /** Token-Name für Background (z.B. "--primary") */
  tokenName: string
  /** Token-Name für Foreground (z.B. "--primary-foreground") */
  foregroundTokenName: string
  /** Name für die Anzeige */
  name: string
  /** Beschreibung wo/wie verwendet */
  description: string
}

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
      return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
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
 * ColorPairSwatch - Zeigt ein Farbpaar als breites Rechteck (256×64)
 *
 * Layout: Rechteck LINKS, Beschreibung RECHTS (3 Zeilen)
 *
 * Bei Klick wird das Element im Detail-Panel ausgewählt.
 */
export function ColorPairSwatch({
  tokenName,
  foregroundTokenName,
  name,
  description,
}: ColorPairSwatchProps): React.ReactElement {
  const { getCurrentTokens, setSelectedElement, selectedElement } = useThemeEditor()
  const { theme: colorMode, resolvedTheme } = useColorMode()

  const isDarkMode = colorMode === "dark" || (colorMode === "system" && resolvedTheme === "dark")

  // Prüfe ob dieses Element ausgewählt ist
  const isSelected =
    selectedElement?.type === "colorPair" &&
    selectedElement.tokenName === tokenName &&
    selectedElement.foregroundTokenName === foregroundTokenName

  // Original-Werte (für Selection)
  const originalBgRef = useRef<{ light: string; dark: string }>({ light: "", dark: "" })
  const originalFgRef = useRef<{ light: string; dark: string }>({ light: "", dark: "" })

  // Anzeige-Werte (erst nach Mount geladen, um Hydration-Mismatch zu vermeiden)
  const [bgOklch, setBgOklch] = useState("")
  const [bgHex, setBgHex] = useState("#808080")

  // Track ob wir schon geladen haben
  const hasLoaded = useRef(false)

  // Lade initiale Werte - nur einmal beim Mount
  useEffect(() => {
    if (typeof window === "undefined") return
    if (hasLoaded.current) return

    const loadValues = () => {
      const tokens = getCurrentTokens()
      const bgToken = tokens[tokenName] || { light: "", dark: "" }
      const fgToken = tokens[foregroundTokenName] || { light: "", dark: "" }

      originalBgRef.current = { light: bgToken.light, dark: bgToken.dark }
      originalFgRef.current = { light: fgToken.light, dark: fgToken.dark }

      // Anzeige-Werte setzen
      const currentBgValue = isDarkMode ? bgToken.dark : bgToken.light
      if (currentBgValue) {
        setBgOklch(currentBgValue)
        setBgHex(oklchToHex(currentBgValue))
      }

      hasLoaded.current = true
    }

    const timeout = setTimeout(loadValues, 50)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenName, foregroundTokenName, isDarkMode])

  const handleBgClick = useCallback(() => {
    const tokens = getCurrentTokens()
    const bgToken = tokens[tokenName] || { light: "", dark: "" }
    const currentBgValue = isDarkMode ? bgToken.dark : bgToken.light
    const originalBgValue = isDarkMode ? originalBgRef.current.dark : originalBgRef.current.light

    setSelectedElement({
      type: "colorPair",
      tokenName,
      foregroundTokenName,
      subType: "background",
      originalValue: originalBgValue || currentBgValue || "",
      originalDarkValue: originalBgRef.current.dark || "",
    })
  }, [tokenName, foregroundTokenName, setSelectedElement, isDarkMode, getCurrentTokens])

  const handleFgClick = useCallback(() => {
    const tokens = getCurrentTokens()
    const fgToken = tokens[foregroundTokenName] || { light: "", dark: "" }
    const currentFgValue = isDarkMode ? fgToken.dark : fgToken.light
    const originalFgValue = isDarkMode ? originalFgRef.current.dark : originalFgRef.current.light

    setSelectedElement({
      type: "colorPair",
      tokenName,
      foregroundTokenName,
      subType: "foreground",
      originalValue: originalFgValue || currentFgValue || "",
      originalDarkValue: originalFgRef.current.dark || "",
    })
  }, [tokenName, foregroundTokenName, setSelectedElement, isDarkMode, getCurrentTokens])

  // Inneres Rechteck: 90×26px
  const innerPadding = 12
  const innerWidth = 90
  const innerHeight = 26

  return (
    <div className="flex items-start gap-6">
      {/* Swatch Container - LINKS */}
      <div className="group relative h-16 w-64 shrink-0">
        {/* Background Farbe - äußeres Rechteck */}
        <div
          className={cn(
            "absolute inset-0 cursor-pointer rounded-lg border shadow-sm transition-all hover:ring-2",
            isSelected && selectedElement?.subType === "background"
              ? "ring-ring ring-2"
              : "hover:ring-ring"
          )}
          style={{
            backgroundColor: `var(${tokenName})`,
            borderRadius: "var(--radius)",
          }}
          onClick={handleBgClick}
        />

        {/* Foreground Farbe - inneres Rechteck (links zentriert) */}
        <div
          className={cn(
            "absolute z-10 cursor-pointer rounded-sm transition-all hover:ring-2",
            isSelected && selectedElement?.subType === "foreground"
              ? "ring-ring ring-2"
              : "hover:ring-ring"
          )}
          style={{
            backgroundColor: `var(${foregroundTokenName})`,
            width: innerWidth,
            height: innerHeight,
            left: innerPadding,
            top: "50%",
            transform: "translateY(-50%)",
            borderRadius: "var(--radius-sm)",
          }}
          onClick={handleFgClick}
        />
      </div>

      {/* Beschreibung - RECHTS (3 Zeilen) */}
      <div className="flex min-w-0 flex-1 flex-col py-1">
        {/* Zeile 1: Name */}
        <span className="text-foreground text-sm font-medium">{name}</span>
        {/* Zeile 2: Beschreibung */}
        <span className="text-muted-foreground truncate text-xs">{description}</span>
        {/* Zeile 3: Farbwerte */}
        <div className="text-muted-foreground flex gap-4 font-mono text-xs">
          <span title={bgOklch}>{bgOklch ? bgOklch.substring(0, 25) : bgHex}</span>
          <span className="opacity-50">|</span>
          <span>{hexToRgb(bgHex)}</span>
        </div>
      </div>
    </div>
  )
}
