"use client"

import { type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { FolderTree, Calendar, ListOrdered, BookOpen } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { navigationConfig, findNavItemByHref } from "@/config/navigation"

/**
 * Explorer Varianten
 */
export type ExplorerVariant = "files" | "dates" | "stepper" | "outline" | "custom"

/**
 * Explorer Varianten Konfiguration
 */
const variantConfig: Record<ExplorerVariant, { icon: typeof FolderTree; label: string }> = {
  files: { icon: FolderTree, label: "Dateien" },
  dates: { icon: Calendar, label: "Kalender" },
  stepper: { icon: ListOrdered, label: "Schritte" },
  outline: { icon: BookOpen, label: "Gliederung" },
  custom: { icon: FolderTree, label: "Explorer" },
}

/**
 * ExplorerPanel Props
 */
interface ExplorerPanelProps {
  /** Titel des Panels (überschreibt automatischen Titel) */
  title?: string
  /** Variante des Explorers */
  variant?: ExplorerVariant
  /** Panel Content */
  children?: ReactNode
  /** Zusätzliche CSS-Klassen */
  className?: string
  /** Header-Actions (rechts vom Titel) */
  headerActions?: ReactNode
  /** Footer Content */
  footer?: ReactNode
}

/**
 * ExplorerPanel Komponente
 *
 * Spalte 2 des 4-Spalten-Layouts.
 * Slot-basiert für verschiedene Varianten:
 * - Files: Datei-Browser
 * - Dates: Kalender/Datums-Navigation
 * - Stepper: Prozess-Schritte
 * - Outline: Dokument-Gliederung
 *
 * @example
 * ```tsx
 * <ExplorerPanel variant="files" title="Dokumente">
 *   <FileTree data={files} />
 * </ExplorerPanel>
 * ```
 */
export function ExplorerPanel({
  title,
  variant = "custom",
  children,
  className,
  headerActions,
  footer,
}: ExplorerPanelProps): React.ReactElement {
  const pathname = usePathname()
  const config = variantConfig[variant]
  const Icon = config.icon

  // Automatischer Titel aus aktivem Menüpunkt, mit Fallback auf manuellen Titel oder Varianten-Label
  const activeNavItem = findNavItemByHref(navigationConfig, pathname)
  const displayTitle = title ?? activeNavItem?.label ?? config.label

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Header - identisch mit Navbar App-Name Header */}
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className="text-muted-foreground size-5 shrink-0" />
          <h2 className="text-foreground truncate text-lg font-bold">{displayTitle}</h2>
        </div>
        {headerActions && <div className="flex items-center gap-1">{headerActions}</div>}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-1">{children}</div>
      </ScrollArea>

      {/* Footer */}
      {footer && <div className="border-border border-t px-4 py-2">{footer}</div>}
    </div>
  )
}

/**
 * Explorer File Tree Placeholder
 * Beispiel-Content für Datei-Navigation
 */
export function ExplorerFileTree(): React.ReactElement {
  const folders = [
    { name: "Dokumente", count: 12 },
    { name: "Bilder", count: 34 },
    { name: "Projekte", count: 8 },
    { name: "Archiv", count: 156 },
  ]

  return (
    <div className="space-y-1">
      {folders.map((folder) => (
        <Button
          key={folder.name}
          variant="ghost"
          className="w-full justify-start gap-2 text-sm"
          data-ai-exempt="true"
        >
          <FolderTree className="text-muted-foreground size-4" />
          <span className="flex-1 text-left">{folder.name}</span>
          <span className="text-muted-foreground text-xs">{folder.count}</span>
        </Button>
      ))}
    </div>
  )
}

/**
 * Explorer Outline Placeholder
 * Beispiel-Content für Dokument-Gliederung
 */
export function ExplorerOutline(): React.ReactElement {
  const sections = [
    { level: 1, title: "Einleitung" },
    { level: 2, title: "Hintergrund" },
    { level: 2, title: "Motivation" },
    { level: 1, title: "Hauptteil" },
    { level: 2, title: "Methodik" },
    { level: 2, title: "Ergebnisse" },
    { level: 3, title: "Analyse" },
    { level: 3, title: "Diskussion" },
    { level: 1, title: "Fazit" },
  ]

  return (
    <div className="space-y-0.5">
      {sections.map((section, index) => (
        <Button
          key={index}
          variant="ghost"
          data-ai-exempt="true"
          className={cn(
            "w-full justify-start text-sm",
            section.level === 1 && "font-medium",
            section.level === 2 && "text-muted-foreground pl-6",
            section.level === 3 && "text-muted-foreground pl-12"
          )}
        >
          {section.title}
        </Button>
      ))}
    </div>
  )
}
