"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { PageContent, PageHeader } from "@/components/shell"
import { useExplorer } from "@/components/shell"
import { useTheme as useColorMode } from "next-themes"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { RotateCcw, Palette } from "lucide-react"
import { useTheme } from "@/lib/themes"
import { useThemeEditor } from "@/hooks/use-theme-editor"
import { ColorPairSwatch } from "@/components/theme/ColorPairSwatch"
import { FloatingToolbar } from "@/components/theme/FloatingToolbar"

/**
 * BorderSwatch - Zeigt einen Border-Token als leeres Rechteck (256×64)
 */
function BorderSwatch({
  tokenName,
  label,
}: {
  tokenName: string
  label: string
}): React.ReactElement {
  const { previewToken, getCurrentTokens } = useThemeEditor()
  const { theme: colorMode, resolvedTheme } = useColorMode()
  const isDarkMode = colorMode === "dark" || (colorMode === "system" && resolvedTheme === "dark")

  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState("#808080")
  const [originalValue, setOriginalValue] = useState("")

  useEffect(() => {
    if (typeof window === "undefined") return
    const loadValue = () => {
      const tokens = getCurrentTokens()
      const token = tokens[tokenName] || { light: "", dark: "" }
      const currentValue = isDarkMode ? token.dark : token.light
      setValue(oklchToHex(currentValue))
      if (!originalValue) setOriginalValue(currentValue)
    }
    const timeout = setTimeout(loadValue, 50)
    return () => clearTimeout(timeout)
  }, [tokenName, getCurrentTokens, isDarkMode, originalValue])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const hex = e.target.value
      setValue(hex)
      if (isDarkMode) {
        previewToken(tokenName, undefined, hex)
      } else {
        previewToken(tokenName, hex)
      }
    },
    [tokenName, previewToken, isDarkMode]
  )

  const handleReset = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (originalValue) {
        setValue(oklchToHex(originalValue))
        if (isDarkMode) {
          previewToken(tokenName, undefined, originalValue)
        } else {
          previewToken(tokenName, originalValue)
        }
      }
    },
    [tokenName, originalValue, previewToken, isDarkMode]
  )

  return (
    <div className="flex items-center gap-4">
      <span className="text-muted-foreground w-32 shrink-0 text-sm">{label}</span>
      <div className="group relative h-16 w-64">
        {/* eslint-disable-next-line local/use-design-system-components -- Native color picker required */}
        <input
          ref={inputRef}
          type="color"
          value={value}
          onChange={handleChange}
          className="sr-only"
          tabIndex={-1}
        />
        <div
          onClick={() => inputRef.current?.click()}
          className="hover:ring-ring absolute inset-0 cursor-pointer rounded-lg border-2 transition-all hover:ring-2"
          style={{
            borderColor: `var(${tokenName})`,
            borderRadius: "var(--radius)",
          }}
        />
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

/**
 * ChartSwatch - Zeigt einen Chart-Token als Rechteck mit Gradient (256×64)
 */
function ChartSwatch({
  tokenName,
  label,
}: {
  tokenName: string
  label: string
}): React.ReactElement {
  const { previewToken, getCurrentTokens } = useThemeEditor()
  const { theme: colorMode, resolvedTheme } = useColorMode()
  const isDarkMode = colorMode === "dark" || (colorMode === "system" && resolvedTheme === "dark")

  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState("#808080")
  const [originalValue, setOriginalValue] = useState("")

  useEffect(() => {
    if (typeof window === "undefined") return
    const loadValue = () => {
      const tokens = getCurrentTokens()
      const token = tokens[tokenName] || { light: "", dark: "" }
      const currentValue = isDarkMode ? token.dark : token.light
      setValue(oklchToHex(currentValue))
      if (!originalValue) setOriginalValue(currentValue)
    }
    const timeout = setTimeout(loadValue, 50)
    return () => clearTimeout(timeout)
  }, [tokenName, getCurrentTokens, isDarkMode, originalValue])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const hex = e.target.value
      setValue(hex)
      if (isDarkMode) {
        previewToken(tokenName, undefined, hex)
      } else {
        previewToken(tokenName, hex)
      }
    },
    [tokenName, previewToken, isDarkMode]
  )

  const handleReset = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (originalValue) {
        setValue(oklchToHex(originalValue))
        if (isDarkMode) {
          previewToken(tokenName, undefined, originalValue)
        } else {
          previewToken(tokenName, originalValue)
        }
      }
    },
    [tokenName, originalValue, previewToken, isDarkMode]
  )

  return (
    <div className="flex items-center gap-4">
      <span className="text-muted-foreground w-32 shrink-0 text-sm">{label}</span>
      <div className="group relative h-16 w-64">
        {/* eslint-disable-next-line local/use-design-system-components -- Native color picker required */}
        <input
          ref={inputRef}
          type="color"
          value={value}
          onChange={handleChange}
          className="sr-only"
          tabIndex={-1}
        />
        <div
          onClick={() => inputRef.current?.click()}
          className="hover:ring-ring absolute inset-0 cursor-pointer rounded-lg border shadow-sm transition-all hover:ring-2"
          style={{
            background: `linear-gradient(135deg, var(${tokenName}) 0%, var(${tokenName}) 60%, transparent 60%)`,
            backgroundColor: `var(${tokenName})`,
            borderRadius: "var(--radius)",
          }}
        />
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

/**
 * RadiusSwatch - Zeigt Radius-Vorschau als Rechteck (256×64)
 */
function RadiusSwatch({
  radiusClass,
  label,
}: {
  radiusClass: string
  label: string
}): React.ReactElement {
  return (
    <div className="flex items-center gap-4">
      <span className="text-muted-foreground w-32 shrink-0 text-sm">{label}</span>
      <div className={`bg-primary h-16 w-64 border shadow-sm ${radiusClass}`} />
    </div>
  )
}

/**
 * ShadowSwatch - Zeigt Shadow-Vorschau als Rechteck (256×64)
 */
function ShadowSwatch({
  shadowClass,
  label,
}: {
  shadowClass: string
  label: string
}): React.ReactElement {
  return (
    <div className="flex items-center gap-4">
      <span className="text-muted-foreground w-32 shrink-0 text-sm">{label}</span>
      <div className={`bg-card h-16 w-64 rounded-lg border ${shadowClass}`} />
    </div>
  )
}

/**
 * OKLCH zu Hex Konvertierung
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
 * Tweak the UI Seite
 *
 * Vertikales Layout ohne Cards, H2-Kapitelüberschriften
 */
export default function TweakPage(): React.ReactElement {
  const { theme: currentThemeId } = useTheme()
  const { theme: colorMode, resolvedTheme } = useColorMode()
  const { setOpen: setExplorerOpen } = useExplorer()
  const { isDirty, resetPreview, previewToken, getCurrentTokens } = useThemeEditor()

  const isDarkMode = colorMode === "dark" || (colorMode === "system" && resolvedTheme === "dark")

  // State
  const [radiusValue, setRadiusValue] = useState(0.5)
  const [spacingValue, setSpacingValue] = useState(0.25)
  const [letterSpacing, setLetterSpacing] = useState(0)
  const [hueShift, setHueShift] = useState(0)
  const [saturationMult, setSaturationMult] = useState(1.0)
  const [lightnessMult, setLightnessMult] = useState(1.0)

  // Debounce refs
  const globalAdjustTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setExplorerOpen(false), 50)
    return () => clearTimeout(timer)
  }, [setExplorerOpen])

  // Lade aktuelle Werte
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
  const [fontNames, setFontNames] = useState<{
    sans: string
    mono: string
    serif: string
  }>({ sans: "", mono: "", serif: "" })

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
      setSpacingValue(rem)
      previewToken("--spacing", `${rem}rem`)
    },
    [previewToken]
  )

  // Harmonize Chart Colors
  const handleHarmonize = useCallback(() => {
    if (typeof window === "undefined") return
    const tokens = getCurrentTokens()
    const chart1Value = isDarkMode ? tokens["--chart-1"]?.dark : tokens["--chart-1"]?.light
    if (!chart1Value) return

    const match = chart1Value.match(/oklch\(([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\)/)
    if (!match) return

    const l = parseFloat(match[1])
    const c = parseFloat(match[2])
    const h = parseFloat(match[3])

    const hueSpacing = 72 // 360/5
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
  }, [getCurrentTokens, previewToken, isDarkMode])

  // Global Adjustments
  const applyGlobalAdjustments = useCallback(
    (hue: number, sat: number, light: number) => {
      if (typeof window === "undefined") return

      const tokens = getCurrentTokens()
      const colorTokens = [
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
        "--destructive",
        "--destructive-foreground",
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

      colorTokens.forEach((tokenName) => {
        const tokenValue = tokens[tokenName]
        if (!tokenValue) return

        const currentValue = isDarkMode ? tokenValue.dark : tokenValue.light
        const match = currentValue.match(/oklch\(([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\)/)
        if (!match) return

        const l = Math.max(0, Math.min(1, parseFloat(match[1]) * light))
        const c = Math.max(0, Math.min(0.4, parseFloat(match[2]) * sat))
        const h = (((parseFloat(match[3]) + hue) % 360) + 360) % 360

        const adjusted = `oklch(${l.toFixed(2)} ${c.toFixed(2)} ${h})`
        if (isDarkMode) {
          previewToken(tokenName, undefined, adjusted)
        } else {
          previewToken(tokenName, adjusted)
        }
      })
    },
    [getCurrentTokens, previewToken, isDarkMode]
  )

  const handleGlobalSliderChange = useCallback(
    (type: "hue" | "saturation" | "lightness", value: number[]) => {
      const val = value[0]
      if (type === "hue") setHueShift(val)
      else if (type === "saturation") setSaturationMult(val)
      else setLightnessMult(val)

      if (globalAdjustTimeoutRef.current) clearTimeout(globalAdjustTimeoutRef.current)
      globalAdjustTimeoutRef.current = setTimeout(() => {
        const h = type === "hue" ? val : hueShift
        const s = type === "saturation" ? val : saturationMult
        const l = type === "lightness" ? val : lightnessMult
        applyGlobalAdjustments(h, s, l)
      }, 100)
    },
    [hueShift, saturationMult, lightnessMult, applyGlobalAdjustments]
  )

  // Data
  const coreColorPairs = [
    { token: "--background", foreground: "--foreground", label: "Background" },
    { token: "--card", foreground: "--card-foreground", label: "Card" },
    { token: "--popover", foreground: "--popover-foreground", label: "Popover" },
    { token: "--primary", foreground: "--primary-foreground", label: "Primary" },
    { token: "--secondary", foreground: "--secondary-foreground", label: "Secondary" },
    { token: "--muted", foreground: "--muted-foreground", label: "Muted" },
    { token: "--accent", foreground: "--accent-foreground", label: "Accent" },
    { token: "--destructive", foreground: "--destructive-foreground", label: "Destructive" },
  ]

  const borderTokens = [
    { token: "--border", label: "Border" },
    { token: "--input", label: "Input" },
    { token: "--ring", label: "Ring" },
  ]

  const chartTokens = [
    { token: "--chart-1", label: "Chart 1" },
    { token: "--chart-2", label: "Chart 2" },
    { token: "--chart-3", label: "Chart 3" },
    { token: "--chart-4", label: "Chart 4" },
    { token: "--chart-5", label: "Chart 5" },
  ]

  const sidebarColorPairs = [
    { token: "--sidebar", foreground: "--sidebar-foreground", label: "Sidebar" },
    {
      token: "--sidebar-primary",
      foreground: "--sidebar-primary-foreground",
      label: "Sidebar Primary",
    },
    {
      token: "--sidebar-accent",
      foreground: "--sidebar-accent-foreground",
      label: "Sidebar Accent",
    },
  ]

  const sidebarBorderTokens = [
    { token: "--sidebar-border", label: "Sidebar Border" },
    { token: "--sidebar-ring", label: "Sidebar Ring" },
  ]

  const radiusItems = [
    { radiusClass: "rounded-sm", label: "Small (sm)" },
    { radiusClass: "rounded-md", label: "Medium (md)" },
    { radiusClass: "rounded-lg", label: "Large (lg)" },
    { radiusClass: "rounded-xl", label: "Extra Large (xl)" },
    { radiusClass: "rounded-full", label: "Full" },
  ]

  const shadowItems = [
    { shadowClass: "shadow-2xs", label: "2XS" },
    { shadowClass: "shadow-xs", label: "XS" },
    { shadowClass: "shadow-sm", label: "Small" },
    { shadowClass: "shadow-md", label: "Medium" },
    { shadowClass: "shadow-lg", label: "Large" },
    { shadowClass: "shadow-xl", label: "XL" },
    { shadowClass: "shadow-2xl", label: "2XL" },
  ]

  return (
    <PageContent>
      <PageHeader
        title="Tweak the UI"
        description="Passe Design-Tokens live an und speichere sie als neues Theme"
      />

      <div className="space-y-12 pb-24">
        {/* Core Theme Colors */}
        <section>
          <h2 className="text-foreground mb-6 text-xl font-semibold">Core Theme Colors</h2>
          <div className="space-y-2">
            {coreColorPairs.map((pair) => (
              <ColorPairSwatch
                key={pair.token}
                tokenName={pair.token}
                foregroundTokenName={pair.foreground}
                label={pair.label}
              />
            ))}
          </div>
        </section>

        {/* Borders */}
        <section>
          <h2 className="text-foreground mb-6 text-xl font-semibold">Borders</h2>
          <div className="space-y-2">
            {borderTokens.map((token) => (
              <BorderSwatch key={token.token} tokenName={token.token} label={token.label} />
            ))}
          </div>
        </section>

        {/* Chart Colors */}
        <section>
          <h2 className="text-foreground mb-6 text-xl font-semibold">Chart Colors</h2>
          <div className="mb-4">
            <Button variant="outline" size="sm" onClick={handleHarmonize}>
              <Palette className="mr-2 size-4" />
              Harmonize (72° Spacing)
            </Button>
          </div>
          <div className="space-y-2">
            {chartTokens.map((token) => (
              <ChartSwatch key={token.token} tokenName={token.token} label={token.label} />
            ))}
          </div>
        </section>

        {/* Sidebar Colors */}
        <section>
          <h2 className="text-foreground mb-6 text-xl font-semibold">Sidebar Colors</h2>
          <div className="space-y-2">
            {sidebarColorPairs.map((pair) => (
              <ColorPairSwatch
                key={pair.token}
                tokenName={pair.token}
                foregroundTokenName={pair.foreground}
                label={pair.label}
              />
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {sidebarBorderTokens.map((token) => (
              <BorderSwatch key={token.token} tokenName={token.token} label={token.label} />
            ))}
          </div>
        </section>

        {/* Radius & Spacing */}
        <section>
          <h2 className="text-foreground mb-6 text-xl font-semibold">Radius & Spacing</h2>

          {/* Radius Slider */}
          <div className="mb-6 w-96 space-y-2">
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

          {/* Radius Previews */}
          <div className="space-y-2">
            {radiusItems.map((item) => (
              <RadiusSwatch
                key={item.radiusClass}
                radiusClass={item.radiusClass}
                label={item.label}
              />
            ))}
          </div>

          {/* Spacing Slider */}
          <div className="mt-8 w-96 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">--spacing</Label>
              <span className="text-muted-foreground font-mono text-xs">
                {spacingValue.toFixed(2)}rem
              </span>
            </div>
            <Slider
              value={[spacingValue]}
              onValueChange={handleSpacingChange}
              min={0}
              max={1}
              step={0.01}
            />
          </div>
        </section>

        {/* Typography */}
        <section>
          <h2 className="text-foreground mb-6 text-xl font-semibold">Typografie</h2>

          {/* Letter Spacing Slider (für alle Fonts) */}
          <div className="mb-6 w-96 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Letter Spacing</Label>
              <span className="text-muted-foreground font-mono text-xs">
                {letterSpacing > 0 ? "+" : ""}
                {letterSpacing.toFixed(2)}em
              </span>
            </div>
            <Slider
              value={[letterSpacing]}
              onValueChange={(v) => setLetterSpacing(v[0])}
              min={-0.1}
              max={0.2}
              step={0.01}
            />
          </div>

          {/* Font Previews */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground w-32 shrink-0 text-sm">
                Sans ({fontNames.sans})
              </span>
              <div
                className="h-16 w-64 font-sans text-2xl leading-[64px] font-semibold"
                style={{ letterSpacing: `${letterSpacing}em` }}
              >
                Aa Bb Cc Dd Ee
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground w-32 shrink-0 text-sm">
                Mono ({fontNames.mono})
              </span>
              <div
                className="h-16 w-64 font-mono text-2xl leading-[64px] font-semibold"
                style={{ letterSpacing: `${letterSpacing}em` }}
              >
                Aa Bb Cc Dd Ee
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground w-32 shrink-0 text-sm">
                Serif ({fontNames.serif})
              </span>
              <div
                className="h-16 w-64 text-2xl leading-[64px] font-semibold"
                style={{ fontFamily: "var(--font-serif)", letterSpacing: `${letterSpacing}em` }}
              >
                Aa Bb Cc Dd Ee
              </div>
            </div>
          </div>
        </section>

        {/* Shadows */}
        <section>
          <h2 className="text-foreground mb-6 text-xl font-semibold">Schatten</h2>
          <div className="space-y-2">
            {shadowItems.map((item) => (
              <ShadowSwatch
                key={item.shadowClass}
                shadowClass={item.shadowClass}
                label={item.label}
              />
            ))}
          </div>
        </section>

        {/* Global Adjustments */}
        <section>
          <h2 className="text-foreground mb-6 text-xl font-semibold">Global Adjustments</h2>
          <p className="text-muted-foreground mb-6 text-sm">
            Master-Slider für alle Farben gleichzeitig
          </p>

          <div className="w-96 space-y-6">
            {/* Hue Shift */}
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

            {/* Saturation */}
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

            {/* Lightness */}
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

      <FloatingToolbar isDirty={isDirty} onReset={resetPreview} />
    </PageContent>
  )
}
