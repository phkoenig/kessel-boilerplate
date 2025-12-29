"use client"

import { cn } from "@/lib/utils"
import { useDetailDrawer } from "./shell-context"
import { ThemeDetailPanelSaveButton, ThemeDetailPanel } from "@/components/theme/ThemeDetailPanel"
import { isValidElement } from "react"

/**
 * DetailDrawer Props
 */
interface DetailDrawerProps {
  /** Zusätzliche CSS-Klassen */
  className?: string
}

/**
 * Prüft ob der Content ein ThemeDetailPanel ist
 */
function isThemeDetailPanel(content: React.ReactNode): boolean {
  if (!isValidElement(content)) return false
  // Prüfe ob es ein ThemeDetailPanel ist (über direkten Vergleich mit der Komponente)
  return content.type === ThemeDetailPanel
}

/**
 * DetailDrawer Komponente
 *
 * Spalte 4 des 4-Spalten-Layouts.
 * Zeigt optionalen Detail-Content, der von Seiten gesetzt wird.
 * Wenn kein Content vorhanden ist, wird das Panel automatisch versteckt.
 *
 * Für ThemeDetailPanel: Rendert zusätzlich den Save-Button am Bottom.
 *
 * @example
 * ```tsx
 * // In einer Seite:
 * const { setContent } = useDetailDrawer()
 * useEffect(() => {
 *   setContent(<MyDetailContent />)
 *   return () => setContent(null) // Cleanup
 * }, [])
 * ```
 */
export function DetailDrawer({ className }: DetailDrawerProps): React.ReactElement | null {
  const { content } = useDetailDrawer()

  // Wenn kein Content, nichts rendern (Panel wird in AppShell versteckt)
  if (!content) {
    return null
  }

  const showSaveButton = isThemeDetailPanel(content)

  // Content in flex-Container rendern - Button am Bottom wenn ThemeDetailPanel
  return (
    <div className={cn("flex h-full w-full flex-col", className)}>
      {/* Content nimmt verfügbaren Platz ein */}
      <div className="min-h-0 flex-1 pt-2">{content}</div>
      {/* Save Button am Bottom - nur für ThemeDetailPanel */}
      {showSaveButton && (
        <div className="pb-2">
          <ThemeDetailPanelSaveButton />
        </div>
      )}
    </div>
  )
}
