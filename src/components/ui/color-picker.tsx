"use client"

import { useState, useCallback, useEffect } from "react"
import { HexColorPicker, HexColorInput } from "react-colorful"
import Color from "color"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface ColorPickerProps {
  /** Aktueller Farbwert (Hex, RGB, OKLCH, etc.) */
  value: string
  /** Callback wenn sich die Farbe ändert */
  onChange: (value: string) => void
  /** Ausgabeformat */
  format?: "hex" | "rgb" | "oklch"
  /** Custom Trigger Element */
  children?: React.ReactNode
  /** Zusätzliche Klassen */
  className?: string
  /** Deaktiviert */
  disabled?: boolean
}

/**
 * Konvertiert einen Farbwert zu Hex
 */
function toHex(colorValue: string): string {
  try {
    // Versuche OKLCH zu parsen via Canvas
    if (colorValue.startsWith("oklch")) {
      if (typeof document !== "undefined") {
        const canvas = document.createElement("canvas")
        canvas.width = 1
        canvas.height = 1
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.fillStyle = colorValue
          ctx.fillRect(0, 0, 1, 1)
          const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
          return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
        }
      }
      return "#808080"
    }
    // Andere Formate via color-Bibliothek
    return Color(colorValue).hex()
  } catch {
    return "#808080"
  }
}

/**
 * Konvertiert Hex zu RGB-String
 */
function toRgb(hex: string): string {
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
function toOklch(hex: string): string {
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
 * ColorPicker - Farbauswahl-Komponente
 *
 * Zeigt einen schönen Color-Picker (react-colorful) direkt im Popover.
 * Kein Zwischenschritt - Picker öffnet sich sofort!
 */
export function ColorPicker({
  value,
  onChange,
  format = "hex",
  children,
  className,
  disabled = false,
}: ColorPickerProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false)
  const [hexValue, setHexValue] = useState(() => toHex(value))

  // Sync mit externem Wert
  useEffect(() => {
    setHexValue(toHex(value))
  }, [value])

  const handleColorChange = useCallback(
    (hex: string) => {
      setHexValue(hex)

      // Konvertiere zum gewünschten Format
      let outputValue: string
      switch (format) {
        case "rgb":
          outputValue = toRgb(hex)
          break
        case "oklch":
          outputValue = toOklch(hex)
          break
        default:
          outputValue = hex
      }
      onChange(outputValue)
    },
    [onChange, format]
  )

  const rgbValue = toRgb(hexValue)
  const oklchValue = toOklch(hexValue)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        {children || (
          <Button
            variant="outline"
            size="icon"
            className={cn("size-8 rounded-md", className)}
            style={{ backgroundColor: hexValue }}
            disabled={disabled}
          />
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start" sideOffset={8}>
        {/* react-colorful Picker - öffnet sich sofort! */}
        <div className="space-y-4">
          <HexColorPicker
            color={hexValue}
            onChange={handleColorChange}
            style={{ width: "200px", height: "160px" }}
          />

          {/* Hex Input */}
          <div className="flex items-center gap-2">
            <Label className="text-muted-foreground w-12 text-xs">Hex</Label>
            <HexColorInput
              color={hexValue}
              onChange={handleColorChange}
              prefixed
              className="border-input bg-background h-8 flex-1 rounded-md border px-2 font-mono text-sm uppercase"
            />
          </div>

          {/* Farbformate (nur Anzeige) */}
          <div className="border-border space-y-1 border-t pt-2">
            <div className="flex items-center justify-between">
              <Label className="text-muted-foreground text-xs">RGB</Label>
              <span className="text-muted-foreground font-mono text-xs">{rgbValue}</span>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-muted-foreground text-xs">OKLCH</Label>
              <span className="text-muted-foreground font-mono text-xs">{oklchValue}</span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
