"use client"

import { type ReactNode } from "react"

import { cn } from "@/lib/utils"

/**
 * MainFooter Props
 */
interface MainFooterProps {
  /** Zusätzliche CSS-Klassen */
  className?: string
  /** Content links */
  leftContent?: ReactNode
  /** Content rechts */
  rightContent?: ReactNode
  /** Content mittig */
  centerContent?: ReactNode
  /** Children (überschreibt left/center/right) */
  children?: ReactNode
}

/**
 * MainFooter Komponente
 *
 * Floating Footer für die Main Area (Spalte 3).
 * Position: Fixed am unteren Rand.
 *
 * Typische Inhalte:
 * - Pagination
 * - View-Controls (Grid/List)
 * - Status-Informationen
 *
 * @example
 * ```tsx
 * <MainFooter
 *   leftContent={<span>100 Einträge</span>}
 *   rightContent={<Pagination />}
 * />
 * ```
 */
export function MainFooter({
  className,
  leftContent,
  rightContent,
  centerContent,
  children,
}: MainFooterProps): React.ReactElement {
  // Wenn children vorhanden, nur diese rendern
  if (children) {
    return (
      <footer
        className={cn(
          "border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky bottom-0 z-10 border-t px-6 py-4 backdrop-blur",
          className
        )}
      >
        {children}
      </footer>
    )
  }

  return (
    <footer
      className={cn(
        "border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky bottom-0 z-10 flex items-center justify-between gap-4 border-t px-6 py-4 backdrop-blur",
        className
      )}
    >
      {/* Left */}
      <div className="text-muted-foreground flex items-center gap-2 text-sm">{leftContent}</div>

      {/* Center */}
      {centerContent && <div className="flex items-center gap-2">{centerContent}</div>}

      {/* Right */}
      <div className="text-muted-foreground flex items-center gap-2 text-sm">{rightContent}</div>
    </footer>
  )
}
