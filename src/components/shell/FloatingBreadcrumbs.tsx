"use client"

import { Fragment } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"

import { cn } from "@/lib/utils"
import { useNavigation } from "@/lib/navigation"

/**
 * Breadcrumb Item Interface
 */
interface BreadcrumbItem {
  label: string
  href: string | null
  isLast: boolean
}

/**
 * FloatingBreadcrumbs Props
 */
interface FloatingBreadcrumbsProps {
  /** Zusätzliche CSS-Klassen */
  className?: string
  /** Home-Icon anzeigen */
  showHomeIcon?: boolean
  /** Maximale Anzahl sichtbarer Items */
  maxItems?: number
}

/**
 * FloatingBreadcrumbs Komponente
 *
 * Schwebende Breadcrumbs für die Main Area mit Glassmorphism-Effekt.
 * Positioniert sich oben links und schwebt über dem Content.
 *
 * Features:
 * - Pill-Form mit Glassmorphism-Effekt
 * - Optional: Navbar-Toggle Button integriert
 * - Schwebt über scrollbarem Content
 *
 * @example
 * ```tsx
 * <FloatingBreadcrumbs showNavbarToggle />
 * ```
 */
export function FloatingBreadcrumbs({
  className,
  showHomeIcon = true,
  maxItems = 5,
}: FloatingBreadcrumbsProps): React.ReactElement {
  const pathname = usePathname()
  const { getBreadcrumbs } = useNavigation()
  const items: BreadcrumbItem[] =
    pathname === "/"
      ? [{ label: "Home", href: "/", isLast: true }]
      : [
          { label: "Home", href: "/", isLast: false },
          ...getBreadcrumbs(pathname).map((item, index, all) => ({
            label: item.label,
            href: item.href,
            isLast: index === all.length - 1,
          })),
        ]

  // Kürzen wenn zu viele Items
  let displayItems = items
  if (items.length > maxItems) {
    displayItems = [items[0], { label: "...", href: "#", isLast: false }, ...items.slice(-2)]
  }

  return (
    <div
      suppressHydrationWarning
      className={cn(
        // Position: Schwebt oben links
        "absolute top-4 left-4 z-20",
        // Glassmorphism: Semi-transparenter Hintergrund mit Blur, Pillenform
        "bg-background/80 text-foreground flex h-8 items-center gap-1 rounded-full px-4 backdrop-blur-sm",
        className
      )}
    >
      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 text-sm"
        suppressHydrationWarning
      >
        <ol className="flex items-center gap-1" suppressHydrationWarning>
          {displayItems.map((item, index) => (
            <Fragment key={`${item.href ?? "crumb"}-${index}`}>
              {index > 0 && (
                <li aria-hidden="true">
                  <ChevronRight className="size-3 opacity-60" />
                </li>
              )}
              <li>
                {item.isLast ? (
                  <span className="font-medium" aria-current="page">
                    {index === 0 && showHomeIcon ? <Home className="size-3" /> : item.label}
                  </span>
                ) : item.label === "..." ? (
                  <span className="opacity-60">...</span>
                ) : !item.href ? (
                  <span className="opacity-70">{item.label}</span>
                ) : (
                  <Link
                    href={item.href}
                    className="opacity-70 transition-opacity hover:opacity-100"
                  >
                    {index === 0 && showHomeIcon ? <Home className="size-3" /> : item.label}
                  </Link>
                )}
              </li>
            </Fragment>
          ))}
        </ol>
      </nav>
    </div>
  )
}
