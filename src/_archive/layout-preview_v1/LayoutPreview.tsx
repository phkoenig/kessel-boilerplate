"use client"

import * as React from "react"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { cn } from "@/lib/utils"
import type { LayoutArchetype } from "@/layouts/archetypes/types"

/**
 * Props für die LayoutPreview-Komponente.
 */
export interface LayoutPreviewProps {
  /** Layout-Archetyp-Konfiguration */
  archetype: LayoutArchetype
  /** Zusätzliche CSS-Klassen */
  className?: string
  /** Ob die Panels interaktiv (resizable) sein sollen */
  interactive?: boolean
  /** Callback wenn Größen geändert werden */
  onLayoutChange?: (sizes: Record<string, number>) => void
}

/**
 * Region-Label Komponente für konsistente Darstellung.
 */
function RegionLabel({
  children,
  variant = "default",
}: {
  children: React.ReactNode
  variant?: "default" | "muted" | "accent"
}) {
  return (
    <span
      className={cn(
        "text-xs font-medium tracking-wider uppercase select-none",
        variant === "default" && "text-foreground/70",
        variant === "muted" && "text-muted-foreground/50",
        variant === "accent" && "text-primary/70"
      )}
    >
      {children}
    </span>
  )
}

/**
 * Interaktive Layout-Preview mit Resizable-Panels.
 *
 * Ersetzt statische SVG-Previews durch eine interaktive Darstellung
 * der Layout-Archetypen. Nutzer können die Proportionen der Regionen
 * live anpassen.
 *
 * @example
 * ```tsx
 * <LayoutPreview
 *   archetype={getArchetype("standard")}
 *   interactive
 *   onLayoutChange={(sizes) => console.log(sizes)}
 * />
 * ```
 */
