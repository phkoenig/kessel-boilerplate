"use client"

import * as React from "react"
import * as ResizablePrimitive from "react-resizable-panels"

import { cn } from "@/lib/utils"

function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) {
  return (
    <ResizablePrimitive.PanelGroup
      data-slot="resizable-panel-group"
      className={cn("flex h-full w-full data-[panel-group-direction=vertical]:flex-col", className)}
      {...props}
    />
  )
}

function ResizablePanel({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Panel>) {
  return (
    <ResizablePrimitive.Panel
      data-slot="resizable-panel"
      className={cn(
        // Keine automatische Transition - verhindert Zucken bei Panel-Toggles
        // Wenn Transition gewünscht, sollte sie explizit pro Panel gesteuert werden
        className
      )}
      {...props}
    />
  )
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean
}) {
  return (
    <ResizablePrimitive.PanelResizeHandle
      data-slot="resizable-handle"
      style={{ width: "1px" }}
      suppressHydrationWarning
      className={cn(
        // Basis: sichtbare Linie (feste 1px Breite via inline style für Konsistenz)
        "bg-border focus-visible:ring-ring relative flex items-center justify-center",
        // Z-Index: höher als alle Navbar-Elemente
        "z-50",
        // Unsichtbarer Klickbereich (8px breit für einfaches Greifen)
        "after:absolute after:inset-y-0 after:left-1/2 after:w-8 after:-translate-x-1/2",
        // Focus-Styles
        "focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-hidden",
        // Vertikale Variante
        "data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full",
        "data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-8",
        "data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:translate-x-0",
        "data-[panel-group-direction=vertical]:after:-translate-y-1/2",
        "[&[data-panel-group-direction=vertical]>div]:rotate-90",
        className
      )}
      {...props}
    >
      {withHandle && <div className="bg-muted-foreground/50 z-50 h-12 w-1.5 rounded-full" />}
    </ResizablePrimitive.PanelResizeHandle>
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
