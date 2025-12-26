"use client"

import { useState, useEffect, useCallback } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useThemeEditor } from "@/hooks/use-theme-editor"
import { useTheme as useColorMode } from "next-themes"

interface ColorTokenPopoverProps {
  tokenName: string
  label: string
  children: React.ReactNode
  /** Optional: Token für Dark Mode (falls unterschiedlich) */
  darkTokenName?: string
}

/**
 * Popover zum Editieren eines Farb-Tokens
 *
 * Zeigt einen Color-Picker und OKLCH-Input für Light/Dark Mode.
 */
export function ColorTokenPopover({
  tokenName,
  label,
  children,
  darkTokenName,
}: ColorTokenPopoverProps): React.ReactElement {
  const { previewToken, getCurrentTokens } = useThemeEditor()
  const { theme: colorMode, resolvedTheme } = useColorMode()
  const [isOpen, setIsOpen] = useState(false)
  const [lightValue, setLightValue] = useState("")
  const [darkValue, setDarkValue] = useState("")

  const isDarkMode = colorMode === "dark" || (colorMode === "system" && resolvedTheme === "dark")

  // Lade aktuelle Werte beim Öffnen
  useEffect(() => {
    if (!isOpen) return

    const loadValues = () => {
      const tokens = getCurrentTokens()
      const current = tokens[tokenName] || { light: "", dark: "" }
      setLightValue(current.light)
      setDarkValue(darkTokenName ? tokens[darkTokenName]?.dark || current.dark : current.dark)
    }
    // Delay um sicherzustellen, dass DOM bereit ist
    const timeoutId = setTimeout(loadValues, 0)
    return () => clearTimeout(timeoutId)
  }, [isOpen, tokenName, darkTokenName, getCurrentTokens])

  // Konvertiere OKLCH zu Hex für Color-Picker (vereinfacht)
  // Für MVP: Wenn bereits Hex, verwende das; sonst Fallback
  const oklchToHex = useCallback((oklch: string): string => {
    if (!oklch) return "#000000"
    if (oklch.startsWith("#")) return oklch
    // Für MVP: Einfacher Fallback - später mit culori konvertieren
    return "#000000"
  }, [])

  // Konvertiere Hex zu OKLCH (vereinfacht - für Production sollte eine richtige Bibliothek verwendet werden)
  const hexToOklch = useCallback((hex: string): string => {
    // Für MVP: Speichere als Hex-String (wird später zu OKLCH konvertiert)
    // Oder: Verwende eine einfache Konvertierung
    // Für jetzt: Gib den Hex-Wert zurück, da OKLCH-Konvertierung komplex ist
    return hex
  }, [])

  const handleLightChange = useCallback(
    (value: string) => {
      setLightValue(value)
      previewToken(tokenName, value, darkValue)
    },
    [tokenName, darkValue, previewToken]
  )

  const handleDarkChange = useCallback(
    (value: string) => {
      setDarkValue(value)
      previewToken(tokenName, lightValue, value)
    },
    [tokenName, lightValue, previewToken]
  )

  const handleColorPickerChange = useCallback(
    (hex: string, mode: "light" | "dark") => {
      const oklchValue = hexToOklch(hex)
      if (mode === "light") {
        handleLightChange(oklchValue)
      } else {
        handleDarkChange(oklchValue)
      }
    },
    [hexToOklch, handleLightChange, handleDarkChange]
  )

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="cursor-pointer">{children}</div>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">{label}</Label>
            <p className="text-muted-foreground text-xs">{tokenName}</p>
          </div>

          {/* Light Mode */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">Light Mode</Label>
            <div className="flex gap-2">
              <input
                type="color"
                value={oklchToHex(lightValue)}
                onChange={(e) => handleColorPickerChange(e.target.value, "light")}
                className="h-8 w-full cursor-pointer rounded border"
                disabled={isDarkMode}
              />
              <Input
                type="text"
                value={lightValue}
                onChange={(e) => handleLightChange(e.target.value)}
                placeholder="oklch(...)"
                className="h-8 font-mono text-xs"
                disabled={isDarkMode}
              />
            </div>
          </div>

          {/* Dark Mode */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">Dark Mode</Label>
            <div className="flex gap-2">
              <input
                type="color"
                value={oklchToHex(darkValue)}
                onChange={(e) => handleColorPickerChange(e.target.value, "dark")}
                className="h-8 w-full cursor-pointer rounded border"
                disabled={!isDarkMode}
              />
              <Input
                type="text"
                value={darkValue}
                onChange={(e) => handleDarkChange(e.target.value)}
                placeholder="oklch(...)"
                className="h-8 font-mono text-xs"
                disabled={!isDarkMode}
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
