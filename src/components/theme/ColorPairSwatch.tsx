"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { RotateCcw } from "lucide-react"
import { useTheme as useColorMode } from "next-themes"
import { Button } from "@/components/ui/button"
import { useThemeEditor } from "@/hooks/use-theme-editor"

interface ColorPairSwatchProps {
  /** Token-Name für Background (z.B. "--primary") */
  tokenName: string
  /** Token-Name für Foreground (z.B. "--primary-foreground") */
  foregroundTokenName: string
  /** Label für die Anzeige */
  label: string
}

/**
 * Konvertiert OKLCH zu Hex für den nativen Color-Picker
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
 * ColorPairSwatch - Zeigt ein Farbpaar als breites Rechteck (256×64)
 *
 * Äußeres Rechteck: Background-Farbe (klickbar → Color-Picker)
 * Inneres Rechteck: Foreground-Farbe (links zentriert, klickbar → Color-Picker)
 * Reset-Icon oben rechts: Setzt auf Original-Theme-Werte zurück
 *
 * Dark Mode wird automatisch berechnet und nicht angezeigt.
 */
export function ColorPairSwatch({
  tokenName,
  foregroundTokenName,
  label,
}: ColorPairSwatchProps): React.ReactElement {
  const { previewToken, getCurrentTokens } = useThemeEditor()
  const { theme: colorMode, resolvedTheme } = useColorMode()

  const isDarkMode = colorMode === "dark" || (colorMode === "system" && resolvedTheme === "dark")

  // Hidden Color Inputs
  const bgInputRef = useRef<HTMLInputElement>(null)
  const fgInputRef = useRef<HTMLInputElement>(null)

  // Aktuelle Werte (Hex für Color-Picker)
  const [bgValue, setBgValue] = useState("#808080")
  const [fgValue, setFgValue] = useState("#808080")

  // Original-Werte (für Reset)
  const [originalBg, setOriginalBg] = useState<{ light: string; dark: string }>({
    light: "",
    dark: "",
  })
  const [originalFg, setOriginalFg] = useState<{ light: string; dark: string }>({
    light: "",
    dark: "",
  })

  // Lade initiale Werte
  useEffect(() => {
    if (typeof window === "undefined") return

    const loadValues = () => {
      const tokens = getCurrentTokens()
      const bgToken = tokens[tokenName] || { light: "", dark: "" }
      const fgToken = tokens[foregroundTokenName] || { light: "", dark: "" }

      const currentBgValue = isDarkMode ? bgToken.dark : bgToken.light
      const currentFgValue = isDarkMode ? fgToken.dark : fgToken.light

      setBgValue(oklchToHex(currentBgValue))
      setFgValue(oklchToHex(currentFgValue))

      setOriginalBg((prev) => {
        if (isDarkMode) {
          return { light: prev.light, dark: currentBgValue || prev.dark }
        } else {
          return { light: currentBgValue || prev.light, dark: prev.dark }
        }
      })
      setOriginalFg((prev) => {
        if (isDarkMode) {
          return { light: prev.light, dark: currentFgValue || prev.dark }
        } else {
          return { light: currentFgValue || prev.light, dark: prev.dark }
        }
      })
    }

    const timeout = setTimeout(loadValues, 50)
    return () => clearTimeout(timeout)
  }, [tokenName, foregroundTokenName, getCurrentTokens, isDarkMode])

  const handleBgChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const hex = e.target.value
      setBgValue(hex)
      if (isDarkMode) {
        previewToken(tokenName, undefined, hex)
      } else {
        previewToken(tokenName, hex)
      }
    },
    [tokenName, previewToken, isDarkMode]
  )

  const handleFgChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const hex = e.target.value
      setFgValue(hex)
      if (isDarkMode) {
        previewToken(foregroundTokenName, undefined, hex)
      } else {
        previewToken(foregroundTokenName, hex)
      }
    },
    [foregroundTokenName, previewToken, isDarkMode]
  )

  const handleReset = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      const bgOriginal = isDarkMode ? originalBg.dark : originalBg.light
      const fgOriginal = isDarkMode ? originalFg.dark : originalFg.light

      if (bgOriginal) {
        setBgValue(oklchToHex(bgOriginal))
        if (isDarkMode) {
          previewToken(tokenName, undefined, bgOriginal)
        } else {
          previewToken(tokenName, bgOriginal, undefined)
        }
      }
      if (fgOriginal) {
        setFgValue(oklchToHex(fgOriginal))
        if (isDarkMode) {
          previewToken(foregroundTokenName, undefined, fgOriginal)
        } else {
          previewToken(foregroundTokenName, fgOriginal, undefined)
        }
      }
    },
    [tokenName, foregroundTokenName, originalBg, originalFg, previewToken, isDarkMode]
  )

  const handleBgClick = useCallback(() => {
    bgInputRef.current?.click()
  }, [])

  const handleFgClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    fgInputRef.current?.click()
  }, [])

  // Inneres Rechteck: 90×26px (70% von 128px Breite, 20% von 128px Höhe aus altem Design)
  // Padding: 12px (gleich oben/unten/links)
  const innerPadding = 12
  const innerWidth = 90
  const innerHeight = 26

  return (
    <div className="flex items-center gap-4">
      {/* Label links */}
      <span className="text-muted-foreground w-32 shrink-0 text-sm">{label}</span>

      {/* Swatch Container */}
      <div className="group relative h-16 w-64">
        {/* Hidden Color Inputs */}
        {}
        <input
          ref={bgInputRef}
          type="color"
          value={bgValue}
          onChange={handleBgChange}
          className="sr-only"
          tabIndex={-1}
        />
        {}
        <input
          ref={fgInputRef}
          type="color"
          value={fgValue}
          onChange={handleFgChange}
          className="sr-only"
          tabIndex={-1}
        />

        {/* Äußeres Rechteck - Background */}
        <div
          onClick={handleBgClick}
          className="hover:ring-ring absolute inset-0 cursor-pointer rounded-lg border shadow-sm transition-all hover:ring-2"
          style={{
            backgroundColor: `var(${tokenName})`,
            borderRadius: "var(--radius)",
          }}
        />

        {/* Inneres Rechteck - Foreground (links zentriert) */}
        <div
          onClick={handleFgClick}
          className="hover:ring-ring absolute z-10 cursor-pointer rounded-sm transition-all hover:ring-2"
          style={{
            backgroundColor: `var(${foregroundTokenName})`,
            width: innerWidth,
            height: innerHeight,
            left: innerPadding,
            top: "50%",
            transform: "translateY(-50%)",
            borderRadius: "var(--radius-sm)",
          }}
        />

        {/* Reset-Icon oben rechts */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleReset}
          className="bg-background/80 hover:bg-background absolute top-2 right-2 z-20 size-6 rounded-full opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
          title="Auf Original zurücksetzen"
        >
          <RotateCcw className="text-muted-foreground size-3" />
        </Button>
      </div>
    </div>
  )
}
