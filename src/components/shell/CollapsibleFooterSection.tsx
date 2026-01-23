"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface CollapsibleFooterSectionProps {
  /** Section-Titel (z.B. "APP-VERWALTUNG") */
  title: string
  /** Ist die Section aktuell geöffnet */
  isOpen: boolean
  /** Callback wenn sich der Open-State ändert */
  onOpenChange: (open: boolean) => void
  /** Children (Nav-Items) */
  children: React.ReactNode
  /** Ist die Navbar kollabiert (Icons-only) */
  collapsed?: boolean
}

/**
 * CollapsibleFooterSection Komponente
 *
 * Footer-Section die standardmäßig nur den Titel zeigt und on-hover/click
 * von unten nach oben aufklappt.
 *
 * Features:
 * - Hover-Detection für Desktop (onPointerEnter/Leave)
 * - Touch-Detection für Mobile (Click-Fallback)
 * - CSS Grid Animation für smooth height transitions
 * - Delay beim Öffnen/Schließen um versehentliches Triggern zu vermeiden
 * - Chevron-Icon das sich bei open rotiert
 */
export function CollapsibleFooterSection({
  title,
  isOpen,
  onOpenChange,
  children,
  collapsed = false,
}: CollapsibleFooterSectionProps): React.ReactElement {
  const [isPointerTouch, setIsPointerTouch] = useState(false)
  const openTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current)
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    }
  }, [])

  // Handle pointer enter (Desktop hover oder Touch start)
  const handlePointerEnter = (e: React.PointerEvent) => {
    // Prüfe ob es ein Touch-Event ist
    if (e.pointerType === "touch") {
      setIsPointerTouch(true)
      // Bei Touch: Sofort öffnen (kein Delay)
      if (!isOpen) {
        onOpenChange(true)
      }
      return
    }

    // Desktop: Hover mit Delay
    setIsPointerTouch(false)

    // Clear close timeout falls vorhanden
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }

    // Open mit Delay (150ms)
    openTimeoutRef.current = setTimeout(() => {
      if (!isOpen) {
        onOpenChange(true)
      }
    }, 150)
  }

  // Handle pointer leave (Desktop hover end)
  const handlePointerLeave = () => {
    // Clear open timeout falls vorhanden
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current)
      openTimeoutRef.current = null
    }

    // Close mit Delay (200ms) - nur wenn nicht Touch
    if (!isPointerTouch) {
      closeTimeoutRef.current = setTimeout(() => {
        if (isOpen) {
          onOpenChange(false)
        }
      }, 200)
    }
  }

  // Handle click (für Touch-Geräte als Toggle)
  const handleClick = () => {
    if (isPointerTouch) {
      // Bei Touch: Toggle
      onOpenChange(!isOpen)
    }
  }

  // Wenn collapsed, zeige nichts (bereits im Dropdown-Modus)
  if (collapsed) {
    return <>{children}</>
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative transition-colors duration-200", isOpen && "bg-sidebar-accent/20")}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
    >
      {/* Section Title - immer sichtbar */}
      <Button
        variant="ghost"
        className="text-muted-foreground flex h-auto w-full items-center justify-between px-4 py-4 text-xs font-semibold tracking-wider uppercase"
        aria-expanded={isOpen}
        aria-label={`${title} ${isOpen ? "ausblenden" : "einblenden"}`}
        data-ai-exempt="true"
      >
        <span>{title}</span>
        <ChevronUp
          className={cn(
            "size-4 shrink-0 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </Button>

      {/* Collapsible Content - CSS Grid Animation */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="p-2">{children}</div>
        </div>
      </div>
    </div>
  )
}
