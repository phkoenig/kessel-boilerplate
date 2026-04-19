"use client"

import { useEffect, useCallback, useRef, useState } from "react"
import { useTheme as useColorMode } from "next-themes"
import { cn } from "@/lib/utils"
import { THEME_EDITOR_PREVIEW_EVENT, useThemeEditor } from "@/hooks/use-theme-editor"

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
  if (cssColor.startsWith("oklch(")) return cssColor

  try {
    const canvas = document.createElement("canvas")
    canvas.width = 1
    canvas.height = 1
    const ctx = canvas.getContext("2d")
    if (!ctx) return "oklch(0.5 0 0)"

    ctx.fillStyle = cssColor
    ctx.fillRect(0, 0, 1, 1)
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data

    const toLinear = (c: number) => {
      const v = c / 255
      return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    }

    const lr = toLinear(r)
    const lg = toLinear(g)
    const lb = toLinear(b)

    const x = 0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb
    const y = 0.2126729 * lr + 0.7151522 * lg + 0.072175 * lb
    const z = 0.0193339 * lr + 0.119192 * lg + 0.9503041 * lb

    const l_ = Math.cbrt(0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z)
    const m_ = Math.cbrt(0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z)
    const s_ = Math.cbrt(0.0482003018 * x + 0.2643662691 * y + 0.633851707 * z)

    const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_
    const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_
    const okb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_

    const C = Math.sqrt(a * a + okb * okb)
    let H = Math.atan2(okb, a) * (180 / Math.PI)
    if (H < 0) H += 360

    return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)})`
  } catch {
    return "oklch(0.5 0 0)"
  }
}

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
 * Layout (TweakCN-Style):
 *   - Aeusseres Rechteck in Background-Farbe
 *   - Inneres, eingerueckt platziertes Rechteck in Foreground-Farbe
 *   - Beide Rechtecke sind separat klickbar und selektieren das entsprechende
 *     Token im Theme-Editor
 *   - Rechts Name + Beschreibung + OKLCH/Hex Werte (BG und FG)
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

  const isSelected =
    selectedElement?.type === "colorPair" &&
    selectedElement.tokenName === tokenName &&
    selectedElement.foregroundTokenName === foregroundTokenName
  const isBgSelected = isSelected && selectedElement?.subType === "background"
  const isFgSelected = isSelected && selectedElement?.subType === "foreground"

  const originalBgRef = useRef<{ light: string; dark: string }>({ light: "", dark: "" })
  const originalFgRef = useRef<{ light: string; dark: string }>({ light: "", dark: "" })

  const [bgOklch, setBgOklch] = useState("")
  const [bgHex, setBgHex] = useState("#808080")
  const [fgOklch, setFgOklch] = useState("")
  const [fgHex, setFgHex] = useState("#808080")

  const hasLoadedOriginals = useRef(false)

  const updateDisplayValues = useCallback(() => {
    if (typeof window === "undefined") return

    const computedStyle = getComputedStyle(document.documentElement)
    const computedBg = computedStyle.getPropertyValue(tokenName).trim()
    const computedFg = computedStyle.getPropertyValue(foregroundTokenName).trim()

    if (computedBg) {
      setBgOklch(anyColorToOklch(computedBg))
      setBgHex(anyColorToHex(computedBg))
    }
    if (computedFg) {
      setFgOklch(anyColorToOklch(computedFg))
      setFgHex(anyColorToHex(computedFg))
    }
  }, [tokenName, foregroundTokenName])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (hasLoadedOriginals.current) return

    const loadOriginals = () => {
      const tokens = getCurrentTokens()
      const bgToken = tokens[tokenName] || { light: "", dark: "" }
      const fgToken = tokens[foregroundTokenName] || { light: "", dark: "" }

      originalBgRef.current = { light: bgToken.light, dark: bgToken.dark }
      originalFgRef.current = { light: fgToken.light, dark: fgToken.dark }
      hasLoadedOriginals.current = true

      updateDisplayValues()
    }

    const timeout = setTimeout(loadOriginals, 50)
    return () => clearTimeout(timeout)
  }, [tokenName, foregroundTokenName, getCurrentTokens, updateDisplayValues])

  useEffect(() => {
    if (typeof window === "undefined") return
    const handlePreviewUpdate = () => updateDisplayValues()
    window.addEventListener(THEME_EDITOR_PREVIEW_EVENT, handlePreviewUpdate)
    return () => window.removeEventListener(THEME_EDITOR_PREVIEW_EVENT, handlePreviewUpdate)
  }, [updateDisplayValues])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      updateDisplayValues()
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [isDarkMode, updateDisplayValues])

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

  const handleFgClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation()
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
    },
    [tokenName, foregroundTokenName, setSelectedElement, isDarkMode, getCurrentTokens]
  )

  return (
    <div className="flex items-start gap-6" data-swatch>
      {/* Swatch Container - LINKS: Background-Rechteck mit inneren Foreground-Rechteck (TweakCN) */}
      <div className="group relative h-16 w-64 shrink-0">
        <div
          className={cn(
            "absolute inset-0 cursor-pointer rounded-lg border shadow-sm transition-all",
            isBgSelected ? "ring-ring ring-2" : "hover:ring-ring hover:ring-2"
          )}
          style={{
            backgroundColor: `var(${tokenName})`,
            borderRadius: "var(--radius)",
          }}
          onClick={handleBgClick}
          role="button"
          aria-label={`${name} Background auswaehlen`}
        />
        <div
          className={cn(
            "absolute inset-y-2 right-2 w-20 cursor-pointer rounded-md border shadow-sm transition-all",
            isFgSelected ? "ring-ring ring-2" : "hover:ring-ring hover:ring-2"
          )}
          style={{
            backgroundColor: `var(${foregroundTokenName})`,
            borderRadius: "calc(var(--radius) - 2px)",
          }}
          onClick={handleFgClick}
          role="button"
          aria-label={`${name} Foreground auswaehlen`}
        />
      </div>

      {/* Beschreibung - RECHTS */}
      <div className="flex min-w-0 flex-1 flex-col py-1">
        <span className="text-foreground text-sm font-medium">{name}</span>
        <span className="text-muted-foreground truncate text-xs">{description}</span>
        <div className="text-muted-foreground mt-0.5 flex flex-col gap-0.5 font-mono text-xs">
          <div className="flex gap-2">
            <span className="text-foreground/70 w-3 shrink-0">BG</span>
            <span title={bgOklch} className="truncate">
              {bgOklch || "oklch(0.5 0 0)"}
            </span>
            <span className="opacity-50">|</span>
            <span>{bgHex}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-foreground/70 w-3 shrink-0">FG</span>
            <span title={fgOklch} className="truncate">
              {fgOklch || "oklch(0.5 0 0)"}
            </span>
            <span className="opacity-50">|</span>
            <span>{fgHex}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
