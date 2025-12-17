"use client"

import { MessageSquare, BookOpen, MessageCircle, ShoppingCart } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAssist, type AssistPanelType } from "./shell-context"

/**
 * Assist Panel Button Konfiguration
 */
const assistButtons: {
  type: AssistPanelType
  icon: typeof MessageSquare
  label: string
}[] = [
  { type: "chat", icon: MessageSquare, label: "AI-Chat" },
  { type: "wiki", icon: BookOpen, label: "Wiki" },
  { type: "comments", icon: MessageCircle, label: "Kommentare" },
  { type: "cart", icon: ShoppingCart, label: "Warenkorb" },
]

/**
 * FloatingAssistActions Props
 */
interface FloatingAssistActionsProps {
  /** Zusätzliche CSS-Klassen */
  className?: string
  /** Nur bestimmte Panel-Typen anzeigen */
  showOnly?: AssistPanelType[]
  /** Bestimmte Panel-Typen ausblenden */
  hide?: AssistPanelType[]
}

/**
 * FloatingAssistActions Komponente
 *
 * Schwebende runde Buttons zum Aktivieren der rechten Seitenleiste (Assist Panel).
 * Positioniert sich oben rechts und schwebt über dem Content.
 *
 * Features:
 * - Separate kreisförmige Buttons (h-8)
 * - Jeder Button ist ein eigenständiger runder Punkt
 * - Aktiver Panel wird hervorgehoben
 *
 * @example
 * ```tsx
 * // Alle Buttons
 * <FloatingAssistActions />
 *
 * // Nur bestimmte Buttons
 * <FloatingAssistActions showOnly={["chat", "wiki"]} />
 *
 * // Bestimmte ausblenden
 * <FloatingAssistActions hide={["cart"]} />
 * ```
 */
export function FloatingAssistActions({
  className,
  showOnly,
  hide = [],
}: FloatingAssistActionsProps): React.ReactElement {
  const { isOpen: assistOpen, activePanel, toggle: toggleAssist } = useAssist()

  // Filtere Buttons basierend auf showOnly und hide
  const visibleButtons = assistButtons.filter((btn) => {
    if (showOnly && !showOnly.includes(btn.type)) return false
    if (hide.includes(btn.type)) return false
    return true
  })

  if (visibleButtons.length === 0) {
    return <></>
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          // Position: Fixed oben rechts - schwebt ÜBER allem (auch AssistPanel)
          "fixed top-4 right-4 z-50",
          // Flex-Container für separate Buttons, feste Höhe
          "flex h-8 items-center gap-2",
          className
        )}
      >
        {visibleButtons.map(({ type, icon: Icon, label }) => (
          <Tooltip key={type}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleAssist(type)}
                className={cn(
                  // Separate runde Buttons
                  "size-8 rounded-full",
                  // Aktiver Button: etwas heller (60% opacity), sonst normal schwarz
                  assistOpen && activePanel === type
                    ? "bg-foreground/60 text-background"
                    : "bg-foreground text-background hover:bg-foreground/80"
                )}
              >
                <Icon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}
