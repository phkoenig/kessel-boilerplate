"use client"

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

/**
 * FloatingPagination Props
 */
interface FloatingPaginationProps {
  /** Aktuelle Seite (1-basiert) */
  currentPage: number
  /** Gesamtzahl der Seiten */
  totalPages: number
  /** Callback wenn Seite geändert wird */
  onPageChange: (page: number) => void
  /** Zusätzliche CSS-Klassen */
  className?: string
  /** Erste/Letzte Seite Buttons anzeigen */
  showFirstLast?: boolean
  /** Seitenzahl anzeigen */
  showPageNumbers?: boolean
  /** Position (left, center, right) */
  position?: "left" | "center" | "right"
}

/**
 * FloatingPagination Komponente
 *
 * Schwebende Pill-förmige Pagination für die Main Area.
 * Positioniert sich unten und schwebt über dem Content.
 *
 * Features:
 * - Pill-Form mit Glassmorphism-Effekt
 * - Vor/Zurück Navigation
 * - Optional: Erste/Letzte Seite
 * - Optional: Seitenzahl-Anzeige
 *
 * @example
 * ```tsx
 * <FloatingPagination
 *   currentPage={3}
 *   totalPages={10}
 *   onPageChange={(page) => setCurrentPage(page)}
 *   showFirstLast
 *   showPageNumbers
 * />
 * ```
 */
export function FloatingPagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  showFirstLast = true,
  showPageNumbers = true,
  position = "center",
}: FloatingPaginationProps): React.ReactElement {
  const canGoPrev = currentPage > 1
  const canGoNext = currentPage < totalPages

  const positionClasses = {
    left: "left-4",
    center: "left-1/2 -translate-x-1/2",
    right: "right-4",
  }

  // Wenn nur 1 Seite, nicht anzeigen
  if (totalPages <= 1) {
    return <></>
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          // Position: Schwebt unten
          "absolute bottom-4 z-20",
          positionClasses[position],
          // Pill-Form: Invertiert (dunkel), feste Höhe
          "bg-foreground text-background flex h-8 items-center gap-0.5 rounded-full px-1",
          className
        )}
      >
        {/* Erste Seite */}
        {showFirstLast && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onPageChange(1)}
                disabled={!canGoPrev}
                className="text-background hover:bg-background/20 hover:text-background size-6 rounded-full"
              >
                <ChevronsLeft className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Erste Seite</TooltipContent>
          </Tooltip>
        )}

        {/* Vorherige Seite */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={!canGoPrev}
              className="text-background hover:bg-background/20 hover:text-background size-6 rounded-full"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Vorherige Seite</TooltipContent>
        </Tooltip>

        {/* Seitenzahl */}
        {showPageNumbers && (
          <div className="text-background px-2 text-xs font-medium">
            {currentPage} / {totalPages}
          </div>
        )}

        {/* Nächste Seite */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={!canGoNext}
              className="text-background hover:bg-background/20 hover:text-background size-6 rounded-full"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Nächste Seite</TooltipContent>
        </Tooltip>

        {/* Letzte Seite */}
        {showFirstLast && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onPageChange(totalPages)}
                disabled={!canGoNext}
                className="text-background hover:bg-background/20 hover:text-background size-6 rounded-full"
              >
                <ChevronsRight className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Letzte Seite</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}

/**
 * FloatingNavigation Props - Für einfache Vor/Zurück Navigation
 */
interface FloatingNavigationProps {
  /** Callback für Zurück */
  onPrev?: () => void
  /** Callback für Weiter */
  onNext?: () => void
  /** Zurück deaktiviert */
  prevDisabled?: boolean
  /** Weiter deaktiviert */
  nextDisabled?: boolean
  /** Label für Zurück */
  prevLabel?: string
  /** Label für Weiter */
  nextLabel?: string
  /** Zusätzliche CSS-Klassen */
  className?: string
  /** Position */
  position?: "left" | "center" | "right"
}

/**
 * FloatingNavigation Komponente
 *
 * Einfache schwebende Navigation für Vor/Zurück ohne Seitenzahlen.
 * Ideal für Wizard-artige Flows oder Kapitel-Navigation.
 *
 * @example
 * ```tsx
 * <FloatingNavigation
 *   onPrev={() => router.push('/prev')}
 *   onNext={() => router.push('/next')}
 *   prevLabel="Vorheriges Kapitel"
 *   nextLabel="Nächstes Kapitel"
 * />
 * ```
 */
export function FloatingNavigation({
  onPrev,
  onNext,
  prevDisabled = false,
  nextDisabled = false,
  prevLabel = "Zurück",
  nextLabel = "Weiter",
  className,
  position = "center",
}: FloatingNavigationProps): React.ReactElement {
  const positionClasses = {
    left: "left-4",
    center: "left-1/2 -translate-x-1/2",
    right: "right-4",
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          // Position: Schwebt unten
          "absolute bottom-4 z-20",
          positionClasses[position],
          // Pill-Form: Invertiert (dunkel), feste Höhe
          "bg-foreground text-background flex h-8 items-center gap-0.5 rounded-full px-1",
          className
        )}
      >
        {/* Zurück */}
        {onPrev && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onPrev}
                disabled={prevDisabled}
                className="text-background hover:bg-background/20 hover:text-background size-6 rounded-full"
              >
                <ChevronLeft className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{prevLabel}</TooltipContent>
          </Tooltip>
        )}

        {/* Weiter */}
        {onNext && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onNext}
                disabled={nextDisabled}
                className="text-background hover:bg-background/20 hover:text-background size-6 rounded-full"
              >
                <ChevronRight className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{nextLabel}</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}