export function LayoutPreview({
  archetype,
  className,
  interactive = true,
  onLayoutChange,
}: LayoutPreviewProps): React.ReactElement {
  const { regions } = archetype

  // Berechne initiale Größen basierend auf CSS-Variablen
  const headerSize = 8 // ~8% für Header
  const footerSize = 6 // ~6% für Footer
  const sidebarSize = 20 // ~20% für Sidebar
  const drawerSize = 25 // ~25% für Drawer
  const filterSize = 20 // ~20% für Filter

  // Handler für Größenänderungen
  const handleResize = React.useCallback(
    (region: string, sizes: number[]) => {
      if (onLayoutChange) {
        onLayoutChange({ [region]: sizes[0] })
      }
    },
    [onLayoutChange]
  )

  // Standard Layout (Header + Sidebar + Main + Footer)
  if (archetype.id === "standard") {
    return (
      <div className={cn("bg-muted/30 border-border overflow-hidden rounded-lg border", className)}>
        <ResizablePanelGroup
          direction="vertical"
          className="min-h-[300px]"
          onLayout={(sizes) => handleResize("vertical", sizes)}
        >
          {/* Header */}
          <ResizablePanel defaultSize={headerSize} minSize={5} maxSize={15}>
            <div className="bg-muted/50 flex h-full items-center justify-center border-b">
              <RegionLabel>Header</RegionLabel>
            </div>
          </ResizablePanel>

          {interactive && <ResizableHandle />}

          {/* Middle Section: Sidebar + Main */}
          <ResizablePanel defaultSize={100 - headerSize - footerSize}>
            <ResizablePanelGroup
              direction="horizontal"
              onLayout={(sizes) => handleResize("horizontal", sizes)}
            >
              {/* Sidebar */}
              <ResizablePanel defaultSize={sidebarSize} minSize={10} maxSize={35}>
                <div className="bg-muted/30 flex h-full items-center justify-center border-r">
                  <RegionLabel variant="muted">Sidebar</RegionLabel>
                </div>
              </ResizablePanel>

              {interactive && <ResizableHandle withHandle />}

              {/* Main Content */}
              <ResizablePanel defaultSize={100 - sidebarSize}>
                <div className="flex h-full items-center justify-center">
                  <div className="border-border/50 flex h-3/4 w-3/4 items-center justify-center rounded-md border border-dashed">
                    <RegionLabel variant="accent">Main</RegionLabel>
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          {interactive && <ResizableHandle />}

          {/* Footer */}
          <ResizablePanel defaultSize={footerSize} minSize={4} maxSize={12}>
            <div className="bg-muted/50 flex h-full items-center justify-center border-t">
              <RegionLabel>Footer</RegionLabel>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    )
  }

  // Standard + Drawer Layout
  if (archetype.id === "standard-drawer") {
    return (
      <div className={cn("bg-muted/30 border-border overflow-hidden rounded-lg border", className)}>
        <ResizablePanelGroup
          direction="vertical"
          className="min-h-[300px]"
          onLayout={(sizes) => handleResize("vertical", sizes)}
        >
          {/* Header */}
          <ResizablePanel defaultSize={headerSize} minSize={5} maxSize={15}>
            <div className="bg-muted/50 flex h-full items-center justify-center border-b">
              <RegionLabel>Header</RegionLabel>
            </div>
          </ResizablePanel>

          {interactive && <ResizableHandle />}

          {/* Middle Section: Sidebar + Main + Drawer */}
          <ResizablePanel defaultSize={100 - headerSize - footerSize}>
            <ResizablePanelGroup
              direction="horizontal"
              onLayout={(sizes) => handleResize("horizontal", sizes)}
            >
              {/* Sidebar */}
              <ResizablePanel defaultSize={sidebarSize} minSize={10} maxSize={30}>
                <div className="bg-muted/30 flex h-full items-center justify-center border-r">
                  <RegionLabel variant="muted">Sidebar</RegionLabel>
                </div>
              </ResizablePanel>

              {interactive && <ResizableHandle withHandle />}

              {/* Main Content */}
              <ResizablePanel defaultSize={100 - sidebarSize - drawerSize} minSize={30}>
                <div className="flex h-full items-center justify-center">
                  <div className="border-border/50 flex h-3/4 w-3/4 items-center justify-center rounded-md border border-dashed">
                    <RegionLabel variant="accent">Main</RegionLabel>
                  </div>
                </div>
              </ResizablePanel>

              {interactive && <ResizableHandle withHandle />}

              {/* Drawer */}
              <ResizablePanel defaultSize={drawerSize} minSize={15} maxSize={40}>
                <div className="bg-accent/20 flex h-full items-center justify-center border-l">
                  <RegionLabel variant="accent">Drawer</RegionLabel>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          {interactive && <ResizableHandle />}

          {/* Footer */}
          <ResizablePanel defaultSize={footerSize} minSize={4} maxSize={12}>
            <div className="bg-muted/50 flex h-full items-center justify-center border-t">
              <RegionLabel>Footer</RegionLabel>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    )
  }

  // Standard + Filter Layout
  if (archetype.id === "standard-filter") {
    return (
      <div className={cn("bg-muted/30 border-border overflow-hidden rounded-lg border", className)}>
        <ResizablePanelGroup
          direction="vertical"
          className="min-h-[300px]"
          onLayout={(sizes) => handleResize("vertical", sizes)}
        >
          {/* Header */}
          <ResizablePanel defaultSize={headerSize} minSize={5} maxSize={15}>
            <div className="bg-muted/50 flex h-full items-center justify-center border-b">
              <RegionLabel>Header</RegionLabel>
            </div>
          </ResizablePanel>

          {interactive && <ResizableHandle />}

          {/* Middle Section: Sidebar + Filter + Main */}
          <ResizablePanel defaultSize={100 - headerSize - footerSize}>
            <ResizablePanelGroup
              direction="horizontal"
              onLayout={(sizes) => handleResize("horizontal", sizes)}
            >
              {/* Sidebar */}
              <ResizablePanel defaultSize={sidebarSize - 5} minSize={8} maxSize={25}>
                <div className="bg-muted/30 flex h-full items-center justify-center border-r">
                  <RegionLabel variant="muted">Sidebar</RegionLabel>
                </div>
              </ResizablePanel>

              {interactive && <ResizableHandle withHandle />}

              {/* Filter Sidebar */}
              <ResizablePanel defaultSize={filterSize} minSize={12} maxSize={30}>
                <div className="bg-secondary/30 flex h-full items-center justify-center border-r">
                  <RegionLabel>Filter</RegionLabel>
                </div>
              </ResizablePanel>

              {interactive && <ResizableHandle withHandle />}

              {/* Main Content */}
              <ResizablePanel defaultSize={100 - sidebarSize - filterSize + 5} minSize={35}>
                <div className="flex h-full items-center justify-center">
                  <div className="border-border/50 flex h-3/4 w-3/4 items-center justify-center rounded-md border border-dashed">
                    <RegionLabel variant="accent">Main</RegionLabel>
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          {interactive && <ResizableHandle />}

          {/* Footer */}
          <ResizablePanel defaultSize={footerSize} minSize={4} maxSize={12}>
            <div className="bg-muted/50 flex h-full items-center justify-center border-t">
              <RegionLabel>Footer</RegionLabel>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    )
  }

  // Auth Layout (zentriert, minimal)
  if (archetype.id === "auth") {
    return (
      <div className={cn("bg-muted/30 border-border overflow-hidden rounded-lg border", className)}>
        <ResizablePanelGroup
          direction="vertical"
          className="min-h-[300px]"
          onLayout={(sizes) => handleResize("vertical", sizes)}
        >
          {/* Header (minimal) */}
          <ResizablePanel defaultSize={10} minSize={6} maxSize={15}>
            <div className="bg-muted/30 flex h-full items-center justify-center border-b">
              <RegionLabel variant="muted">Header</RegionLabel>
            </div>
          </ResizablePanel>

          {interactive && <ResizableHandle />}

          {/* Main Content - zentrierte Auth-Card */}
          <ResizablePanel defaultSize={80}>
            <div className="flex h-full items-center justify-center">
              <div className="bg-card border-border flex h-2/3 w-1/2 items-center justify-center rounded-lg border shadow-sm">
                <RegionLabel variant="accent">Auth Card</RegionLabel>
              </div>
            </div>
          </ResizablePanel>

          {interactive && <ResizableHandle />}

          {/* Footer (minimal) */}
          <ResizablePanel defaultSize={10} minSize={6} maxSize={15}>
            <div className="bg-muted/30 flex h-full items-center justify-center border-t">
              <RegionLabel variant="muted">Footer</RegionLabel>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    )
  }

  // Fallback für unbekannte Archetypen
  return (
    <div
      className={cn(
        "bg-muted/30 border-border flex min-h-[300px] items-center justify-center overflow-hidden rounded-lg border",
        className
      )}
    >
      <RegionLabel variant="muted">
        Preview für &quot;{archetype.id}&quot; nicht verfügbar
      </RegionLabel>
    </div>
  )
}
