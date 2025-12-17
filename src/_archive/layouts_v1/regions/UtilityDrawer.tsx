"use client"

import { createContext, useContext, useState, useCallback } from "react"
import { X } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { defaultCSSVariables, zIndex } from "../config"

/**
 * Context-Wert für den Drawer-State.
 */
interface DrawerContextValue {
  /** Ist der Drawer geöffnet? */
  isOpen: boolean
  /** Drawer öffnen */
  open: () => void
  /** Drawer schließen */
  close: () => void
  /** Drawer-State umschalten */
  toggle: () => void
}

/**
 * Context für den Drawer-State.
 * Ermöglicht Zugriff auf den Drawer-State von überall in der App.
 */
const DrawerContext = createContext<DrawerContextValue | null>(null)

/**
 * Hook zum Zugriff auf den Drawer-State.
 *
 * @returns DrawerContextValue
 * @throws Error wenn außerhalb eines DrawerProviders verwendet
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { open, close, isOpen, toggle } = useDrawer()
 *   return <Button onClick={toggle}>Toggle Drawer</Button>
 * }
 * ```
 */
export function useDrawer(): DrawerContextValue {
  const context = useContext(DrawerContext)
  if (!context) {
    throw new Error("useDrawer must be used within a DrawerProvider")
  }
  return context
}

/**
 * Props für den DrawerProvider.
 */
export interface DrawerProviderProps {
  /** Child-Komponenten */
  children: React.ReactNode
  /** Ist der Drawer initial geöffnet? */
  defaultOpen?: boolean
}

/**
 * Provider für den Drawer-State.
 *
 * Muss das Layout umschließen, um useDrawer zu ermöglichen.
 */
export function DrawerProvider({
  children,
  defaultOpen = false,
}: DrawerProviderProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])

  return (
    <DrawerContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
    </DrawerContext.Provider>
  )
}

/**
 * Props für die UtilityDrawer-Komponente.
 */
export interface UtilityDrawerProps {
  /** Inhalt des Drawers */
  children: React.ReactNode

  /** Titel im Drawer-Header */
  title?: string

  /** Breite des Drawers (CSS-Wert) */
  width?: string

  /** Position des Drawers */
  side?: "left" | "right"
}

/**
 * Utility Drawer Komponente.
 *
 * Ein Sheet-basierter Drawer für Utility-Funktionen wie:
 * - Hilfe / FAQ
 * - Chat / AI-Assistenz
 * - Kommentare
 * - Detail-Panels
 *
 * Verwendet den DrawerContext für State-Management.
 *
 * @see {@link UtilityDrawerProps} für verfügbare Props
 * @see {@link useDrawer} für programmatische Steuerung
 */
export function UtilityDrawer({
  children,
  title = "Details",
  width = defaultCSSVariables["--drawer-width"],
  side = "right",
}: UtilityDrawerProps): React.ReactElement {
  const { isOpen, close } = useDrawer()

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent
        side={side}
        className="flex flex-col"
        style={{
          width,
          maxWidth: "100vw",
          zIndex: zIndex.drawer,
        }}
      >
        <SheetHeader className="border-border border-b pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle>{title}</SheetTitle>
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
