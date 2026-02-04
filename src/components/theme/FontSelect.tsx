"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CURATED_FONTS, type FontCategory } from "@/lib/fonts/curated-fonts"
import { useTheme } from "@/lib/themes"

interface FontSelectProps {
  category: FontCategory
  value: string
  onChange: (font: string) => void
}

/**
 * Font-Auswahl Dropdown für den Design System Editor.
 * Zeigt kuratierte Google Fonts + Fonts aus bestehenden Themes.
 */
export function FontSelect({ category, value, onChange }: FontSelectProps): React.ReactElement {
  const { themes } = useTheme()

  // Sammle Fonts aus allen Themes
  const themeFonts = new Set<string>()
  themes.forEach((t) => {
    t.dynamicFonts?.forEach((f) => themeFonts.add(f))
  })

  // Kombiniere kuratierte + Theme-Fonts
  const allFonts = [...new Set([...CURATED_FONTS[category], ...Array.from(themeFonts)])].sort()

  // Extrahiere Font-Name aus CSS-Wert (z.B. "Inter, sans-serif" -> "Inter")
  const currentFontName = value ? value.split(",")[0].trim() : ""

  return (
    <Select value={currentFontName} onValueChange={onChange}>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Font wählen..." />
      </SelectTrigger>
      <SelectContent>
        {allFonts.map((font) => (
          <SelectItem key={font} value={font} style={{ fontFamily: font }}>
            {font}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
