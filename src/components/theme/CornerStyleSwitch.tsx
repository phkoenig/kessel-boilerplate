"use client"

import { useEffect, useState } from "react"
import { useTheme, type CornerStyle } from "@/lib/themes"
import { useThemeEditor } from "@/hooks/use-theme-editor"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

/**
 * Corner-Style Switch Komponente
 *
 * Ermöglicht das Umschalten zwischen:
 * - rounded: Standard border-radius
 * - squircle: iOS-style Superellipse (Progressive Enhancement)
 *
 * Squircle wird nur angewendet, wenn der Browser CSS corner-shape unterstützt.
 * Fallback ist immer rounded.
 *
 * Speichert sowohl in localStorage (für sofortige Anwendung) als auch
 * in pendingChanges (für Theme-Speicherung).
 */
export function CornerStyleSwitch(): React.ReactElement {
  const { cornerStyle, setCornerStyle, supportsSquircle } = useTheme()
  const { previewToken } = useThemeEditor()

  // Hydration-Guard: cornerStyle kommt aus localStorage und supportsSquircle
  // aus CSS.supports — beides liefert auf Server vs. Client unterschiedliche
  // Werte und erzeugt sonst einen Hydration-Mismatch am ToggleGroup.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- bewusst: Hydration-Guard, nach Mount echte Werte freischalten.
    setMounted(true)
  }, [])

  const effectiveCornerStyle: CornerStyle = mounted ? cornerStyle : "rounded"
  const effectiveSupportsSquircle = mounted ? supportsSquircle : false

  const handleCornerStyleChange = (value: string | undefined) => {
    if (!value) return
    const style = value as CornerStyle
    // 1. Sofort anwenden (localStorage + data-corner-style Attribut)
    setCornerStyle(style)
    // 2. In pendingChanges speichern für Theme-Export
    previewToken("--corner-style", style)
  }

  return (
    <div className="w-64 space-y-2">
      <Label className="text-sm font-medium">Ecken-Stil</Label>
      <ToggleGroup
        type="single"
        value={effectiveCornerStyle}
        onValueChange={handleCornerStyleChange}
        variant="outline"
        spacing={0}
        className="w-full"
      >
        <ToggleGroupItem
          value="rounded"
          className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground flex-1"
        >
          Rounded
        </ToggleGroupItem>
        <ToggleGroupItem
          value="squircle"
          className={cn(
            "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground flex-1",
            !effectiveSupportsSquircle && "opacity-60"
          )}
        >
          Squircle
        </ToggleGroupItem>
      </ToggleGroup>
      <p className="text-muted-foreground text-xs">
        {effectiveCornerStyle === "squircle" && !effectiveSupportsSquircle
          ? "Wird aktiviert sobald dein Browser es unterstützt (Chrome 139+)."
          : effectiveCornerStyle === "squircle"
            ? "iOS-style weiche Ecken"
            : "Standard abgerundete Ecken"}
      </p>
    </div>
  )
}
