"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { useChatOverlay } from "./shell-context"
import { AIChatPanel } from "./AIChatPanel"

/**
 * ChatOverlay Komponente
 *
 * Overlay-Panel für den KI-Chat mit Blur-Background.
 * Positioniert unten rechts, resizable, schwebt über dem Content.
 * Scrolling der dahinterliegenden Seite bleibt möglich.
 *
 * @example
 * ```tsx
 * {chatOverlayOpen && <ChatOverlay />}
 * ```
 */
export function ChatOverlay(): React.ReactElement | null {
  const { isOpen, setOpen } = useChatOverlay()
  const panelRef = useRef<HTMLDivElement>(null)

  // Escape-Key zum Schließen + Click Outside
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false)
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    window.addEventListener("keydown", handleEscape)
    // Kleiner Delay damit der Click, der das Panel öffnet, es nicht sofort wieder schließt
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside)
    }, 100)

    return () => {
      window.removeEventListener("keydown", handleEscape)
      document.removeEventListener("mousedown", handleClickOutside)
      clearTimeout(timeoutId)
    }
  }, [isOpen, setOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Chat-Panel mit Glassmorphism (innerhalb Spalte 3) */}
      <div
        ref={panelRef}
        className="pointer-events-auto absolute top-24 right-6 z-50 h-[calc(100%-6rem-5rem)] w-full max-w-md"
      >
        <div
          className={cn(
            "flex h-full flex-col overflow-hidden rounded-xl",
            // Glassmorphism: mehr Transparenz
            "bg-popover/60 backdrop-blur-md",
            "border shadow-2xl"
          )}
        >
          {/* Chat Content - Thread-Breite auf 100% für Overlay */}
          <div
            className="flex min-h-0 flex-1 flex-col"
            style={{ ["--thread-max-width" as string]: "100%" }}
          >
            <AIChatPanel />
          </div>
        </div>
      </div>
    </>
  )
}
