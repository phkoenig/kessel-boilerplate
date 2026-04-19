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
 * Breadcrumbs Props
 */
interface BreadcrumbsProps {
  /** Zusätzliche CSS-Klassen */
  className?: string
  /** Home-Icon anzeigen */
  showHomeIcon?: boolean
  /** Maximale Anzahl sichtbarer Items (Rest wird gekürzt) */
  maxItems?: number
}

/**
 * Breadcrumbs Komponente
 *
 * Generiert automatisch Breadcrumbs aus der aktuellen Route.
 * Spalte 2 (Explorer) ist transparent - nicht in Breadcrumbs abgebildet.
 *
 * @example
 * ```tsx
 * <Breadcrumbs />
 * // /account/theme → Home > Account > Personalisierung
 * ```
 */
export function Breadcrumbs({
  className,
  showHomeIcon = true,
  maxItems = 5,
}: BreadcrumbsProps): React.ReactElement {
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
    displayItems = [
      items[0], // Home
      { label: "...", href: "#", isLast: false },
      ...items.slice(-2), // Letzte 2 Items
    ]
  }

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1 text-sm", className)}>
      <ol className="flex items-center gap-1">
        {displayItems.map((item, index) => (
          <Fragment key={`${item.href ?? "crumb"}-${index}`}>
            {index > 0 && (
              <li aria-hidden="true">
                <ChevronRight className="text-muted-foreground size-4" />
              </li>
            )}
            <li>
              {item.isLast ? (
                <span className="text-foreground font-medium" aria-current="page">
                  {index === 0 && showHomeIcon ? <Home className="size-4" /> : item.label}
                </span>
              ) : item.label === "..." ? (
                <span className="text-muted-foreground">...</span>
              ) : !item.href ? (
                <span className="text-muted-foreground">{item.label}</span>
              ) : (
                <Link
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {index === 0 && showHomeIcon ? <Home className="size-4" /> : item.label}
                </Link>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  )
}
