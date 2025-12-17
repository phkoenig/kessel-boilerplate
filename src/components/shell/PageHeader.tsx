"use client"

import { usePathname } from "next/navigation"
import { type LucideIcon } from "lucide-react"
import { navigationConfig, findNavItemByHref } from "@/config/navigation"

/**
 * PageHeader Props
 */
interface PageHeaderProps {
  /** Seiten-Titel */
  title: string
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
 * Holt automatisch das passende Icon aus der Navigation basierend auf
 * der aktuellen Route. Das Icon wird konsistent zur Navbar (Spalte 1) angezeigt.
 *
 * @example
 * ```tsx
 * // Automatisches Icon aus Navigation
 * <PageHeader title="Personalisierung" description="Passe das Erscheinungsbild an" />
 *
 * // Custom Icon
 * <PageHeader title="Dashboard" icon={LayoutDashboard} />
 * ```
 */
export function PageHeader({
  title,
  description,
  icon: customIcon,
  className,
}: PageHeaderProps): React.ReactElement {
  const pathname = usePathname()

  // Icon aus Navigation holen (falls kein Custom-Icon gesetzt)
  const navItem = customIcon ? null : findNavItemByHref(navigationConfig, pathname)
  const Icon = customIcon || navItem?.icon

  return (
    <div className={className}>
      <h1 className="text-foreground flex items-center gap-3 text-3xl font-bold tracking-tight">
        {Icon && <Icon className="size-8 shrink-0" />}
        <span>{title}</span>
      </h1>
      {description && <p className="text-muted-foreground mt-2">{description}</p>}
    </div>
  )
}
