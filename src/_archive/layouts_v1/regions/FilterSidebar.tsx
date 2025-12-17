"use client"

import { createContext, useContext, useState, useCallback } from "react"
import { X, Filter } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { defaultCSSVariables, zIndex } from "../config"
import { mediaQueries, isBreakpointActive } from "../breakpoints"

/**
 * Context-Wert für den Filter-Sidebar-State.
 */
interface FilterSidebarContextValue {
  /** Ist die Filter-Sidebar geöffnet? */
  isOpen: boolean
  /** Filter-Sidebar öffnen */
  open: () => void
  /** Filter-Sidebar schließen */
  close: () => void
  /** Filter-Sidebar-State umschalten */
  toggle: () => void
}

/**
 * Context für den Filter-Sidebar-State.
 */
const FilterSidebarContext = createContext<FilterSidebarContextValue | null>(null)

/**
 * Hook zum Zugriff auf den Filter-Sidebar-State.
 *
 * @returns FilterSidebarContextValue
 * @throws Error wenn außerhalb eines FilterSidebarProviders verwendet
 */
export function useFilterSidebar(): FilterSidebarContextValue {
  const context = useContext(FilterSidebarContext)
  if (!context) {
    throw new Error("useFilterSidebar must be used within a FilterSidebarProvider")
  }
  return context
}

/**
 * Props für den FilterSidebarProvider.
 */
export interface FilterSidebarProviderProps {
  /** Child-Komponenten */
  children: React.ReactNode
  /** Ist die Filter-Sidebar initial geöffnet? */
  defaultOpen?: boolean
}

/**
 * Provider für den Filter-Sidebar-State.
 */
export function FilterSidebarProvider({
  children,
  defaultOpen = true,
}: FilterSidebarProviderProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])

  return (
    <FilterSidebarContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
    </FilterSidebarContext.Provider>
  )
}

/**
 * Props für die FilterSidebar-Komponente.
 */
export interface FilterSidebarProps {
  /** Inhalt der Filter-Sidebar */
  children: React.ReactNode

  /** Titel im Filter-Sidebar-Header */
  title?: string

  /** Breite der Filter-Sidebar (CSS-Wert) */
  width?: string
}

/**
 * Filter-Sidebar Komponente.
 *
 * Auf Desktop: Feste Sidebar links neben dem Main-Bereich.
 * Auf Mobile/Tablet: Sheet-Overlay.
 *
 * @see {@link FilterSidebarProps} für verfügbare Props
 * @see {@link useFilterSidebar} für programmatische Steuerung
 */
export function FilterSidebar({
  children,
  title = "Filter",
  width = defaultCSSVariables["--filter-sidebar-width"] ?? "16rem",
}: FilterSidebarProps): React.ReactElement {
  const { isOpen, close, toggle } = useFilterSidebar()

  // Prüfe ob Mobile/Tablet (Client-seitig)
  const isMobileOrTablet =
    typeof window !== "undefined" && isBreakpointActive(mediaQueries.mobileAndTablet)

  // Auf Desktop: Feste Sidebar
  if (!isMobileOrTablet && isOpen) {
    return (
      <aside
        className="border-border bg-card flex h-full flex-col border-r"
        style={{ width, zIndex: zIndex.sidebar }}
      >
        <div className="border-border flex h-11 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">{title}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={toggle}>
            <X className="h-4 w-4" />
            <span className="sr-only">Filter schließen</span>
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-4">{children}</div>
      </aside>
    )
  }

  // Auf Mobile/Tablet oder wenn geschlossen: Sheet
  return (
    <Sheet open={isOpen && isMobileOrTablet} onOpenChange={(open) => !open && close()}>
      <SheetContent
        side="left"
        className="flex flex-col"
        style={{
          width,
          maxWidth: "100vw",
          zIndex: zIndex.drawer,
        }}
      >
        <SheetHeader className="border-border border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <SheetTitle>{title}</SheetTitle>
            </div>
            <SheetClose asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <X className="h-4 w-4" />
                <span className="sr-only">Schließen</span>
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-auto py-4">{children}</div>
      </SheetContent>
    </Sheet>
  )
}

/**
 * Button zum Öffnen der Filter-Sidebar (für Mobile/Tablet).
 */
export function FilterSidebarTrigger(): React.ReactElement {
  const { toggle, isOpen } = useFilterSidebar()

  return (
    <Button variant="outline" size="sm" onClick={toggle} className="gap-2">
      <Filter className="h-4 w-4" />
      <span>{isOpen ? "Filter ausblenden" : "Filter anzeigen"}</span>
    </Button>
  )
}
