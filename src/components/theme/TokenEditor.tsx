"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useThemeEditor } from "@/hooks/use-theme-editor"
import { SaveThemeDialog } from "./SaveThemeDialog"
import { Save, RotateCcw, AlertCircle } from "lucide-react"
import { useTheme as useColorMode } from "next-themes"

/**
 * TokenEditor Komponente
 *
 * Zeigt bearbeitbare Design-Tokens mit Live-Preview.
 */
export function TokenEditor(): React.ReactElement {
  const { theme: colorMode } = useColorMode()
  const { previewToken, resetPreview, isDirty, getCurrentTokens } = useThemeEditor()
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)

  // Liste der bearbeitbaren Tokens
  const editableTokens = [
    { name: "--primary", label: "Primary", category: "Brand" },
    { name: "--secondary", label: "Secondary", category: "Brand" },
    { name: "--accent", label: "Accent", category: "Brand" },
    { name: "--background", label: "Background", category: "Base" },
    { name: "--foreground", label: "Foreground", category: "Base" },
    { name: "--card", label: "Card", category: "Base" },
    { name: "--card-foreground", label: "Card Foreground", category: "Base" },
    { name: "--muted", label: "Muted", category: "Base" },
    { name: "--muted-foreground", label: "Muted Foreground", category: "Base" },
    { name: "--destructive", label: "Destructive", category: "Status" },
    { name: "--border", label: "Border", category: "Base" },
    { name: "--input", label: "Input", category: "Base" },
    { name: "--ring", label: "Ring", category: "Base" },
  ]

  // Gruppiere Tokens nach Kategorie
  const tokensByCategory = editableTokens.reduce(
    (acc, token) => {
      if (!acc[token.category]) {
        acc[token.category] = []
      }
      acc[token.category].push(token)
      return acc
    },
    {} as Record<string, typeof editableTokens>
  )

  const handleColorChange = (tokenName: string, value: string, mode: "light" | "dark") => {
    const tokens = getCurrentTokens()
    const current = tokens[tokenName] || { light: "", dark: "" }
    const newValue =
      mode === "light"
        ? { light: value, dark: current.dark }
        : { light: current.light, dark: value }
    previewToken(tokenName, newValue.light, newValue.dark)
  }

  // Konvertiere OKLCH zu Hex für Color-Picker (vereinfacht)
  const oklchToHex = (oklch: string): string => {
    // Für jetzt: Wenn bereits Hex, verwende das
    if (oklch.startsWith("#")) return oklch
    // Sonst: Fallback zu schwarz (Color-Picker kann OKLCH nicht direkt)
    return "#000000"
  }

  // Konvertiere Hex zu OKLCH (vereinfacht - für Production sollte eine richtige Bibliothek verwendet werden)
  const hexToOklch = (hex: string): string => {
    // Für jetzt: Einfache Konvertierung (nicht perfekt, aber funktional)
    // In Production: Verwende eine OKLCH-Bibliothek wie culori
    return `oklch(0.5 0.2 250)` // Placeholder
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Token Editor</CardTitle>
              <CardDescription>
                Bearbeite Design-Tokens live. Änderungen werden sofort angezeigt.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isDirty && (
                <div className="text-warning flex items-center gap-2 text-sm">
                  <AlertCircle className="size-4" />
                  <span>Ungespeicherte Änderungen</span>
                </div>
              )}
              <Button variant="outline" size="sm" onClick={resetPreview} disabled={!isDirty}>
                <RotateCcw className="mr-2 size-4" />
                Zurücksetzen
              </Button>
              <Button size="sm" onClick={() => setIsSaveDialogOpen(true)} disabled={!isDirty}>
                <Save className="mr-2 size-4" />
                Speichern als...
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(tokensByCategory).map(([category, tokens]) => (
              <div key={category} className="space-y-4">
                <h4 className="text-sm font-semibold">{category}</h4>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {tokens.map((token) => {
                    const currentTokens = getCurrentTokens()
                    const current = currentTokens[token.name] || { light: "", dark: "" }
                    const isDark = colorMode === "dark"

                    return (
                      <div key={token.name} className="space-y-2">
                        <Label className="text-xs font-medium">{token.label}</Label>
                        <div className="flex gap-2">
                          <div className="flex-1 space-y-1">
                            <Label className="text-muted-foreground text-xs">Light</Label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={oklchToHex(current.light)}
                                onChange={(e) =>
                                  handleColorChange(token.name, hexToOklch(e.target.value), "light")
                                }
                                className="h-8 w-full cursor-pointer rounded border"
                                disabled={isDark}
                              />
                              <Input
                                type="text"
                                value={current.light}
                                onChange={(e) =>
                                  handleColorChange(token.name, e.target.value, "light")
                                }
                                placeholder="oklch(...)"
                                className="h-8 font-mono text-xs"
                                disabled={isDark}
                              />
                            </div>
                          </div>
                          <div className="flex-1 space-y-1">
                            <Label className="text-muted-foreground text-xs">Dark</Label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={oklchToHex(current.dark)}
                                onChange={(e) =>
                                  handleColorChange(token.name, hexToOklch(e.target.value), "dark")
                                }
                                className="h-8 w-full cursor-pointer rounded border"
                                disabled={!isDark}
                              />
                              <Input
                                type="text"
                                value={current.dark}
                                onChange={(e) =>
                                  handleColorChange(token.name, e.target.value, "dark")
                                }
                                placeholder="oklch(...)"
                                className="h-8 font-mono text-xs"
                                disabled={!isDark}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <SaveThemeDialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen} />
    </>
  )
}
