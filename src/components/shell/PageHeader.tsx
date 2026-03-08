"use client"

import { usePathname } from "next/navigation"
import { createElement } from "react"
import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { resolveNavigationIcon, useNavigation } from "@/lib/navigation"

/**
 * PageHeader Props
 */
interface PageHeaderProps {
  /** Optional: Seiten-Titel (wird automatisch aus Navigation geholt wenn nicht gesetzt) */
  title?: string
  /** Optional: Beschreibung unter dem Titel */
  description?: string
  /** Optional: Custom Icon (überschreibt Navigation-Icon) */
  icon?: LucideIcon
  /** Zusätzliche CSS-Klassen */
  className?: string
}

/**
 * PageHeader Komponente
 *
 * Zentrale Komponente für Seiten-Header in Spalte 3 (Main Area).
 * Holt automatisch das passende Icon und den Titel aus der Navigation basierend auf
 * der aktuellen Route. Das Icon wird konsistent zur Navbar (Spalte 1) angezeigt.
 *
 * @example
 * ```tsx
 * // Automatisches Icon und Titel aus Navigation
 * <PageHeader description="Passe das Erscheinungsbild an" />
 *
 * // Custom Titel, automatisches Icon
 * <PageHeader title="Personalisierung" description="Passe das Erscheinungsbild an" />
 *
 * // Custom Icon
 * <PageHeader title="Dashboard" icon={LayoutDashboard} />
 * ```
 */
export function PageHeader({
  title: customTitle,
  description,
  icon: customIcon,
  className,
}: PageHeaderProps): React.ReactElement {
  const pathname = usePathname()
  const { findCurrentItem } = useNavigation()

  // Navigation-Item holen (für Icon und Titel)
  const navItem = customIcon ? null : findCurrentItem(pathname)

  // Titel: Custom oder aus Navigation
  const title = customTitle || navItem?.label || "Seite"
  const iconElement = customIcon
    ? createElement(customIcon, { className: "size-8 shrink-0" })
    : navItem?.iconName
      ? createElement(resolveNavigationIcon(navItem.iconName), { className: "size-8 shrink-0" })
      : null

  return (
    <div className={cn("mb-8", className)}>
      <h1 className="text-foreground flex items-center gap-4 text-3xl font-bold tracking-tight">
        {iconElement}
        <span>{title}</span>
      </h1>
      {description && <p className="text-muted-foreground mt-2">{description}</p>}
    </div>
  )
}
