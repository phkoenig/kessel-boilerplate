"use client"

import { useEffect, useCallback, useRef, useState } from "react"
import { useTheme as useColorMode } from "next-themes"
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
 * Konvertiert eine beliebige CSS-Farbe zu OKLCH-String.
 * Verwendet Canvas um die Farbe zu rendern und dann zu OKLCH zu konvertieren.
 */
function anyColorToOklch(cssColor: string): string {
  if (!cssColor || typeof document === "undefined") return "oklch(0.5 0 0)"

  // Bereits OKLCH? Direkt zurückgeben
  if (cssColor.startsWith("oklch(")) return cssColor

  try {
    // Canvas nutzen um beliebige CSS-Farbe zu RGB zu konvertieren
    const canvas = document.createElement("canvas")
    canvas.width = 1
    canvas.height = 1
    const ctx = canvas.getContext("2d")
    if (!ctx) return "oklch(0.5 0 0)"

    ctx.fillStyle = cssColor
    ctx.fillRect(0, 0, 1, 1)
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data

    // sRGB zu Linear RGB
    const toLinear = (c: number) => {
      const v = c / 255
      return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    }

    const lr = toLinear(r)
    const lg = toLinear(g)
    const lb = toLinear(b)

    // Linear RGB zu XYZ (D65)
    const x = 0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb
    const y = 0.2126729 * lr + 0.7151522 * lg + 0.072175 * lb
    const z = 0.0193339 * lr + 0.119192 * lg + 0.9503041 * lb

    // XYZ zu OKLab
    const l_ = Math.cbrt(0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z)
    const m_ = Math.cbrt(0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z)
    const s_ = Math.cbrt(0.0482003018 * x + 0.2643662691 * y + 0.633851707 * z)

    const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_
    const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_
    const okb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_

    // OKLab zu OKLCH
    const C = Math.sqrt(a * a + okb * okb)
    let H = Math.atan2(okb, a) * (180 / Math.PI)
    if (H < 0) H += 360

    return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)})`
  } catch {
    return "oklch(0.5 0 0)"
  }
}

/**
 * Konvertiert eine beliebige CSS-Farbe zu Hex.
 */
function anyColorToHex(cssColor: string): string {
  if (!cssColor || typeof document === "undefined") return "#808080"
  if (cssColor.startsWith("#") && cssColor.length === 7) return cssColor

  try {
    const canvas = document.createElement("canvas")
    canvas.width = 1
    canvas.height = 1
    const ctx = canvas.getContext("2d")
    if (!ctx) return "#808080"

    ctx.fillStyle = cssColor
    ctx.fillRect(0, 0, 1, 1)
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
  } catch {
    return "#808080"
  }
}

/**
 * ColorPairSwatch - Zeigt ein Farbpaar als breites Rechteck (256×64)
 *
 * Layout: Rechteck LINKS, Beschreibung RECHTS (3 Zeilen)
 *
 * Bei Klick wird das Element im Detail-Panel ausgewählt.
 * Zeigt immer OKLCH-Werte an und aktualisiert sich in Real-Time.
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

  // Anzeige-Werte - OKLCH Format
  const [bgOklch, setBgOklch] = useState("")
  const [bgHex, setBgHex] = useState("#808080")

  // Track ob wir die Originalwerte schon geladen haben
  const hasLoadedOriginals = useRef(false)

  /**
   * Liest den aktuellen computed CSS-Wert und konvertiert zu OKLCH.
   * Das stellt sicher, dass Real-Time Updates funktionieren.
   */
  const updateDisplayValues = useCallback(() => {
    if (typeof window === "undefined") return

    // Computed style lesen - das ist immer der aktuelle Wert
    const computedStyle = getComputedStyle(document.documentElement)
    const computedBg = computedStyle.getPropertyValue(tokenName).trim()

    if (computedBg) {
      // Konvertiere zu OKLCH für einheitliche Anzeige
      const oklch = anyColorToOklch(computedBg)
      const hex = anyColorToHex(computedBg)
      setBgOklch(oklch)
      setBgHex(hex)
    }
  }, [tokenName])

  // Lade Originalwerte einmal beim Mount
  useEffect(() => {
    if (typeof window === "undefined") return
    if (hasLoadedOriginals.current) return

    const loadOriginals = () => {
      const tokens = getCurrentTokens()
      const bgToken = tokens[tokenName] || { light: "", dark: "" }

      originalBgRef.current = { light: bgToken.light, dark: bgToken.dark }
      hasLoadedOriginals.current = true

      // Initial display values laden
      updateDisplayValues()
    }

    const timeout = setTimeout(loadOriginals, 50)
    return () => clearTimeout(timeout)
  }, [tokenName, foregroundTokenName, getCurrentTokens, updateDisplayValues])

  // Real-Time Updates: Überwache CSS-Änderungen
  useEffect(() => {
    if (typeof window === "undefined") return

    // Polling für Real-Time Updates (alle 100ms)
    const interval = setInterval(updateDisplayValues, 100)

    return () => clearInterval(interval)
  }, [updateDisplayValues])

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

  return (
    <div className="flex items-start gap-6" data-swatch>
      {/* Swatch Container - LINKS (nur Background-Farbe) */}
      <div className="group relative h-16 w-64 shrink-0">
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
      </div>

      {/* Beschreibung - RECHTS (3 Zeilen) */}
      <div className="flex min-w-0 flex-1 flex-col py-1">
        {/* Zeile 1: Name */}
        <span className="text-foreground text-sm font-medium">{name}</span>
        {/* Zeile 2: Beschreibung */}
        <span className="text-muted-foreground truncate text-xs">{description}</span>
        {/* Zeile 3: Farbwerte - immer OKLCH + Hex */}
        <div className="text-muted-foreground flex gap-4 font-mono text-xs">
          <span title={bgOklch}>{bgOklch || "oklch(0.5 0 0)"}</span>
          <span className="opacity-50">|</span>
          <span>{bgHex}</span>
        </div>
      </div>
    </div>
  )
}
