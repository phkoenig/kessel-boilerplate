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

function isThemeDetailPanel(content: React.ReactNode): boolean {
  if (!isValidElement(content)) return false
  return content.type === ThemeDetailPanel
}

/**
 * DetailDrawer Komponente
 *
 * Spalte 4 des 4-Spalten-Layouts.
 * Zeigt optionalen Detail-Content, der von Seiten gesetzt wird.
 * Wenn kein Content vorhanden ist, wird das Panel automatisch versteckt.
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

  return (
    <div className={cn("relative flex h-full w-full flex-col", className)}>
      <div className={cn("min-h-0 flex-1 pt-2", showSaveButton && "pb-24")}>{content}</div>
      {showSaveButton && (
        <div className="pointer-events-none absolute right-0 bottom-0 left-0 p-4">
          <div className="bg-background/95 border-border pointer-events-auto rounded-lg border p-2 shadow-lg backdrop-blur-sm">
            <ThemeDetailPanelSaveButton forceVisible />
          </div>
        </div>
      )}
    </div>
  )
}
