"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { useChatOverlay } from "./shell-context"
import { AIChatPanel } from "./AIChatPanel"
import { useAuth, usePermissions } from "@/components/auth"
import { AI_CHATBOT_FEATURE_ID } from "@/lib/features/feature-modules"

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
  const { role } = useAuth()
  const { canAccess, isLoaded: permissionsLoaded } = usePermissions()
  const panelRef = useRef<HTMLDivElement>(null)

  // Defense in depth: Auch wenn der Keyboard-Shortcut das Overlay oeffnet,
  // wird es hier verlaessich ausgeblendet, sobald die Rolle keinen Zugriff
  // auf das Feature "ai-chatbot" hat.
  const hasChatAccess = permissionsLoaded && canAccess(AI_CHATBOT_FEATURE_ID, role)

  // Escape-Key zum Schließen. Der Overlay soll bei Navigationen
  // und anderen Shell-Interaktionen offen bleiben, damit der Chat
  // wirklich persistent über Seitenwechsel nutzbar ist.
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false)
      }
    }

    window.addEventListener("keydown", handleEscape)

    return () => {
      window.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, setOpen])

  if (!isOpen) return null
  if (!hasChatAccess) return null

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
