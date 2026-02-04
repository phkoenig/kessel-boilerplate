"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { PageContent, PageHeader } from "@/components/shell"
import { useExplorer, useDetailDrawer } from "@/components/shell"
import { ThemeDetailPanel } from "@/components/theme/ThemeDetailPanel"
import { useTheme as useColorMode } from "next-themes"
import Color from "color"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ColorPicker } from "@/components/ui/color-picker"
import { Palette, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/lib/themes"
import { useThemeEditor } from "@/hooks/use-theme-editor"
import { ColorPairSwatch } from "@/components/theme/ColorPairSwatch"
import { CornerStyleSwitch } from "@/components/theme/CornerStyleSwitch"
import { FontSelect } from "@/components/theme/FontSelect"
import { loadGoogleFont } from "@/lib/fonts/dynamic-loader"
import { useCurrentNavItem } from "@/lib/navigation/use-current-nav-item"

/**
 * Konvertiert beliebige CSS-Farbe zu OKLCH.
 * Unterstützt: oklch(), lab(), rgb(), hex, hsl(), etc.
 */
function anyColorToOklch(cssColor: string): { l: number; c: number; h: number } | null {
  if (!cssColor || typeof document === "undefined") return null

  // Bereits OKLCH? Parsen
  const oklchMatch = cssColor.match(/oklch\(([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\)/)
  if (oklchMatch) {
    return {
      l: parseFloat(oklchMatch[1]),
      c: parseFloat(oklchMatch[2]),
      h: parseFloat(oklchMatch[3]),
    }
  }

  try {
    // Canvas nutzen um beliebige CSS-Farbe zu RGB zu konvertieren
    const canvas = document.createElement("canvas")
    canvas.width = 1
    canvas.height = 1
    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    ctx.fillStyle = cssColor
    ctx.fillRect(0, 0, 1, 1)
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data

    // sRGB zu Linear RGB
    const toLinear = (val: number) => {
      const v = val / 255
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

    return { l: L, c: C, h: H }
  } catch {
    return null
  }
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
 * Konvertiert eine beliebige CSS-Farbe zu OKLCH-String.
 */
function anyColorToOklchString(cssColor: string): string {
  const oklch = anyColorToOklch(cssColor)
  if (!oklch) return "oklch(0.5 0 0)"
  return `oklch(${oklch.l.toFixed(3)} ${oklch.c.toFixed(3)} ${oklch.h.toFixed(1)})`
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
 * SingleColorSwatch - Einzelne Farbe (Border, Chart, etc.)
 * Mit Real-Time OKLCH-Anzeige.
 */
function SingleColorSwatch({
  tokenName,
  name,
  description,
  variant = "filled",
}: {
  tokenName: string
  name: string
  description: string
  variant?: "filled" | "border" | "gradient"
}): React.ReactElement {
  const { getCurrentTokens, setSelectedElement, selectedElement } = useThemeEditor()
  const { theme: colorMode, resolvedTheme } = useColorMode()
  const isDarkMode = colorMode === "dark" || (colorMode === "system" && resolvedTheme === "dark")

  const originalValueRef = useRef<{ light: string; dark: string }>({ light: "", dark: "" })
  const hasLoadedOriginals = useRef(false)

  // Anzeige-Werte - immer OKLCH
  const [oklchStr, setOklchStr] = useState("")
  const [hex, setHex] = useState("#808080")

  /**
   * Liest den aktuellen computed CSS-Wert und konvertiert zu OKLCH.
   */
  const updateDisplayValues = useCallback(() => {
    if (typeof window === "undefined") return

    const computedStyle = getComputedStyle(document.documentElement)
    const computedValue = computedStyle.getPropertyValue(tokenName).trim()

    if (computedValue) {
      setOklchStr(anyColorToOklchString(computedValue))
      setHex(anyColorToHex(computedValue))
    }
  }, [tokenName])

  // Lade Originalwerte einmal beim Mount
  useEffect(() => {
    if (typeof window === "undefined") return
    if (hasLoadedOriginals.current) return

    const loadOriginals = () => {
      const tokens = getCurrentTokens()
      const token = tokens[tokenName] || { light: "", dark: "" }
      originalValueRef.current = { light: token.light, dark: token.dark }
      hasLoadedOriginals.current = true
      updateDisplayValues()
    }

    const timeout = setTimeout(loadOriginals, 50)
    return () => clearTimeout(timeout)
  }, [tokenName, getCurrentTokens, updateDisplayValues])

  // Real-Time Updates: Polling alle 100ms
  useEffect(() => {
    if (typeof window === "undefined") return

    const interval = setInterval(updateDisplayValues, 100)
    return () => clearInterval(interval)
  }, [updateDisplayValues])

  const handleClick = useCallback(() => {
    const tokens = getCurrentTokens()
    const token = tokens[tokenName] || { light: "", dark: "" }
    const currentValue = isDarkMode ? token.dark : token.light
    const originalValue = isDarkMode
      ? originalValueRef.current.dark
      : originalValueRef.current.light

    setSelectedElement({
      type: "color",
      tokenName,
      originalValue: originalValue || currentValue || "",
      originalDarkValue: originalValueRef.current.dark || "",
    })
  }, [tokenName, setSelectedElement, isDarkMode, getCurrentTokens])

  // Prüfe ob dieses Element ausgewählt ist
  const isSelected = selectedElement?.type === "color" && selectedElement.tokenName === tokenName

  const getSwatchStyle = (): React.CSSProperties => {
    switch (variant) {
      case "border":
        return {
          borderColor: `var(${tokenName})`,
          borderWidth: "2px",
          borderRadius: "var(--radius)",
        }
      case "gradient":
        return {
          background: `linear-gradient(90deg,
            var(${tokenName}) 0%,
            var(${tokenName}) 50%,
            color-mix(in oklch, var(${tokenName}) 80%, transparent) 50%,
            color-mix(in oklch, var(${tokenName}) 80%, transparent) 62.5%,
            color-mix(in oklch, var(${tokenName}) 60%, transparent) 62.5%,
            color-mix(in oklch, var(${tokenName}) 60%, transparent) 75%,
            color-mix(in oklch, var(${tokenName}) 40%, transparent) 75%,
            color-mix(in oklch, var(${tokenName}) 40%, transparent) 87.5%,
            color-mix(in oklch, var(${tokenName}) 20%, transparent) 87.5%,
            color-mix(in oklch, var(${tokenName}) 20%, transparent) 100%)`,
          backgroundColor: `var(${tokenName})`,
          borderRadius: "var(--radius)",
        }
      default:
        return {
          backgroundColor: `var(${tokenName})`,
          borderRadius: "var(--radius)",
        }
    }
  }

  return (
    <div className="flex items-start gap-6" data-swatch>
      <div className="group relative h-16 w-64 shrink-0">
        <div
          className={cn(
            "absolute inset-0 cursor-pointer rounded-lg border shadow-sm transition-all hover:ring-2",
            isSelected ? "ring-ring ring-2" : "hover:ring-ring"
          )}
          style={getSwatchStyle()}
          onClick={handleClick}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col py-1">
        <span className="text-foreground text-sm font-medium">{name}</span>
        <span className="text-muted-foreground truncate text-xs">{description}</span>
        <div className="text-muted-foreground flex gap-4 font-mono text-xs">
          <span title={oklchStr}>{oklchStr || "oklch(0.5 0 0)"}</span>
          <span className="opacity-50">|</span>
          <span>{hex}</span>
        </div>
      </div>
    </div>
  )
}

/**
 * DisplaySwatch - Nur Anzeige (Radius, Shadow)
 */
function DisplaySwatch({
  name,
  description,
  value,
  className,
  style,
}: {
  name: string
  description: string
  value: string
  className?: string
  style?: React.CSSProperties
}): React.ReactElement {
  return (
    <div className="flex items-start gap-6">
      <div className={`bg-card h-16 w-64 shrink-0 border ${className || ""}`} style={style} />
      <div className="flex min-w-0 flex-1 flex-col py-1">
        <span className="text-foreground text-sm font-medium">{name}</span>
        <span className="text-muted-foreground truncate text-xs">{description}</span>
        <span className="text-muted-foreground font-mono text-xs">{value}</span>
      </div>
    </div>
  )
}

// Farb-Tokens die von globalen Adjustments betroffen sind
const COLOR_TOKENS = [
  "--primary",
  "--primary-foreground",
  "--secondary",
  "--secondary-foreground",
  "--background",
  "--foreground",
  "--card",
  "--card-foreground",
  "--popover",
  "--popover-foreground",
  "--muted",
  "--muted-foreground",
  "--accent",
  "--accent-foreground",
  // Status Colors
  "--success",
  "--success-foreground",
  "--warning",
  "--warning-foreground",
  "--info",
  "--info-foreground",
  "--destructive",
  "--destructive-foreground",
  "--neutral",
  "--neutral-foreground",
  "--border",
  "--input",
  "--ring",
  "--chart-1",
  "--chart-2",
  "--chart-3",
  "--chart-4",
  "--chart-5",
  "--sidebar",
  "--sidebar-foreground",
  "--sidebar-primary",
  "--sidebar-primary-foreground",
  "--sidebar-accent",
  "--sidebar-accent-foreground",
  "--sidebar-border",
  "--sidebar-ring",
]

/**
 * Design System Seite
 *
 * Titel wird dynamisch aus der Navigation-Konfiguration geladen.
 */
export default function DesignSystemPage(): React.ReactElement {
  const { theme: currentThemeId } = useTheme()
  const { theme: colorMode, resolvedTheme } = useColorMode()
  const { setOpen: setExplorerOpen } = useExplorer()
  const { setContent } = useDetailDrawer()
  const currentNavItem = useCurrentNavItem()

  // Titel aus Navigation oder Fallback
  const pageTitle = currentNavItem?.label || "Design System"

  // Detail-Drawer mit ThemeDetailPanel öffnen wenn auf Design System Seite
  useEffect(() => {
    setContent(<ThemeDetailPanel />)
    return () => {
      // Cleanup: Detail-Drawer schließen beim Verlassen der Seite
      setContent(null)
    }
  }, [setContent])
  const { previewToken, getCurrentTokens, setSelectedElement } = useThemeEditor()

  // ESC-Taste: Auswahl zurücksetzen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedElement(null)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [setSelectedElement])

  // Click auf Hintergrund: Auswahl zurücksetzen
  const handleBackgroundClick = useCallback(
    (e: React.MouseEvent) => {
      // Prüfe ob der Klick auf einem Swatch war (hat data-swatch Attribut)
      const target = e.target as HTMLElement
      const isSwatchClick = target.closest("[data-swatch]")
      if (!isSwatchClick) {
        setSelectedElement(null)
      }
    },
    [setSelectedElement]
  )

  const isDarkMode = colorMode === "dark" || (colorMode === "system" && resolvedTheme === "dark")

  // Client-only Flag für Hydration-Safety
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // State
  const [radiusValue, setRadiusValue] = useState(0.5)
  const [spacingValue, setSpacingValue] = useState(0.25)
  const [letterSpacing, setLetterSpacing] = useState(0)
  const [chartHueSpacing, setChartHueSpacing] = useState(72)

  // Shadow sliders
  const [shadowColor, setShadowColor] = useState("#000000")
  const [shadowOpacity, setShadowOpacity] = useState(0.1)
  const [shadowBlur, setShadowBlur] = useState(1.0)
  const [shadowSpread, setShadowSpread] = useState(0)
  const [shadowOffsetX, setShadowOffsetX] = useState(0)
  const [shadowOffsetY, setShadowOffsetY] = useState(1.0)

  // Global adjustments
  const [hueShift, setHueShift] = useState(0)
  const [saturationMult, setSaturationMult] = useState(1.0)
  const [lightnessMult, setLightnessMult] = useState(1.0)

  // WICHTIG: Original-Werte speichern für reproduzierbare globale Anpassungen
  const originalColorsRef = useRef<Record<string, { light: string; dark: string }>>({})

  // Ref für Spacing-Slider um Scroll-Position zu stabilisieren
  const spacingSliderRef = useRef<HTMLDivElement>(null)
  const chartHueTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasLoadedOriginals = useRef(false)

  useEffect(() => {
    const timer = setTimeout(() => setExplorerOpen(false), 50)
    return () => clearTimeout(timer)
  }, [setExplorerOpen])

  // Lade Original-Werte beim ersten Mount
  useEffect(() => {
    if (typeof window === "undefined") return
    if (hasLoadedOriginals.current) return

    const loadOriginals = () => {
      const tokens = getCurrentTokens()
      const originals: Record<string, { light: string; dark: string }> = {}

      COLOR_TOKENS.forEach((tokenName) => {
        const token = tokens[tokenName]
        if (token) {
          originals[tokenName] = { light: token.light, dark: token.dark }
        }
      })

      originalColorsRef.current = originals
      hasLoadedOriginals.current = true
    }

    const timeout = setTimeout(loadOriginals, 100)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Lade aktuelle Slider-Werte
  useEffect(() => {
    if (typeof window === "undefined") return
    const updateValues = () => {
      const root = document.documentElement
      const computedStyle = window.getComputedStyle(root)

      const radiusStr = computedStyle.getPropertyValue("--radius").trim()
      if (radiusStr) {
        const match = radiusStr.match(/(\d+\.?\d*)/)
        if (match) setRadiusValue(parseFloat(match[1]) / 16)
      }

      const spacingStr = computedStyle.getPropertyValue("--spacing").trim()
      if (spacingStr) {
        const match = spacingStr.match(/(\d+\.?\d*)/)
        if (match) setSpacingValue(parseFloat(match[1]))
      }
    }
    const timeout = setTimeout(updateValues, 100)
    return () => clearTimeout(timeout)
  }, [currentThemeId])

  // Font-Namen
  const [fontNames, setFontNames] = useState<{ sans: string; mono: string; serif: string }>({
    sans: "",
    mono: "",
    serif: "",
  })

  useEffect(() => {
    if (typeof window === "undefined") return
    const extractFontName = (cssVar: string): string => {
      const root = document.documentElement
      const value = window.getComputedStyle(root).getPropertyValue(cssVar).trim()
      if (!value) return "nicht definiert"
      const firstFont = value.split(",")[0].trim().replace(/['"]/g, "")
      return firstFont || "Standard"
    }
    const timeout = setTimeout(() => {
      setFontNames({
        sans: extractFontName("--font-sans"),
        mono: extractFontName("--font-mono"),
        serif: extractFontName("--font-serif"),
      })
    }, 200)
    return () => clearTimeout(timeout)
  }, [currentThemeId])

  // Handler
  const handleRadiusChange = useCallback(
    (value: number[]) => {
      const rem = value[0]
      setRadiusValue(rem)
      previewToken("--radius", `${rem * 16}px`)
    },
    [previewToken]
  )

  const handleSpacingChange = useCallback(
    (value: number[]) => {
      const rem = value[0]

      // Speichere die Position des Sliders relativ zum Viewport VOR der Änderung
      const sliderElement = spacingSliderRef.current
      const scrollContainer = sliderElement?.closest(
        "[data-radix-scroll-area-viewport]"
      ) as HTMLElement | null
      let offsetBefore = 0

      if (sliderElement && scrollContainer) {
        const sliderRect = sliderElement.getBoundingClientRect()
        offsetBefore = sliderRect.top
      }

      setSpacingValue(rem)
      previewToken("--spacing", `${rem}rem`)

      // Nach dem Re-Render: Kompensiere die Scroll-Position
      if (sliderElement && scrollContainer) {
        requestAnimationFrame(() => {
          const sliderRect = sliderElement.getBoundingClientRect()
          const offsetAfter = sliderRect.top
          const scrollDiff = offsetAfter - offsetBefore

          if (Math.abs(scrollDiff) > 1) {
            scrollContainer.scrollTop += scrollDiff
          }
        })
      }
    },
    [previewToken]
  )

  const handleLetterSpacingChange = useCallback(
    (value: number[]) => {
      const em = value[0]
      setLetterSpacing(em)
      previewToken("--letter-spacing", `${em}em`)
    },
    [previewToken]
  )

  // Font-Handler
  const handleFontChange = useCallback(
    async (category: "sans" | "mono" | "serif", fontName: string) => {
      // Lade Font dynamisch
      await loadGoogleFont(fontName)

      // CSS-Variable setzen
      const cssVar = `--font-${category}`
      const fallback =
        category === "mono" ? "monospace" : category === "serif" ? "serif" : "sans-serif"
      const value = `${fontName}, ${fallback}`
      previewToken(cssVar, value, value)

      // UI aktualisieren
      setFontNames((prev) => ({ ...prev, [category]: fontName }))
    },
    [previewToken]
  )

  // Shadow-Variablen und ihre Base-Werte
  const SHADOW_TOKENS = [
    { token: "--shadow-2xs", baseBlur: 1, baseOffsetY: 1 },
    { token: "--shadow-xs", baseBlur: 2, baseOffsetY: 1 },
    { token: "--shadow-sm", baseBlur: 3, baseOffsetY: 1 },
    { token: "--shadow", baseBlur: 3, baseOffsetY: 1 },
    { token: "--shadow-md", baseBlur: 6, baseOffsetY: 4 },
    { token: "--shadow-lg", baseBlur: 10, baseOffsetY: 8 },
    { token: "--shadow-xl", baseBlur: 15, baseOffsetY: 12 },
    { token: "--shadow-2xl", baseBlur: 25, baseOffsetY: 25 },
  ]

  /**
   * Berechnet alle Shadow-CSS-Variablen basierend auf den aktuellen Slider-Werten
   * und setzt sie via previewToken für die Persistierung.
   */
  const updateShadowTokens = useCallback(
    (
      color: string,
      opacity: number,
      blur: number,
      spread: number,
      offsetX: number,
      offsetY: number
    ) => {
      // Konvertiere Hex zu RGB für rgba()
      const rgbMatch = color.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)
      const r = rgbMatch ? parseInt(rgbMatch[1], 16) : 0
      const g = rgbMatch ? parseInt(rgbMatch[2], 16) : 0
      const b = rgbMatch ? parseInt(rgbMatch[3], 16) : 0

      SHADOW_TOKENS.forEach(({ token, baseBlur, baseOffsetY }) => {
        const dynamicShadow = `${Math.round(offsetX)}px ${Math.round(baseOffsetY * offsetY)}px ${Math.round(baseBlur * blur)}px ${spread}px rgba(${r},${g},${b},${opacity})`
        // Shadows sind für Light und Dark Mode identisch (gleicher Wert)
        previewToken(token, dynamicShadow, dynamicShadow)
      })
    },
    // SHADOW_TOKENS is a module-level constant, safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [previewToken]
  )

  // Shadow-Slider Handler - aktualisiert State UND CSS-Variablen
  const handleShadowColorChange = useCallback(
    (color: string) => {
      setShadowColor(color)
      updateShadowTokens(
        color,
        shadowOpacity,
        shadowBlur,
        shadowSpread,
        shadowOffsetX,
        shadowOffsetY
      )
    },
    [shadowOpacity, shadowBlur, shadowSpread, shadowOffsetX, shadowOffsetY, updateShadowTokens]
  )

  const handleShadowOpacityChange = useCallback(
    (value: number[]) => {
      const opacity = value[0]
      setShadowOpacity(opacity)
      updateShadowTokens(
        shadowColor,
        opacity,
        shadowBlur,
        shadowSpread,
        shadowOffsetX,
        shadowOffsetY
      )
    },
    [shadowColor, shadowBlur, shadowSpread, shadowOffsetX, shadowOffsetY, updateShadowTokens]
  )

  const handleShadowBlurChange = useCallback(
    (value: number[]) => {
      const blur = value[0]
      setShadowBlur(blur)
      updateShadowTokens(
        shadowColor,
        shadowOpacity,
        blur,
        shadowSpread,
        shadowOffsetX,
        shadowOffsetY
      )
    },
    [shadowColor, shadowOpacity, shadowSpread, shadowOffsetX, shadowOffsetY, updateShadowTokens]
  )

  const handleShadowSpreadChange = useCallback(
    (value: number[]) => {
      const spread = value[0]
      setShadowSpread(spread)
      updateShadowTokens(
        shadowColor,
        shadowOpacity,
        shadowBlur,
        spread,
        shadowOffsetX,
        shadowOffsetY
      )
    },
    [shadowColor, shadowOpacity, shadowBlur, shadowOffsetX, shadowOffsetY, updateShadowTokens]
  )

  const handleShadowOffsetXChange = useCallback(
    (value: number[]) => {
      const offsetX = value[0]
      setShadowOffsetX(offsetX)
      updateShadowTokens(
        shadowColor,
        shadowOpacity,
        shadowBlur,
        shadowSpread,
        offsetX,
        shadowOffsetY
      )
    },
    [shadowColor, shadowOpacity, shadowBlur, shadowSpread, shadowOffsetY, updateShadowTokens]
  )

  const handleShadowOffsetYChange = useCallback(
    (value: number[]) => {
      const offsetY = value[0]
      setShadowOffsetY(offsetY)
      updateShadowTokens(
        shadowColor,
        shadowOpacity,
        shadowBlur,
        shadowSpread,
        shadowOffsetX,
        offsetY
      )
    },
    [shadowColor, shadowOpacity, shadowBlur, shadowSpread, shadowOffsetX, updateShadowTokens]
  )

  // Harmonize Chart Colors (mit anpassbarem Hue-Spacing)
  const applyChartHarmonize = useCallback(
    (hueSpacing: number) => {
      if (typeof window === "undefined") return
      const tokens = getCurrentTokens()
      const chart1Value = isDarkMode ? tokens["--chart-1"]?.dark : tokens["--chart-1"]?.light
      if (!chart1Value) return

      const match = chart1Value.match(/oklch\(([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\)/)
      if (!match) return

      const l = parseFloat(match[1])
      const c = parseFloat(match[2])
      const h = parseFloat(match[3])

      const chartTokens = ["--chart-2", "--chart-3", "--chart-4", "--chart-5"]

      chartTokens.forEach((token, index) => {
        const newHue = (h + (index + 1) * hueSpacing) % 360
        const newValue = `oklch(${l.toFixed(2)} ${c} ${newHue})`
        if (isDarkMode) {
          previewToken(token, undefined, newValue)
        } else {
          previewToken(token, newValue)
        }
      })
    },
    [getCurrentTokens, previewToken, isDarkMode]
  )

  const handleHarmonize = useCallback(() => {
    applyChartHarmonize(chartHueSpacing)
  }, [applyChartHarmonize, chartHueSpacing])

  // Chart Hue Spacing Slider (debounced)
  const handleChartHueSliderChange = useCallback(
    (value: number[]) => {
      const spacing = value[0]
      setChartHueSpacing(spacing)

      if (chartHueTimeoutRef.current) clearTimeout(chartHueTimeoutRef.current)
      chartHueTimeoutRef.current = setTimeout(() => {
        applyChartHarmonize(spacing)
      }, 80)
    },
    [applyChartHarmonize]
  )

  // Status Colors: Harmonize mit Success
  /**
   * Überträgt Sättigung (Chroma) und Helligkeit (Lightness) von Success
   * auf die anderen Status-Farben, während deren Farbwinkel (Hue) erhalten bleibt.
   *
   * Der Benutzer kann so den Farbwinkel selbst einstellen und dann mit
   * einem Klick eine harmonische Abstimmung der Sättigung/Helligkeit erreichen.
   *
   * Neutral: Behält Helligkeit von Success, aber Chroma = 0 (Grau).
   */
  const harmonizeStatusColors = useCallback(() => {
    if (typeof window === "undefined") return
    const tokens = getCurrentTokens()
    const successValue = isDarkMode ? tokens["--success"]?.dark : tokens["--success"]?.light
    if (!successValue) return

    // Konvertiere Success zu OKLCH
    const successOklch = anyColorToOklch(successValue)
    if (!successOklch) return

    const targetL = successOklch.l // Ziel-Helligkeit
    const targetC = successOklch.c // Ziel-Sättigung

    // Status-Tokens zum Harmonisieren (ohne Success selbst)
    const statusTokens = ["--warning", "--info", "--destructive"]

    statusTokens.forEach((token) => {
      const currentValue = isDarkMode ? tokens[token]?.dark : tokens[token]?.light
      if (!currentValue) return

      // Aktuelle Farbe zu OKLCH konvertieren
      const currentOklch = anyColorToOklch(currentValue)
      if (!currentOklch) return

      // Hue behalten, Lightness und Chroma von Success übernehmen
      const newValue = `oklch(${targetL.toFixed(3)} ${targetC.toFixed(3)} ${currentOklch.h.toFixed(1)})`

      if (isDarkMode) {
        previewToken(token, undefined, newValue)
      } else {
        previewToken(token, newValue)
      }
    })

    // Neutral: Gleiche Helligkeit wie Success, aber Chroma = 0
    const neutralValue = `oklch(${targetL.toFixed(3)} 0 0)`
    if (isDarkMode) {
      previewToken("--neutral", undefined, neutralValue)
    } else {
      previewToken("--neutral", neutralValue)
    }

    // Foreground-Farben: Inverse Helligkeit für Lesbarkeit
    const fgL = targetL > 0.5 ? 0.1 : 0.95
    const foregroundTokens = [
      "--warning-foreground",
      "--info-foreground",
      "--destructive-foreground",
      "--neutral-foreground",
    ]

    foregroundTokens.forEach((token) => {
      const fgValue = `oklch(${fgL} 0 0)`
      if (isDarkMode) {
        previewToken(token, undefined, fgValue)
      } else {
        previewToken(token, fgValue)
      }
    })
  }, [getCurrentTokens, previewToken, isDarkMode])

  // Global Adjustments - WICHTIG: Immer von ORIGINAL-Werten ausgehen!
  const applyGlobalAdjustments = useCallback(
    (hue: number, sat: number, light: number) => {
      if (typeof window === "undefined") return
      if (!hasLoadedOriginals.current) return

      const originals = originalColorsRef.current

      COLOR_TOKENS.forEach((tokenName) => {
        const originalToken = originals[tokenName]
        if (!originalToken) return

        // IMMER vom ORIGINAL ausgehen, nicht vom aktuellen Wert!
        const originalValue = isDarkMode ? originalToken.dark : originalToken.light
        const match = originalValue.match(/oklch\(([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\)/)
        if (!match) return

        const originalL = parseFloat(match[1])
        const originalC = parseFloat(match[2])
        const originalH = parseFloat(match[3])

        // Anpassungen anwenden
        const newL = Math.max(0, Math.min(1, originalL * light))
        const newC = Math.max(0, Math.min(0.4, originalC * sat))
        const newH = (((originalH + hue) % 360) + 360) % 360

        const adjusted = `oklch(${newL.toFixed(3)} ${newC.toFixed(3)} ${newH.toFixed(1)})`

        if (isDarkMode) {
          previewToken(tokenName, undefined, adjusted)
        } else {
          previewToken(tokenName, adjusted)
        }
      })
    },
    [previewToken, isDarkMode]
  )

  // Debounced global slider handler
  const globalAdjustTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleGlobalSliderChange = useCallback(
    (type: "hue" | "saturation" | "lightness", value: number[]) => {
      const val = value[0]

      // State sofort setzen für UI-Feedback
      if (type === "hue") setHueShift(val)
      else if (type === "saturation") setSaturationMult(val)
      else setLightnessMult(val)

      // Debounce die tatsächliche Anwendung
      if (globalAdjustTimeoutRef.current) clearTimeout(globalAdjustTimeoutRef.current)
      globalAdjustTimeoutRef.current = setTimeout(() => {
        const h = type === "hue" ? val : hueShift
        const s = type === "saturation" ? val : saturationMult
        const l = type === "lightness" ? val : lightnessMult
        applyGlobalAdjustments(h, s, l)
      }, 50)
    },
    [hueShift, saturationMult, lightnessMult, applyGlobalAdjustments]
  )

  // Reset Global Adjustments
  const handleResetGlobalAdjustments = useCallback(() => {
    setHueShift(0)
    setSaturationMult(1.0)
    setLightnessMult(1.0)
    // Mit Neutralwerten anwenden → stellt Originale wieder her
    applyGlobalAdjustments(0, 1.0, 1.0)
  }, [applyGlobalAdjustments])

  // Token-Daten
  const coreColorPairs = [
    {
      token: "--background",
      foreground: "--foreground",
      name: "Background",
      description: "Haupt-Hintergrundfarbe der Anwendung",
    },
    {
      token: "--card",
      foreground: "--card-foreground",
      name: "Card",
      description: "Hintergrund für Card-Komponenten",
    },
    {
      token: "--popover",
      foreground: "--popover-foreground",
      name: "Popover",
      description: "Hintergrund für Popovers, Dropdowns, Tooltips",
    },
    {
      token: "--primary",
      foreground: "--primary-foreground",
      name: "Primary",
      description: "Primärfarbe für Buttons, Links, CTAs",
    },
    {
      token: "--secondary",
      foreground: "--secondary-foreground",
      name: "Secondary",
      description: "Sekundärfarbe für weniger prominente Aktionen",
    },
    {
      token: "--muted",
      foreground: "--muted-foreground",
      name: "Muted",
      description: "Gedämpfte Hintergründe, Badges, Labels",
    },
    {
      token: "--accent",
      foreground: "--accent-foreground",
      name: "Accent",
      description: "Hover-States, Highlights, ausgewählte Items",
    },
  ]

  const statusColorPairs = [
    {
      token: "--success",
      foreground: "--success-foreground",
      name: "Success",
      description: "Erfolg, Bestätigung, positive Aktionen",
    },
    {
      token: "--warning",
      foreground: "--warning-foreground",
      name: "Warning",
      description: "Warnungen, Achtung, auslaufende Sessions",
    },
    {
      token: "--info",
      foreground: "--info-foreground",
      name: "Info",
      description: "Informationen, Hinweise, Tooltips",
    },
    {
      token: "--destructive",
      foreground: "--destructive-foreground",
      name: "Destructive",
      description: "Fehler, Löschen, destruktive Aktionen",
    },
    {
      token: "--neutral",
      foreground: "--neutral-foreground",
      name: "Neutral",
      description: "Neutrale Status-Anzeigen ohne Wertung",
    },
  ]

  const borderTokens = [
    { token: "--border", name: "Border", description: "Standard-Border-Farbe für Trennlinien" },
    { token: "--input", name: "Input", description: "Border-Farbe für Input-Felder" },
    { token: "--ring", name: "Ring", description: "Focus-Ring für interaktive Elemente" },
  ]

  const chartTokens = [
    {
      token: "--chart-1",
      name: "Chart 1",
      description: "Erste Farbe in Diagrammen und Visualisierungen",
    },
    { token: "--chart-2", name: "Chart 2", description: "Zweite Farbe in Diagrammen" },
    { token: "--chart-3", name: "Chart 3", description: "Dritte Farbe in Diagrammen" },
    { token: "--chart-4", name: "Chart 4", description: "Vierte Farbe in Diagrammen" },
    { token: "--chart-5", name: "Chart 5", description: "Fünfte Farbe in Diagrammen" },
  ]

  const sidebarColorPairs = [
    {
      token: "--sidebar",
      foreground: "--sidebar-foreground",
      name: "Sidebar",
      description: "Hintergrund der Seitennavigation",
    },
    {
      token: "--sidebar-primary",
      foreground: "--sidebar-primary-foreground",
      name: "Sidebar Primary",
      description: "Aktive/ausgewählte Sidebar-Items",
    },
    {
      token: "--sidebar-accent",
      foreground: "--sidebar-accent-foreground",
      name: "Sidebar Accent",
      description: "Hover-State der Sidebar-Items",
    },
  ]

  const sidebarBorderTokens = [
    {
      token: "--sidebar-border",
      name: "Sidebar Border",
      description: "Border/Trennlinien in der Sidebar",
    },
    {
      token: "--sidebar-ring",
      name: "Sidebar Ring",
      description: "Focus-Ring für Sidebar-Elemente",
    },
  ]

  const radiusItems = [
    {
      class: "rounded-sm",
      name: "Small (sm)",
      description: "Kleine Elemente: Checkboxen, Badges",
      value: "calc(var(--radius) - 4px)",
    },
    {
      class: "rounded-md",
      name: "Medium (md)",
      description: "Standard für Buttons und Inputs",
      value: "calc(var(--radius) - 2px)",
    },
    {
      class: "rounded-lg",
      name: "Large (lg)",
      description: "Cards und Container",
      value: "var(--radius)",
    },
    {
      class: "rounded-xl",
      name: "Extra Large (xl)",
      description: "Große Panels und Modals",
      value: "calc(var(--radius) + 4px)",
    },
    {
      class: "rounded-full",
      name: "Full",
      description: "Avatare, Pills, runde Buttons",
      value: "9999px",
    },
  ]

  const shadowItems = [
    { class: "shadow-2xs", name: "2XS", description: "Minimaler Schatten für subtile Tiefe" },
    { class: "shadow-xs", name: "XS", description: "Sehr kleiner Schatten" },
    { class: "shadow-sm", name: "Small", description: "Leichte Elevation für Buttons" },
    { class: "shadow-md", name: "Medium", description: "Standard-Schatten für Cards" },
    { class: "shadow-lg", name: "Large", description: "Stärkere Elevation für Modals" },
    { class: "shadow-xl", name: "XL", description: "Hohe Elevation für Dialoge" },
    { class: "shadow-2xl", name: "2XL", description: "Maximaler Schatten für Overlays" },
  ]

  return (
    <PageContent>
      <PageHeader
        title={pageTitle}
        description="Passe Design-Tokens live an und speichere sie als neues Theme"
      />

      {}
      <div className="min-h-full space-y-12 pb-24" onClick={handleBackgroundClick}>
        {/* Core Theme Colors */}
        <section>
          <h2 className="text-foreground mb-6 text-xl font-semibold">Core Theme Colors</h2>
          <div className="space-y-4">
            {coreColorPairs.map((pair) => (
              <ColorPairSwatch
                key={pair.token}
                tokenName={pair.token}
                foregroundTokenName={pair.foreground}
                name={pair.name}
                description={pair.description}
              />
            ))}
          </div>
        </section>

        {/* Borders */}
        <section>
          <h2 className="text-foreground mb-6 text-xl font-semibold">Borders</h2>
          <div className="space-y-4">
            {borderTokens.map((token) => (
              <SingleColorSwatch
                key={token.token}
                tokenName={token.token}
                name={token.name}
                description={token.description}
                variant="border"
              />
            ))}
          </div>
        </section>

        {/* Status Colors */}
        <section>
          <h2 className="text-foreground mb-4 text-xl font-semibold">Status Colors</h2>

          {/* Harmonize Button */}
          <div style={{ marginBottom: "16px" }}>
            <Button
              variant="outline"
              size="sm"
              onClick={harmonizeStatusColors}
              style={{ width: "256px" }}
            >
              <Palette className="mr-2 size-4" />
              Harmonize (Success)
            </Button>
            <p className="text-muted-foreground mt-2 text-xs" style={{ maxWidth: "256px" }}>
              Überträgt Sättigung und Helligkeit von Success auf die anderen Status-Farben. Der
              Farbwinkel bleibt erhalten.
            </p>
          </div>

          {/* Farb-Swatches */}
          <div className="space-y-4">
            {statusColorPairs.map((pair) => (
              <ColorPairSwatch
                key={pair.token}
                tokenName={pair.token}
                foregroundTokenName={pair.foreground}
                name={pair.name}
                description={pair.description}
              />
            ))}
          </div>
        </section>

        {/* Chart Colors */}
        <section>
          <h2 className="text-foreground mb-4 text-xl font-semibold">Chart Colors</h2>
          {/* Hue-Spacing Slider + Button */}
          <div
            style={{ marginBottom: "16px", display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <div style={{ width: "256px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Hue Spacing</Label>
                <span className="text-muted-foreground font-mono text-xs">
                  {chartHueSpacing.toFixed(0)}°
                </span>
              </div>
              <Slider
                value={[chartHueSpacing]}
                onValueChange={handleChartHueSliderChange}
                min={5}
                max={72}
                step={1}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleHarmonize}
              style={{ width: "256px" }}
            >
              <Palette className="mr-2 size-4" />
              Harmonize (aktuelles Spacing)
            </Button>
          </div>
          <div className="space-y-4">
            {chartTokens.map((token) => (
              <SingleColorSwatch
                key={token.token}
                tokenName={token.token}
                name={token.name}
                description={token.description}
                variant="gradient"
              />
            ))}
          </div>
        </section>

        {/* Sidebar Colors */}
        <section>
          <h2 className="text-foreground mb-6 text-xl font-semibold">Sidebar Colors</h2>
          <div className="space-y-4">
            {sidebarColorPairs.map((pair) => (
              <ColorPairSwatch
                key={pair.token}
                tokenName={pair.token}
                foregroundTokenName={pair.foreground}
                name={pair.name}
                description={pair.description}
              />
            ))}
          </div>
          <div className="mt-4 space-y-4">
            {sidebarBorderTokens.map((token) => (
              <SingleColorSwatch
                key={token.token}
                tokenName={token.token}
                name={token.name}
                description={token.description}
                variant="border"
              />
            ))}
          </div>
        </section>

        {/* Radius & Spacing */}
        <section>
          <h2 className="text-foreground text-xl font-semibold" style={{ marginBottom: "16px" }}>
            Radius & Spacing
          </h2>

          {/* Corner Style Switch - feste Abstände um Spacing-Einfluss zu vermeiden */}
          <div style={{ marginBottom: "24px" }}>
            <CornerStyleSwitch />
          </div>

          {/* Slider OBEN - feste Pixel-Abstände, damit die Slider-Position stabil bleibt */}
          <div
            style={{ marginBottom: "24px", display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div className="w-64" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
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
              />
            </div>
            <div
              ref={spacingSliderRef}
              className="w-64"
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">--spacing</Label>
                <span className="text-muted-foreground font-mono text-xs">
                  {spacingValue.toFixed(3)}rem ({(spacingValue * 16).toFixed(1)}px)
                </span>
              </div>
              <Slider
                value={[spacingValue]}
                onValueChange={handleSpacingChange}
                min={0.1}
                max={0.4}
                step={0.005}
              />
            </div>
          </div>
          {/* Elemente */}
          <div className="space-y-4">
            {radiusItems.map((item) => (
              <DisplaySwatch
                key={item.class}
                name={item.name}
                description={item.description}
                value={item.value}
                className={`bg-primary ${item.class}`}
              />
            ))}
          </div>
        </section>

        {/* Typography */}
        <section>
          <h2 className="text-foreground mb-4 text-xl font-semibold">Typografie</h2>
          {/* Slider OBEN */}
          <div className="mb-6 w-64 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Letter Spacing</Label>
              <span className="text-muted-foreground font-mono text-xs">
                {letterSpacing > 0 ? "+" : ""}
                {letterSpacing.toFixed(2)}em
              </span>
            </div>
            <Slider
              value={[letterSpacing]}
              onValueChange={handleLetterSpacingChange}
              min={-0.1}
              max={0.2}
              step={0.01}
            />
          </div>
          {/* Elemente */}
          <div className="space-y-4">
            <div className="flex items-start gap-6">
              <div
                className="h-16 w-64 shrink-0 font-sans text-2xl leading-[64px] font-semibold"
                style={{ letterSpacing: `${letterSpacing}em` }}
              >
                Aa Bb Cc Dd Ee
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2 py-1">
                <div className="flex items-center gap-4">
                  <FontSelect
                    category="sans"
                    value={fontNames.sans}
                    onChange={(font) => handleFontChange("sans", font)}
                  />
                  <span className="text-muted-foreground font-mono text-xs">--font-sans</span>
                </div>
                <span className="text-muted-foreground text-xs">
                  Hauptschrift für UI-Text und Überschriften
                </span>
              </div>
            </div>
            <div className="flex items-start gap-6">
              <div
                className="h-16 w-64 shrink-0 font-mono text-2xl leading-[64px] font-semibold"
                style={{ letterSpacing: `${letterSpacing}em` }}
              >
                Aa Bb Cc Dd Ee
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2 py-1">
                <div className="flex items-center gap-4">
                  <FontSelect
                    category="mono"
                    value={fontNames.mono}
                    onChange={(font) => handleFontChange("mono", font)}
                  />
                  <span className="text-muted-foreground font-mono text-xs">--font-mono</span>
                </div>
                <span className="text-muted-foreground text-xs">
                  Code-Blöcke, technische Werte, Keyboard-Shortcuts
                </span>
              </div>
            </div>
            <div className="flex items-start gap-6">
              <div
                className="h-16 w-64 shrink-0 text-2xl leading-[64px] font-semibold"
                style={{ fontFamily: "var(--font-serif)", letterSpacing: `${letterSpacing}em` }}
              >
                Aa Bb Cc Dd Ee
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2 py-1">
                <div className="flex items-center gap-4">
                  <FontSelect
                    category="serif"
                    value={fontNames.serif}
                    onChange={(font) => handleFontChange("serif", font)}
                  />
                  <span className="text-muted-foreground font-mono text-xs">--font-serif</span>
                </div>
                <span className="text-muted-foreground text-xs">
                  Längere Texte, Artikel, Zitate
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Shadows */}
        <section>
          <h2 className="text-foreground mb-4 text-xl font-semibold">Schatten</h2>
          {/* Slider OBEN - alle untereinander */}
          <div className="mb-6 space-y-4">
            <div className="w-64 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Opacity</Label>
                <span className="text-muted-foreground font-mono text-xs">
                  {(shadowOpacity * 100).toFixed(0)}%
                </span>
              </div>
              <Slider
                value={[shadowOpacity]}
                onValueChange={handleShadowOpacityChange}
                min={0}
                max={0.5}
                step={0.01}
              />
            </div>
            <div className="w-64 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Blur</Label>
                <span className="text-muted-foreground font-mono text-xs">
                  {shadowBlur.toFixed(1)}x
                </span>
              </div>
              <Slider
                value={[shadowBlur]}
                onValueChange={handleShadowBlurChange}
                min={0}
                max={3}
                step={0.1}
              />
            </div>
            <div className="w-64 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Spread</Label>
                <span className="text-muted-foreground font-mono text-xs">
                  {shadowSpread.toFixed(0)}px
                </span>
              </div>
              <Slider
                value={[shadowSpread]}
                onValueChange={handleShadowSpreadChange}
                min={-10}
                max={10}
                step={1}
              />
            </div>
            <div className="w-64 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Offset X</Label>
                <span className="text-muted-foreground font-mono text-xs">
                  {shadowOffsetX > 0 ? "+" : ""}
                  {shadowOffsetX.toFixed(1)}px
                </span>
              </div>
              <Slider
                value={[shadowOffsetX]}
                onValueChange={handleShadowOffsetXChange}
                min={-10}
                max={10}
                step={0.5}
              />
            </div>
            <div className="w-64 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Offset Y</Label>
                <span className="text-muted-foreground font-mono text-xs">
                  {shadowOffsetY.toFixed(1)}x
                </span>
              </div>
              <Slider
                value={[shadowOffsetY]}
                onValueChange={handleShadowOffsetYChange}
                min={0}
                max={3}
                step={0.1}
              />
            </div>
          </div>
          {/* Schattenfarbe */}
          <div className="mb-6 flex items-start gap-6">
            <div className="group relative h-16 w-64 shrink-0">
              {isMounted ? (
                <ColorPicker value={shadowColor} onChange={handleShadowColorChange}>
                  <div
                    className="hover:ring-ring absolute inset-0 cursor-pointer rounded-lg border shadow-sm transition-all hover:ring-2"
                    style={{
                      backgroundColor: shadowColor,
                      borderRadius: "var(--radius)",
                    }}
                  />
                </ColorPicker>
              ) : (
                <div
                  className="absolute inset-0 rounded-lg border shadow-sm"
                  style={{
                    backgroundColor: shadowColor,
                    borderRadius: "var(--radius)",
                  }}
                />
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col py-1">
              <span className="text-foreground text-sm font-medium">Schattenfarbe</span>
              <span className="text-muted-foreground truncate text-xs">
                Farbe für alle Schatten
              </span>
              <div className="text-muted-foreground flex gap-4 font-mono text-xs">
                <span>{shadowColor}</span>
                <span className="opacity-50">|</span>
                <span>{hexToRgb(shadowColor)}</span>
              </div>
            </div>
          </div>
          {/* Elemente mit dynamischen Schatten */}
          <div className="space-y-4">
            {shadowItems.map((item, index) => {
              // Konvertiere Hex zu RGB für rgba()
              const rgbMatch = shadowColor.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)
              const r = rgbMatch ? parseInt(rgbMatch[1], 16) : 0
              const g = rgbMatch ? parseInt(rgbMatch[2], 16) : 0
              const b = rgbMatch ? parseInt(rgbMatch[3], 16) : 0

              // Dynamische Shadow-Berechnung basierend auf Slider-Werten
              const baseBlur = [1, 2, 4, 6, 10, 15, 25][index] || 6
              const baseOffsetY = [1, 1, 2, 4, 8, 12, 25][index] || 4
              // Offset X wird direkt in Pixeln verwendet (kann negativ sein)
              // Offset Y wird als Multiplikator verwendet (nur positiv)
              const dynamicShadow = `${Math.round(shadowOffsetX)}px ${Math.round(baseOffsetY * shadowOffsetY)}px ${Math.round(baseBlur * shadowBlur)}px ${shadowSpread}px rgba(${r},${g},${b},${shadowOpacity})`

              return (
                <DisplaySwatch
                  key={item.class}
                  name={item.name}
                  description={item.description}
                  value={item.class}
                  className="rounded-lg"
                  style={{ boxShadow: dynamicShadow }}
                />
              )
            })}
          </div>
        </section>

        {/* Global Adjustments */}
        <section>
          <h2 className="text-foreground mb-4 text-xl font-semibold">Global Adjustments</h2>
          <p className="text-muted-foreground mb-2 text-sm">
            Master-Slider für alle Farben gleichzeitig. Änderungen werden von den Original-Werten
            berechnet.
          </p>
          {/* Reset Button */}
          <div className="mb-4">
            <Button variant="outline" size="sm" onClick={handleResetGlobalAdjustments}>
              <RotateCcw className="mr-2 size-4" />
              Auf Neutral zurücksetzen
            </Button>
          </div>
          {/* Slider */}
          <div className="w-64 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Hue-Shift</Label>
                <span className="text-muted-foreground font-mono text-xs">
                  {hueShift > 0 ? "+" : ""}
                  {hueShift}°
                </span>
              </div>
              <Slider
                value={[hueShift]}
                onValueChange={(v) => handleGlobalSliderChange("hue", v)}
                min={-180}
                max={180}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Saturation</Label>
                <span className="text-muted-foreground font-mono text-xs">
                  {saturationMult.toFixed(2)}x
                </span>
              </div>
              <Slider
                value={[saturationMult]}
                onValueChange={(v) => handleGlobalSliderChange("saturation", v)}
                min={0}
                max={2}
                step={0.01}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Lightness</Label>
                <span className="text-muted-foreground font-mono text-xs">
                  {lightnessMult.toFixed(2)}x
                </span>
              </div>
              <Slider
                value={[lightnessMult]}
                onValueChange={(v) => handleGlobalSliderChange("lightness", v)}
                min={0.5}
                max={1.5}
                step={0.01}
              />
            </div>
          </div>
        </section>
      </div>
    </PageContent>
  )
}
